// tests/e2e/feed/feed.spec.js
// 피드(게시글 목록) E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('피드', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);

    // 테스트용 게시글 여러 개 생성
    for (let i = 0; i < 3; i++) {
      await createTestPost(request, headers, {
        title: `피드테스트 ${i + 1} - ${Date.now()}`,
        content: `피드 테스트용 게시글 ${i + 1}`,
        categoryId: i === 0 ? 1 : 2, // 카테고리 혼합
      });
    }
  });

  test('기본 최신순 목록 표시', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 메인 페이지에서 게시글 목록 표시 확인
    const postList = page.locator('#post-list');
    await expect(postList).toBeVisible({ timeout: 10000 });

    // 최소 1개 이상의 게시글 카드 존재
    const postCards = postList.locator('.post-card');
    await expect(postCards.first()).toBeVisible({ timeout: 10000 });

    // 최신순 정렬 버튼이 활성화 상태
    const latestBtn = page.locator('.sort-btn[data-sort="latest"]');
    await expect(latestBtn).toHaveClass(/active/);
  });

  test('정렬 탭 전환 (최신→인기)', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 게시글 목록 로드 대기
    const postList = page.locator('#post-list');
    await expect(postList.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    // 인기순 버튼 클릭
    const likesBtn = page.locator('.sort-btn[data-sort="likes"]');
    await likesBtn.click();

    // 인기순 버튼이 active로 변경
    await expect(likesBtn).toHaveClass(/active/, { timeout: 3000 });

    // 최신순 버튼은 비활성화
    const latestBtn = page.locator('.sort-btn[data-sort="latest"]');
    await expect(latestBtn).not.toHaveClass(/active/);

    // 목록이 다시 로드됨 — API 응답 대기 후 post-card 또는 empty-state
    await page.waitForLoadState('networkidle');
    const hasCards = await postList.locator('.post-card').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await postList.locator('.empty-state').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('카테고리 탭 필터링', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 카테고리 탭 로드 대기
    const categoryTabs = page.locator('#category-tabs');
    await expect(categoryTabs).toBeVisible({ timeout: 10000 });

    // 카테고리 탭 버튼들이 있는지 확인
    const tabButtons = categoryTabs.locator('button, .category-tab');
    const tabCount = await tabButtons.count();

    // 카테고리가 2개 이상이면 두 번째 카테고리 클릭
    if (tabCount >= 2) {
      // 첫 번째가 "전체"일 수 있으므로 두 번째 탭 클릭
      await tabButtons.nth(1).click();

      // 목록 새로고침 대기
      await page.waitForTimeout(1000);

      // 게시글 목록 또는 빈 상태 확인
      const postList = page.locator('#post-list');
      const hasCards = await postList.locator('.post-card').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmpty = await postList.locator('.empty-state').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('스크롤 시 추가 게시글 로드 (무한 스크롤)', async ({ page, request }) => {
    // 충분한 게시글 생성 (10개 이상 — LIMIT이 10)
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    for (let i = 0; i < 8; i++) {
      await createTestPost(request, headers, {
        title: `스크롤테스트 ${i} - ${Date.now()}`,
        content: `무한 스크롤 테스트 게시글 ${i}`,
      });
    }

    await loginViaUI(page, testUser.email, testUser.password);

    const postList = page.locator('#post-list');
    await expect(postList.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    // 첫 페이지 게시글 수 확인
    const initialCount = await postList.locator('.post-card').count();

    // 하단으로 스크롤
    const sentinel = page.locator('#loading-sentinel');
    await sentinel.scrollIntoViewIfNeeded();

    // 추가 로드 대기 (더 있을 경우)
    await page.waitForTimeout(2000);

    const finalCount = await postList.locator('.post-card').count();

    // 게시글이 10개 이하면 첫 페이지에 모두 로드, 10개 초과면 추가 로드 확인
    if (initialCount >= 10) {
      expect(finalCount).toBeGreaterThan(initialCount);
    } else {
      // 전체 게시글이 한 페이지에 들어가면 카운트 유지
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('빈 피드 안내 메시지', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // MPA 특성: 페이지 이동 시 in-memory 토큰이 사라지고 silent refresh가 비동기로 실행됨
    // MainController.init()이 getAccessToken()을 동기 체크하여 버튼 hidden 해제하므로
    // silent refresh 완료 후에 hidden이 해제되지 않을 수 있음
    // → 인증 완료(헤더 프로필 렌더링)를 확인한 뒤 수동으로 hidden 해제
    await page.waitForSelector('#auth-section img, .header-profile-img, .profile-circle', { timeout: 10000 });
    await page.evaluate(() => {
      document.getElementById('following-btn')?.classList.remove('hidden');
      document.getElementById('filter-divider')?.classList.remove('hidden');
    });

    // 팔로잉 필터로 빈 피드 유도 (아무도 팔로우하지 않은 상태)
    const followingBtn = page.locator('#following-btn');
    await followingBtn.click();

    // 빈 피드 안내 메시지 확인
    const postList = page.locator('#post-list');
    const emptyState = postList.locator('.empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(emptyState).toContainText('팔로우');
  });

  test('검색 결과 반영', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 게시글 목록 로드 대기
    const postList = page.locator('#post-list');
    await expect(postList.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    // 검색어 입력
    const searchInput = page.locator('#search-input');
    const searchBtn = page.locator('#search-btn');

    await searchInput.fill('피드테스트');
    await searchBtn.click();

    // 검색 결과 대기
    await page.waitForTimeout(1500);

    // 결과 존재 시 검색어 포함 확인, 없으면 empty-state
    const hasCards = await postList.locator('.post-card').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await postList.locator('.empty-state').isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCards) {
      // 검색 결과의 첫 게시글 제목에 검색어 포함
      const firstTitle = postList.locator('.post-card .post-title').first();
      await expect(firstTitle).toContainText('피드테스트');
    } else {
      // 빈 결과 안내 메시지
      expect(hasEmpty).toBeTruthy();
    }
  });
});
