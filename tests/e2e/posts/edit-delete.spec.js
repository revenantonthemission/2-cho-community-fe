// tests/e2e/posts/edit-delete.spec.js
// 게시글 수정/삭제 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
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
    await loginViaUI(page, ownerUser.email, ownerUser.password);
    await page.goto(`/detail?id=${editPost.postId}`);
    await page.waitForLoadState('networkidle');

    // 수정 버튼 확인 및 클릭
    const editBtn = page.locator('#edit-post-btn');
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // 수정 페이지로 이동 확인
    await expect(page).toHaveURL(/.*edit/, { timeout: 10000 });

    // 기존 제목이 프리필되어 있는지 확인
    const titleInput = page.locator('#post-title');
    await expect(titleInput).toHaveValue(editPost.title, { timeout: 10000 });

    // 기존 내용이 프리필되어 있는지 확인
    const contentArea = page.locator('#post-content');
    await expect(contentArea).toHaveValue('수정 전 원본 내용입니다.', { timeout: 10000 });
  });

  test('삭제 확인 모달 표시 및 삭제 실행', async ({ page }) => {
    await loginViaUI(page, ownerUser.email, ownerUser.password);
    await page.goto(`/detail?id=${deletePost.postId}`);
    await page.waitForLoadState('networkidle');

    // 삭제 버튼 클릭
    const deleteBtn = page.locator('#delete-post-btn');
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // 삭제 확인 모달 표시
    const modal = page.locator('#confirm-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 모달 제목 확인
    await expect(page.locator('#modal-title')).toContainText('삭제');

    // 확인 버튼 클릭
    await page.click('#modal-confirm-btn');

    // 메인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*main/, { timeout: 10000 });
  });

  test('타인 글에 수정/삭제 버튼 미표시', async ({ page }) => {
    await loginViaUI(page, otherUser.email, otherUser.password);
    await page.goto(`/detail?id=${editPost.postId}`);
    await page.waitForLoadState('networkidle');

    // 제목 로드 대기
    await expect(page.locator('#post-title')).not.toHaveText('Loading...', {
      timeout: 10000,
    });

    // 수정/삭제 버튼이 보이지 않아야 함
    const editBtn = page.locator('#edit-post-btn');
    const deleteBtn = page.locator('#delete-post-btn');

    await expect(editBtn).toBeHidden();
    await expect(deleteBtn).toBeHidden();
  });
});
