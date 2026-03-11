// tests/e2e/posts/detail.spec.js
// 게시글 상세 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('게시글 상세', () => {
  let testUser;
  let testPost;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    testPost = await createTestPost(request, headers, {
      title: `상세테스트 ${Date.now()}`,
      content: '**마크다운** 본문 테스트입니다.',
    });
  });

  test('상세 페이지 렌더링 (제목, 본문, 작성자)', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`/detail?id=${testPost.postId}`);
    await page.waitForLoadState('networkidle');

    // 제목 확인
    const title = page.locator('#post-title');
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).toHaveText(testPost.title);

    // 본문 확인
    const content = page.locator('#post-content');
    await expect(content).toBeVisible();

    // 작성자 닉네임 확인
    const authorNickname = page.locator('#post-author-nickname');
    await expect(authorNickname).toBeVisible();
    await expect(authorNickname).toContainText(testUser.nickname);
  });

  test('마크다운 본문이 HTML로 렌더링', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`/detail?id=${testPost.postId}`);
    await page.waitForLoadState('networkidle');

    // post-content 영역에 마크다운 변환 결과 확인
    const content = page.locator('#post-content');
    await expect(content).toBeVisible({ timeout: 10000 });

    // **마크다운**이 <strong> 태그로 변환되었는지 확인
    const strongEl = content.locator('strong');
    await expect(strongEl).toBeVisible({ timeout: 5000 });
    await expect(strongEl).toHaveText('마크다운');
  });

  test('좋아요/북마크/조회수/댓글 통계 박스 표시', async ({ page }) => {
    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`/detail?id=${testPost.postId}`);
    await page.waitForLoadState('networkidle');

    // 통계 요소 존재 확인
    await expect(page.locator('#like-count')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#bookmark-count')).toBeVisible();
    await expect(page.locator('#view-count')).toBeVisible();
    await expect(page.locator('#comment-count')).toBeVisible();

    // 작성자 프로필 이미지 링크 확인
    await expect(page.locator('#post-author-img')).toBeVisible();
  });
});
