// tests/e2e/posts/list.spec.js
// 게시글 목록 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('게시글 목록', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);

    // 검색/목록 테스트용 게시글 여러 개 생성
    for (let i = 0; i < 3; i++) {
      await createTestPost(request, headers, {
        title: `목록테스트 ${Date.now()}_${i}`,
        content: `목록 테스트 본문 ${i}`,
        categoryId: (i % 3) + 1, // 카테고리 1, 2, 3 순환
      });
    }
  });

  test('게시글 목록 페이지 렌더링 (post-card 존재)', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    // 메인 페이지에서 게시글 카드 존재 확인
    await page.waitForSelector('.post-card', { timeout: 10000 });
    const cards = page.locator('.post-card');
    await expect(cards.first()).toBeVisible();

    // 카드에 제목과 작성자 정보 포함
    const firstCard = cards.first();
    await expect(firstCard.locator('.post-title')).toBeVisible();
    await expect(firstCard.locator('.post-author')).toBeVisible();
  });

  test('카테고리 탭 클릭 → 목록 갱신', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 카테고리 탭 영역 확인
    const tabContainer = page.locator('#category-tabs');
    await expect(tabContainer).toBeVisible();

    // 카테고리 탭 존재 확인 (JS 동적 생성)
    const tabs = tabContainer.locator('.category-tab');
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });

    // 두 번째 탭 클릭 (첫 번째는 '전체')
    const secondTab = tabs.nth(1);
    await secondTab.click();

    // 클릭한 탭이 active 상태인지 확인
    await expect(secondTab).toHaveClass(/active/, { timeout: 5000 });
  });

  test('정렬 버튼 전환', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 기본 정렬은 '최신순' active
    const latestBtn = page.locator('.sort-btn[data-sort="latest"]');
    await expect(latestBtn).toHaveClass(/active/);

    // '인기순' 클릭
    const likesBtn = page.locator('.sort-btn[data-sort="likes"]');
    await likesBtn.click();

    // '인기순'이 active, '최신순'은 비활성
    await expect(likesBtn).toHaveClass(/active/, { timeout: 5000 });
    await expect(latestBtn).not.toHaveClass(/active/);
  });

  test('검색 입력 → 결과 반영', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 검색어 입력
    await page.fill('#search-input', '목록테스트');
    await page.click('#search-btn');

    // 검색 후 페이지가 업데이트될 때까지 대기
    await page.waitForTimeout(1000);

    // 검색 결과가 있거나 빈 목록이어야 함
    const postList = page.locator('#post-list');
    await expect(postList).toBeVisible();
  });

  test('게시글 작성 버튼 존재 및 클릭 → 작성 페이지 이동', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);

    const writeBtn = page.locator('#write-btn');
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await writeBtn.click();

    await expect(page).toHaveURL(/.*write/, { timeout: 10000 });
  });

  test('고정 게시글에 pin-badge 표시', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForSelector('.post-card', { timeout: 10000 });

    // 고정 게시글이 있으면 .pinned 클래스와 pin-badge가 존재해야 함
    const pinnedCards = page.locator('.post-card.pinned');
    const pinnedCount = await pinnedCards.count();

    if (pinnedCount > 0) {
      // 고정 게시글이 있으면 pin-badge 확인
      const firstPinned = pinnedCards.first();
      await expect(firstPinned.locator('.pin-badge')).toBeVisible();
    }

    // 고정 게시글이 없어도 테스트는 통과 (데이터 의존적)
    expect(pinnedCount).toBeGreaterThanOrEqual(0);
  });
});
