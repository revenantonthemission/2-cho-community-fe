// tests/e2e/dm/dm.spec.js
// DM(쪽지) E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginViaApi,
  API_BASE,
} from '../fixtures/test-helpers.js';

test.describe('DM (쪽지)', () => {
  let userA; // 메시지를 보내는 사용자
  let userB; // 메시지를 받는 사용자
  let conversationId;

  test.beforeAll(async ({ request }) => {
    // 두 명의 테스트 사용자 생성
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    // userA가 userB에게 대화 생성 + 메시지 전송 (API)
    const { headers: headersA } = await loginViaApi(request, userA.email, userA.password);
    const convRes = await request.post(`${API_BASE}/v1/dms`, {
      headers: headersA,
      data: { recipient_id: userB.userId },
    });
    const convBody = await convRes.json();
    conversationId = convBody?.data?.conversation_id;

    // 메시지 전송
    if (conversationId) {
      await request.post(`${API_BASE}/v1/dms/${conversationId}/messages`, {
        headers: headersA,
        data: { content: '안녕하세요! 테스트 메시지입니다.' },
      });
    }
  });

  test('대화 목록 페이지 렌더링 (데스크톱 통합 레이아웃)', async ({ page }) => {
    // 데스크톱 뷰포트(>=768px)에서는 /messages/inbox로 리다이렉트
    await loginViaUI(page, userB.email, userB.password);
    await page.goto('/messages/inbox');
    await page.waitForLoadState('networkidle');

    // 대화 목록 영역 확인
    const dmList = page.locator('#dm-list');
    await expect(dmList).toBeVisible({ timeout: 10000 });

    // 페이지 타이틀 확인
    await expect(page.locator('.page-title')).toContainText('메시지');
  });

  test('대화 목록에 기존 대화가 표시됨', async ({ page }) => {
    await loginViaUI(page, userB.email, userB.password);
    await page.goto('/messages/inbox');
    await page.waitForLoadState('networkidle');

    // 대화 카드가 최소 1개 이상 표시
    const dmList = page.locator('#dm-list');
    const conversationCards = dmList.locator('[data-id]');
    await expect(conversationCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('대화 상세 페이지에서 메시지 표시', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    await loginViaUI(page, userB.email, userB.password);
    await page.goto(`/messages/detail?id=${conversationId}`);
    await page.waitForLoadState('networkidle');

    // 메시지 영역 확인
    const messagesEl = page.locator('#dm-messages');
    await expect(messagesEl).toBeVisible({ timeout: 10000 });

    // 전송된 메시지가 표시되는지 확인
    await expect(messagesEl).toContainText('안녕하세요', { timeout: 10000 });
  });

  test('메시지 입력 및 전송', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    await loginViaUI(page, userB.email, userB.password);
    await page.goto(`/messages/detail?id=${conversationId}`);
    await page.waitForLoadState('networkidle');

    // 에디터 영역 확인
    const textarea = page.locator('.dm-editor-textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // 메시지 입력
    const newMessage = `답장 테스트 ${Date.now()}`;
    await textarea.fill(newMessage);

    // 전송 버튼 클릭
    const sendBtn = page.locator('#dm-send-btn');
    await sendBtn.click();

    // 메시지가 목록에 추가됨
    const messagesEl = page.locator('#dm-messages');
    await expect(messagesEl).toContainText('답장 테스트', { timeout: 10000 });

    // 입력창 비워짐
    await expect(textarea).toHaveValue('', { timeout: 5000 });
  });

  test('대화 상세의 뒤로가기 버튼 동작', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    await loginViaUI(page, userB.email, userB.password);
    await page.goto(`/messages/detail?id=${conversationId}`);
    await page.waitForLoadState('networkidle');

    // 뒤로가기 버튼 클릭
    const backBtn = page.locator('#back-btn');
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    // DM 목록 페이지로 이동 확인
    await expect(page).toHaveURL(/.*messages/, { timeout: 10000 });
  });

  test('닉네임 검색으로 대화 필터링', async ({ page }) => {
    await loginViaUI(page, userB.email, userB.password);
    await page.goto('/messages/inbox');
    await page.waitForLoadState('networkidle');

    // 대화 카드가 로드될 때까지 대기
    const dmList = page.locator('#dm-list');
    await expect(dmList.locator('[data-id]').first()).toBeVisible({ timeout: 10000 });

    // 검색 입력
    const searchInput = page.locator('#dm-search');
    await expect(searchInput).toBeVisible();

    // 존재하지 않는 닉네임 검색 → 카드 숨겨짐
    await searchInput.fill('존재하지않는닉네임999');
    await searchInput.dispatchEvent('input');

    // 모든 카드가 hidden 클래스를 가지거나 비어있어야 함
    const visibleCards = dmList.locator('[data-id]:not(.hidden)');
    await expect(visibleCards).toHaveCount(0, { timeout: 5000 });
  });

  test('빈 대화 목록 안내 메시지', async ({ page, request }) => {
    // 대화가 없는 새 사용자 생성
    const newUser = await createTestUser(request);
    await loginViaUI(page, newUser.email, newUser.password);
    await page.goto('/messages/inbox');
    await page.waitForLoadState('networkidle');

    // 빈 상태 메시지 확인
    const emptyEl = page.locator('#dm-empty');
    // display:none이 아닌 상태로 전환되어야 함
    await expect(emptyEl).toContainText('아직 대화가 없습니다', { timeout: 10000 });
  });
});
