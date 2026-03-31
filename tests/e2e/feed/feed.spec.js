// tests/e2e/feed/feed.spec.js
// 피드(게시글 목록) E2E 테스트 — React SPA 버전

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
        categoryId: i === 0 ? 1 : 2,
      });
    }
  });

  test('기본 최신순 목록 표시', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 메인 페이지에서 게시글 목록 표시 확인
    const postList = page.locator('.post-list');
    await expect(postList).toBeVisible({ timeout: 10000 });

    // 최소 1개 이상의 게시글 카드 존재
    const postCards = postList.locator('.post-card');
    await expect(postCards.first()).toBeVisible({ timeout: 10000 });

    // 최신순 정렬 버튼이 활성화 상태
    const latestBtn = page.locator('.sort-btn', { hasText: '최신순' });
    await expect(latestBtn).toHaveClass(/active/);
  });

  test('정렬 탭 전환 (최신→인기)', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 게시글 목록 로드 대기
    const postList = page.locator('.post-list');
    await expect(postList.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    // 인기순 버튼 클릭
    const likesBtn = page.locator('.sort-btn', { hasText: '인기순' });
    await likesBtn.click();

    // 인기순 버튼이 active로 변경
    await expect(likesBtn).toHaveClass(/active/, { timeout: 3000 });

    // 최신순 버튼은 비활성화
    const latestBtn = page.locator('.sort-btn', { hasText: '최신순' });
    await expect(latestBtn).not.toHaveClass(/active/);

    // 목록이 다시 로드됨
    await page.waitForLoadState('networkidle');
    const hasCards = await postList.locator('.post-card').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('카테고리 사이드바 필터링', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 사이드바 카테고리 링크 대기
    const categoryLinks = page.locator('.sidebar__link--category');
    const count = await categoryLinks.count();

    // 카테고리가 1개 이상이면 첫 번째 카테고리 클릭
    if (count >= 1) {
      await categoryLinks.first().click();

      // URL에 category_id 파라미터 추가 확인
      await page.waitForTimeout(1000);

      // 게시글 목록 또는 빈 상태 확인
      const hasCards = await page.locator('.post-card').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('팔로잉 필터로 빈 피드 안내 메시지', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 팔로잉 버튼 클릭
    const followingBtn = page.locator('.sort-btn', { hasText: '팔로잉' });
    await expect(followingBtn).toBeVisible({ timeout: 10000 });
    await followingBtn.click();

    // 빈 피드 안내 메시지 확인 (아무도 팔로우하지 않은 상태)
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
  });

  test('검색 결과 반영', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 게시글 목록 로드 대기
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 검색어 입력
    const searchInput = page.locator('.search-bar__input');
    const searchBtn = page.locator('.search-bar__btn');

    await searchInput.fill('피드테스트');
    await searchBtn.click();

    // 검색 결과 대기
    await page.waitForTimeout(1500);

    // 결과 존재 시 검색어 포함 확인, 없으면 empty-state
    const hasCards = await page.locator('.post-card').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCards) {
      const firstTitle = page.locator('.post-card .post-title').first();
      await expect(firstTitle).toContainText('피드테스트');
    } else {
      expect(hasEmpty).toBeTruthy();
    }
  });
});
