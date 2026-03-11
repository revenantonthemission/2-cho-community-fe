// tests/e2e/notifications/notifications.spec.js
// 알림 페이지 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginViaApi,
  createTestPost,
  API_BASE,
} from '../fixtures/test-helpers.js';

test.describe('알림', () => {
  let postAuthor;
  let commenter;
  let testPost;

  test.beforeAll(async ({ request }) => {
    // 게시글 작성자 + 댓글 작성자 생성
    postAuthor = await createTestUser(request);
    commenter = await createTestUser(request);

    // 게시글 작성
    const { headers: authorHeaders } = await loginViaApi(
      request, postAuthor.email, postAuthor.password
    );
    testPost = await createTestPost(request, authorHeaders, {
      title: `알림테스트 ${Date.now()}`,
      content: '알림 테스트용 게시글',
    });

    // 다른 사용자가 댓글 작성 → 게시글 작성자에게 알림 생성
    const { headers: commenterHeaders } = await loginViaApi(
      request, commenter.email, commenter.password
    );
    await request.post(`${API_BASE}/v1/posts/${testPost.postId}/comments`, {
      headers: commenterHeaders,
      data: { content: '알림 발생용 댓글입니다.' },
    });
  });

  test('알림 페이지 렌더링', async ({ page }) => {
    await loginViaUI(page, postAuthor.email, postAuthor.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // 페이지 타이틀 확인
    await expect(page.locator('.notification-header h1')).toContainText('알림');

    // 알림 목록 영역 존재 확인
    const listEl = page.locator('#notification-list');
    await expect(listEl).toBeVisible({ timeout: 10000 });
  });

  test('알림 항목이 표시됨 (댓글 알림)', async ({ page }) => {
    await loginViaUI(page, postAuthor.email, postAuthor.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // 알림 항목이 최소 1개 이상 존재
    const items = page.locator('.notification-item');
    await expect(items.first()).toBeVisible({ timeout: 10000 });

    // 댓글 알림 내용 확인 (댓글을 남겼습니다)
    await expect(items.first()).toContainText('댓글을 남겼습니다');
  });

  test('전체 읽음 처리 버튼', async ({ page }) => {
    await loginViaUI(page, postAuthor.email, postAuthor.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // 읽지 않은 알림이 있는지 확인
    const unreadItems = page.locator('.notification-item.unread');
    const hasUnread = await unreadItems.count() > 0;

    // 모두 읽음 버튼 클릭
    const markAllBtn = page.locator('#mark-all-read-btn');
    await expect(markAllBtn).toBeVisible({ timeout: 10000 });
    await markAllBtn.click();

    // 읽지 않은 항목이 0개가 되어야 함
    if (hasUnread) {
      await expect(unreadItems).toHaveCount(0, { timeout: 10000 });
    }
  });

  test('알림 삭제', async ({ page }) => {
    await loginViaUI(page, postAuthor.email, postAuthor.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // 알림 항목이 있는지 확인
    const items = page.locator('.notification-item');
    await expect(items.first()).toBeVisible({ timeout: 10000 });

    const countBefore = await items.count();

    // 첫 번째 알림의 삭제 버튼 클릭
    const deleteBtn = items.first().locator('.notification-delete-btn');
    await deleteBtn.click();

    // 항목 개수 감소 확인
    await expect(items).toHaveCount(countBefore - 1, { timeout: 10000 });
  });

  test('빈 알림 목록 안내 메시지', async ({ page, request }) => {
    // 알림이 없는 새 사용자 생성
    const freshUser = await createTestUser(request);
    await loginViaUI(page, freshUser.email, freshUser.password);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // 빈 상태 메시지 확인
    const emptyEl = page.locator('#notification-empty');
    await expect(emptyEl).not.toHaveClass(/hidden/, { timeout: 10000 });
    await expect(emptyEl).toContainText('알림이 없습니다');
  });
});
