// tests/e2e/posts/edit-delete.spec.js
// 게시글 수정/삭제 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('게시글 수정/삭제', () => {
  let ownerUser;
  let otherUser;
  let editPost;
  let deletePost;

  test.beforeAll(async ({ request }) => {
    ownerUser = await createTestUser(request);
    otherUser = await createTestUser(request);

    const { headers } = await loginViaApi(request, ownerUser.email, ownerUser.password);

    // 수정용 게시글
    editPost = await createTestPost(request, headers, {
      title: `수정테스트 ${Date.now()}`,
      content: '수정 전 원본 내용입니다.',
    });

    // 삭제용 게시글
    deletePost = await createTestPost(request, headers, {
      title: `삭제테스트 ${Date.now()}`,
      content: '삭제될 게시글 내용입니다.',
    });
  });

  test('수정 버튼 클릭 → 에디터에 기존 내용 프리필', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${editPost.postId}`, ownerUser.email, ownerUser.password);

    // 수정 버튼 확인 및 클릭 (React SPA: .action-btn 링크)
    const editBtn = page.locator('.post-actions .action-btn', { hasText: '수정' });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // 수정 페이지로 이동 확인
    await expect(page).toHaveURL(/.*edit/, { timeout: 10000 });

    // 기존 제목이 프리필되어 있는지 확인
    const titleInput = page.locator('input#post-title');
    await expect(titleInput).toHaveValue(editPost.title, { timeout: 10000 });
  });

  test('삭제 확인 후 홈으로 이동', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${deletePost.postId}`, ownerUser.email, ownerUser.password);

    // React SPA: window.confirm 사용 — 자동 수락 설정
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 삭제 버튼 클릭
    const deleteBtn = page.locator('.post-actions .action-btn', { hasText: '삭제' });
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // 홈(/)으로 이동 확인
    await page.waitForURL('**/', { timeout: 10000 });
  });

  test('타인 글에 수정/삭제 버튼 미표시', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${editPost.postId}`, otherUser.email, otherUser.password);

    // 제목 로드 대기
    await expect(page.locator('.detail-title')).toBeVisible({ timeout: 10000 });

    // 수정/삭제 버튼이 보이지 않아야 함 (.post-actions 영역 자체가 없음)
    const postActions = page.locator('.post-actions');
    await expect(postActions).toBeHidden();
  });
});
