// tests/e2e/dm/dm.spec.js
// DM(쪽지) E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  API_BASE,
} from '../fixtures/test-helpers.js';

test.describe('DM (쪽지)', () => {
  let userA;
  let userB;
  let conversationId;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    // userA가 userB에게 대화 생성 + 메시지 전송 (API)
    const { headers: headersA } = await loginViaApi(request, userA.email, userA.password);
    const convRes = await request.post(`${API_BASE}/v1/dms`, {
      headers: headersA,
      data: { recipient_id: userB.userId },
    });
    const convBody = await convRes.json();
    conversationId = convBody?.data?.conversation?.id;

    // 메시지 전송
    if (conversationId) {
      await request.post(`${API_BASE}/v1/dms/${conversationId}/messages`, {
        headers: headersA,
        data: { content: '안녕하세요! 테스트 메시지입니다.' },
      });
    }
  });

  test('DM 페이지 렌더링 (사이드바 + 채팅 영역)', async ({ page }) => {
    // React SPA: /dm 단일 라우트
    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 사이드바 영역 확인
    const sidebar = page.locator('.dm-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('대화 목록에 기존 대화가 표시됨', async ({ page }) => {
    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 대화 카드가 최소 1개 이상 표시
    const sidebarList = page.locator('.dm-sidebar__list');
    const conversationCards = sidebarList.locator('.dm-conv-card');
    await expect(conversationCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('대화 선택 시 메시지 표시', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 대화 카드 클릭
    const conversationCard = page.locator('.dm-conv-card').first();
    await expect(conversationCard).toBeVisible({ timeout: 10000 });
    await conversationCard.click();

    // 채팅 패널 확인
    const chatPanel = page.locator('.dm-chat-panel');
    await expect(chatPanel).toBeVisible({ timeout: 10000 });

    // 전송된 메시지가 표시되는지 확인
    await expect(chatPanel).toContainText('안녕하세요', { timeout: 10000 });
  });

  test('메시지 입력 및 전송', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 대화 선택
    const conversationCard = page.locator('.dm-conv-card').first();
    await expect(conversationCard).toBeVisible({ timeout: 10000 });
    await conversationCard.click();

    // 채팅 패널 대기
    const chatPanel = page.locator('.dm-chat-panel');
    await expect(chatPanel).toBeVisible({ timeout: 10000 });

    // 메시지 입력
    const textarea = chatPanel.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    const newMessage = `답장 테스트 ${Date.now()}`;
    await textarea.fill(newMessage);

    // 전송 버튼 클릭
    const sendBtn = chatPanel.locator('button', { hasText: '전송' });
    await sendBtn.click();

    // 메시지가 채팅에 추가됨
    await expect(chatPanel).toContainText('답장 테스트', { timeout: 10000 });

    // 입력창 비워짐
    await expect(textarea).toHaveValue('', { timeout: 5000 });
  });

  test('뒤로가기 버튼 동작 (모바일)', async ({ page }) => {
    test.skip(!conversationId, '대화 ID가 없으면 스킵');

    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 대화 선택
    const conversationCard = page.locator('.dm-conv-card').first();
    await expect(conversationCard).toBeVisible({ timeout: 10000 });
    await conversationCard.click();

    const chatPanel = page.locator('.dm-chat-panel');
    await expect(chatPanel).toBeVisible({ timeout: 10000 });

    // 뒤로가기 버튼 클릭
    const backBtn = chatPanel.locator('.dm-chat-panel__back');
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    // 사이드바가 다시 표시됨
    const sidebar = page.locator('.dm-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('닉네임 검색으로 대화 필터링', async ({ page }) => {
    await loginAndNavigate(page, '/dm', userB.email, userB.password);

    // 대화 카드가 로드될 때까지 대기
    const sidebarList = page.locator('.dm-sidebar__list');
    await expect(sidebarList.locator('.dm-conv-card').first()).toBeVisible({ timeout: 10000 });

    // 검색 입력
    const searchInput = page.locator('.dm-sidebar__search-input');
    await expect(searchInput).toBeVisible();

    // 존재하지 않는 닉네임 검색 → 대화 목록 비어짐
    await searchInput.fill('존재하지않는닉네임999');

    // 대화 카드가 사라지거나 빈 상태가 표시됨
    await page.waitForTimeout(500);
    const visibleCards = sidebarList.locator('.dm-conv-card');
    const count = await visibleCards.count();

    // 필터링 후 결과 없음 또는 빈 메시지
    const isEmpty = count === 0 || await sidebarList.locator('.dm-sidebar__empty').isVisible().catch(() => false);
    expect(isEmpty).toBeTruthy();
  });

  test('빈 대화 목록 안내 메시지', async ({ page, request }) => {
    // 대화가 없는 새 사용자 생성
    const newUser = await createTestUser(request);
    await loginAndNavigate(page, '/dm', newUser.email, newUser.password);

    // 빈 상태 메시지 확인
    const emptyEl = page.locator('.dm-sidebar__empty');
    await expect(emptyEl).toContainText('대화가 없습니다', { timeout: 10000 });
  });
});
