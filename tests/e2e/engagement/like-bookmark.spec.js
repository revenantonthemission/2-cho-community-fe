// tests/e2e/engagement/like-bookmark.spec.js
// 좋아요/북마크 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('좋아요/북마크', () => {
  let testUser;
  let testPost;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    testPost = await createTestPost(request, headers, {
      title: `좋아요테스트 ${Date.now()}`,
      content: '좋아요/북마크 테스트용 게시글입니다.',
    });
  });

  test('좋아요 클릭 → 낙관적 UI 변경', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // React SPA: PostActionBar — .stat-box 버튼 (좋아요)
    const likeBox = page.locator('.stat-box[aria-label="좋아요"]');
    await expect(likeBox).toBeVisible({ timeout: 10000 });

    // 좋아요 전 카운트 확인
    const countBefore = parseInt(await likeBox.locator('.stat-value').textContent()) || 0;

    // 좋아요 클릭
    await likeBox.click();

    // 낙관적 UI: 카운트 변경
    await expect(likeBox.locator('.stat-value')).toHaveText(String(countBefore + 1), { timeout: 3000 });

    // 좋아요 취소
    await likeBox.click();

    // 카운트 원복
    await expect(likeBox.locator('.stat-value')).toHaveText(String(countBefore), { timeout: 3000 });
  });

  test('북마크 토글', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // React SPA: PostActionBar — .stat-box 버튼 (북마크)
    const bookmarkBox = page.locator('.stat-box[aria-label="북마크"]');
    await expect(bookmarkBox).toBeVisible({ timeout: 10000 });

    // 북마크 클릭
    await bookmarkBox.click();

    // 낙관적 UI: 아이콘 변경 (fill 속성 변경)
    await page.waitForTimeout(500);

    // 북마크 해제
    await bookmarkBox.click();
    await page.waitForTimeout(500);
  });

  test('비로그인 시 상세 페이지 접근 → 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 비로그인 상태로 상세 페이지 접근
    await page.goto(`/detail/${testPost.postId}`);

    // React SPA AuthGuard: 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
  });
});
