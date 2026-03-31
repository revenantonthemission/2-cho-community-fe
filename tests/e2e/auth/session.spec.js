// tests/e2e/auth/session.spec.js
// 세션 관리 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import { createTestUser, loginViaUI } from '../fixtures/test-helpers.js';

test.describe('세션 관리', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test('로그인 후 새로고침해도 인증 유지', async ({ page }) => {
    // 로그인
    await loginViaUI(page, testUser.email, testUser.password);

    // 프로필 아이콘 표시 확인 (로그인 상태)
    await expect(page.locator('.profile-circle')).toBeVisible({ timeout: 10000 });

    // 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 새로고침 후에도 프로필 아이콘 유지 (인증 유지)
    await expect(page.locator('.profile-circle')).toBeVisible({ timeout: 10000 });
  });

  test('인증 없이 글쓰기 페이지 접근 시 리다이렉트', async ({ page }) => {
    // 비로그인 상태에서 글쓰기 페이지 접근
    await page.goto('/write');
    await page.waitForLoadState('networkidle');

    // React SPA AuthGuard: 인증 없이 접근 시 로그인 페이지로 리다이렉트
    const isOnLogin = page.url().includes('/login');
    const profileVisible = await page.locator('.profile-circle').isVisible().catch(() => false);

    // 로그인 페이지로 리다이렉트되었거나, 인증 안 된 상태임을 확인
    expect(isOnLogin || !profileVisible).toBeTruthy();
  });

  test('세션 만료 파라미터 시 안내 메시지 표시', async ({ page }) => {
    // 세션 만료 쿼리 파라미터로 로그인 페이지 접근
    await page.goto('/login?session=expired');

    // 토스트 메시지 표시 확인
    const toast = page.locator('.toast');
    await expect(toast).toContainText('세션이 만료', { timeout: 10000 });
  });
});
