// tests/e2e/posts/detail.spec.js
// 게시글 상세 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
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
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // 제목 확인
    const title = page.locator('.detail-title');
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).toHaveText(testPost.title);

    // 본문 확인
    const content = page.locator('.post-body');
    await expect(content).toBeVisible();

    // 작성자 닉네임 확인
    const authorNickname = page.locator('.author-nickname');
    await expect(authorNickname).toBeVisible();
    await expect(authorNickname).toContainText(testUser.nickname);
  });

  test('마크다운 본문이 HTML로 렌더링', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // post-body 영역에 마크다운 변환 결과 확인
    const content = page.locator('.post-body');
    await expect(content).toBeVisible({ timeout: 10000 });

    // **마크다운**이 <strong> 태그로 변환되었는지 확인
    const strongEl = content.locator('strong');
    await expect(strongEl).toBeVisible({ timeout: 5000 });
    await expect(strongEl).toHaveText('마크다운');
  });

  test('좋아요/북마크/조회수/댓글 통계 박스 표시', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // React SPA: PostActionBar의 .stat-box 요소 확인
    const statBoxes = page.locator('.stat-box');
    await expect(statBoxes.first()).toBeVisible({ timeout: 10000 });

    // 최소 4개의 통계 박스 (좋아요, 북마크, 조회수, 댓글)
    const count = await statBoxes.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // 작성자 프로필 이미지 영역 확인
    await expect(page.locator('.author-profile-img')).toBeVisible();
  });
});
