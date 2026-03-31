// tests/e2e/admin/reports.spec.js
// 관리자 신고 관리 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import { createTestUser, loginAndNavigate, setAdminRole } from '../fixtures/test-helpers.js';

test.describe('관리자 - 신고 관리', () => {
  test('비관리자 접근 시 홈으로 리다이렉트', async ({ page, request }) => {
    const normalUser = await createTestUser(request);
    await loginAndNavigate(page, '/admin/reports', normalUser.email, normalUser.password);

    // 홈(/)으로 리다이렉트 확인
    await expect(page).toHaveURL(/^\/$|.*\/$/, { timeout: 10000 });
  });

  test('신고 목록 렌더링 (관리자)', async ({ page, request }) => {
    const admin = await createTestUser(request);
    await setAdminRole(request, admin.userId);
    await loginAndNavigate(page, '/admin/reports', admin.email, admin.password);

    // 필터 탭 확인 (React SPA: .admin-tab 버튼)
    const tabs = page.locator('.admin-reports__tabs .admin-tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('대기중');
    await expect(tabs.nth(1)).toContainText('처리됨');
    await expect(tabs.nth(2)).toContainText('기각됨');
  });

  test('신고 탭 전환 동작 (관리자)', async ({ page, request }) => {
    const admin = await createTestUser(request);
    await setAdminRole(request, admin.userId);
    await loginAndNavigate(page, '/admin/reports', admin.email, admin.password);

    // 대기중 탭이 기본 active
    const pendingTab = page.locator('.admin-tab', { hasText: '대기중' });
    await expect(pendingTab).toHaveClass(/active/, { timeout: 10000 });

    // 처리됨 탭 클릭
    const resolvedTab = page.locator('.admin-tab', { hasText: '처리됨' });
    await resolvedTab.click();
    await expect(resolvedTab).toHaveClass(/active/, { timeout: 5000 });

    // 기각됨 탭 클릭
    const dismissedTab = page.locator('.admin-tab', { hasText: '기각됨' });
    await dismissedTab.click();
    await expect(dismissedTab).toHaveClass(/active/, { timeout: 5000 });
  });
});
