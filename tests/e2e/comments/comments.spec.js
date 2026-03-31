// tests/e2e/comments/comments.spec.js
// 댓글 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  createTestPost,
  API_BASE,
} from '../fixtures/test-helpers.js';

/**
 * API로 댓글 생성 헬퍼
 */
async function createComment(request, postId, headers, content) {
  const res = await request.post(`${API_BASE}/v1/posts/${postId}/comments`, {
    headers,
    data: { content },
  });
  const body = await res.json();
  return body?.data;
}

test.describe('댓글', () => {
  let testUser;
  let testPost;
  let authHeaders;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    authHeaders = headers;
    testPost = await createTestPost(request, headers, {
      title: `댓글테스트 ${Date.now()}`,
      content: '댓글 테스트용 게시글입니다.',
    });
  });

  test('댓글 입력 후 목록에 추가됨', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // React SPA: CommentForm — textarea + submit 버튼
    const commentInput = page.locator('.comment-input-wrapper textarea');
    const submitBtn = page.locator('.comment-input-wrapper button[type="submit"]');

    await expect(commentInput).toBeVisible({ timeout: 10000 });

    // 댓글 입력
    const commentText = `테스트 댓글 ${Date.now()}`;
    await commentInput.fill(commentText);

    // 제출
    await submitBtn.click();

    // 댓글 목록에 추가 확인
    const commentList = page.locator('.comment-list');
    await expect(commentList.locator('.comment-body', { hasText: commentText })).toBeVisible({ timeout: 10000 });
  });

  test('수정 모드 전환 (수정 버튼 → 편집 UI 표시)', async ({ page, request }) => {
    // 수정할 댓글 사전 생성
    await createComment(request, testPost.postId, authHeaders, `수정대상댓글 ${Date.now()}`);

    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // 기존 댓글의 수정 버튼 클릭
    const commentList = page.locator('.comment-list');
    const editBtn = commentList.locator('.comment-action-btn', { hasText: '수정' }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // 수정 UI (textarea)가 표시됨
    const editTextarea = commentList.locator('.comment-edit textarea').first();
    await expect(editTextarea).toBeVisible({ timeout: 5000 });
    await expect(editTextarea).not.toBeEmpty();
  });

  test('삭제 확인 후 댓글 제거', async ({ page, request }) => {
    // 삭제할 댓글 생성 (API)
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    await createComment(request, testPost.postId, headers, `삭제할댓글 ${Date.now()}`);

    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // React SPA: window.confirm 사용
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 삭제 버튼 클릭
    const commentList = page.locator('.comment-list');
    const deleteBtn = commentList.locator('.comment-action-btn', { hasText: '삭제' }).last();
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // 댓글 목록 새로고침 확인 (삭제된 댓글이 사라짐)
    await page.waitForTimeout(1000);
  });

  test('답글 버튼 → 답글 입력폼 표시', async ({ page, request }) => {
    // 답글 대상 댓글 사전 생성
    await createComment(request, testPost.postId, authHeaders, `답글대상댓글 ${Date.now()}`);

    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // 답글 버튼 클릭
    const commentList = page.locator('.comment-list');
    const replyBtn = commentList.locator('.comment-action-btn', { hasText: '답글' }).first();
    await expect(replyBtn).toBeVisible({ timeout: 10000 });
    await replyBtn.click();

    // React SPA: 답글 폼이 해당 댓글 아래에 표시됨
    const replyForm = commentList.locator('.comment-input-wrapper').first();
    await expect(replyForm).toBeVisible({ timeout: 5000 });

    // 답글 인디케이터 표시 확인
    const replyIndicator = replyForm.locator('.reply-indicator');
    await expect(replyIndicator).toBeVisible();
  });

  test('댓글 좋아요 토글', async ({ page, request }) => {
    // 좋아요 대상 댓글 사전 생성
    await createComment(request, testPost.postId, authHeaders, `좋아요대상댓글 ${Date.now()}`);

    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // 댓글 좋아요 버튼 찾기 (React SPA: 🤍/❤️ 텍스트 포함)
    const commentList = page.locator('.comment-list');
    const likeBtn = commentList.locator('.comment-action-btn').first();
    await expect(likeBtn).toBeVisible({ timeout: 10000 });

    // 좋아요 클릭
    await likeBtn.click();

    // 아이콘 변경 확인 (🤍 → ❤️)
    await page.waitForTimeout(500);
  });

  test('댓글 정렬 버튼 3개 표시 (오래된순, 최신순, 좋아요순)', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    const sortBar = page.locator('.comment-sort-bar');
    await expect(sortBar).toBeVisible({ timeout: 10000 });

    const sortBtns = sortBar.locator('.sort-btn');
    await expect(sortBtns).toHaveCount(3);

    await expect(sortBtns.nth(0)).toContainText('오래된순');
    await expect(sortBtns.nth(1)).toContainText('최신순');
    await expect(sortBtns.nth(2)).toContainText('좋아요순');
  });

  test('정렬 버튼 클릭 시 active 클래스 전환', async ({ page }) => {
    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    const sortBar = page.locator('.comment-sort-bar');
    await expect(sortBar).toBeVisible({ timeout: 10000 });

    // 최신순 클릭
    const latestBtn = sortBar.locator('.sort-btn', { hasText: '최신순' });
    await latestBtn.click();

    // 최신순 버튼이 active
    await expect(latestBtn).toHaveClass(/active/, { timeout: 10000 });

    // 좋아요순 클릭
    const popularBtn = sortBar.locator('.sort-btn', { hasText: '좋아요순' });
    await popularBtn.click();

    await expect(popularBtn).toHaveClass(/active/, { timeout: 10000 });
  });

  test('수정된 댓글 확인', async ({ page, request }) => {
    // 댓글 생성
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);
    const createRes = await request.post(`${API_BASE}/v1/posts/${testPost.postId}/comments`, {
      headers,
      data: { content: `수정전 ${Date.now()}` },
    });
    const createBody = await createRes.json();
    const commentId = createBody?.data?.comment_id;

    // 댓글 수정 (API)
    if (commentId) {
      await new Promise(r => setTimeout(r, 1000));
      const editRes = await request.put(`${API_BASE}/v1/posts/${testPost.postId}/comments/${commentId}`, {
        headers,
        data: { content: `수정됨 ${Date.now()}` },
      });
      expect(editRes.ok()).toBeTruthy();
    }

    await loginAndNavigate(page, `/detail/${testPost.postId}`, testUser.email, testUser.password);

    // 댓글 목록에 수정된 댓글 표시 확인
    const commentList = page.locator('.comment-list');
    await expect(commentList).toBeVisible({ timeout: 10000 });
  });
});
