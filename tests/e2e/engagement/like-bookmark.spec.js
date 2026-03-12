// tests/e2e/engagement/like-bookmark.spec.js
// 좋아요/북마크 E2E 테스트

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

  test('좋아요 클릭 → 카운트 즉시 변경 (낙관적 UI)', async ({ page }) => {
    await loginAndNavigate(page, `/detail?id=${testPost.postId}`, testUser.email, testUser.password);

    const likeBox = page.locator('#like-box');
    const likeCount = page.locator('#like-count');
    await expect(likeBox).toBeVisible({ timeout: 10000 });

    // 좋아요 전 카운트 확인
    const countBefore = parseInt(await likeCount.textContent()) || 0;

    // 좋아요 클릭
    await likeBox.click();

    // 낙관적 UI: 즉시 active 클래스 추가 + 카운트 증가
    await expect(likeBox).toHaveClass(/active/, { timeout: 3000 });
    await expect(likeCount).toHaveText(String(countBefore + 1), { timeout: 3000 });

    // 좋아요 취소
    await likeBox.click();

    // active 클래스 제거 + 카운트 감소
    await expect(likeBox).not.toHaveClass(/active/, { timeout: 3000 });
    await expect(likeCount).toHaveText(String(countBefore), { timeout: 3000 });
  });

  test('북마크 토글 → 아이콘 상태 전환', async ({ page }) => {
    await loginAndNavigate(page, `/detail?id=${testPost.postId}`, testUser.email, testUser.password);

    const bookmarkBox = page.locator('#bookmark-box');
    const bookmarkCount = page.locator('#bookmark-count');
    await expect(bookmarkBox).toBeVisible({ timeout: 10000 });

    const countBefore = parseInt(await bookmarkCount.textContent()) || 0;

    // 북마크 클릭
    await bookmarkBox.click();

    // 낙관적 UI: active 클래스 추가 + 카운트 증가
    await expect(bookmarkBox).toHaveClass(/active/, { timeout: 3000 });
    await expect(bookmarkCount).toHaveText(String(countBefore + 1), { timeout: 3000 });

    // 북마크 해제
    await bookmarkBox.click();

    // active 클래스 제거 + 카운트 감소
    await expect(bookmarkBox).not.toHaveClass(/active/, { timeout: 3000 });
    await expect(bookmarkCount).toHaveText(String(countBefore), { timeout: 3000 });
  });

  test('비로그인 시 상세 페이지 접근 → 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 비로그인 상태로 상세 페이지 접근
    // HeaderController.init()이 비인증 사용자를 로그인 페이지로 리다이렉트
    await page.goto(`/detail?id=${testPost.postId}`);

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
  });
});
