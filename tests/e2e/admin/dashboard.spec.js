// tests/e2e/admin/dashboard.spec.js
// 관리자 대시보드 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import { createTestUser, loginAndNavigate, setAdminRole } from '../fixtures/test-helpers.js';

test.describe('관리자 - 대시보드', () => {
  test('비관리자 접근 시 홈으로 리다이렉트', async ({ page, request }) => {
    const normalUser = await createTestUser(request);
    await loginAndNavigate(page, '/admin', normalUser.email, normalUser.password);

    // 홈(/)으로 리다이렉트 확인
    await expect(page).toHaveURL(/^\/$|.*\/$/, { timeout: 10000 });
  });

  test('대시보드 통계 카드 렌더링 (관리자)', async ({ page, request }) => {
    const admin = await createTestUser(request);
    await setAdminRole(request, admin.userId);
    await loginAndNavigate(page, '/admin', admin.email, admin.password);

    // 페이지 타이틀 확인
    await expect(page.locator('h1')).toContainText('관리자 대시보드');

    // 통계 카드 영역 확인
    const statsCards = page.locator('.admin-stat-card');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });

    // 일별 통계 테이블 확인
    const dailyTable = page.locator('.admin-daily-table');
    await expect(dailyTable).toBeVisible();
  });

  test('사용자 목록 검색 (관리자)', async ({ page, request }) => {
    const admin = await createTestUser(request);
    await setAdminRole(request, admin.userId);
    await loginAndNavigate(page, '/admin', admin.email, admin.password);

    // 사용자 검색 입력창 확인
    const searchInput = page.locator('.admin-users__search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /닉네임 또는 이메일/);

    // 사용자 목록 영역 확인
    const userList = page.locator('.admin-user-list');
    await expect(userList).toBeVisible();

    // 검색 입력 (디바운스 300ms)
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // 검색 결과 반영 확인 (목록이 리로드됨)
    await expect(userList).toBeVisible();
  });
});
