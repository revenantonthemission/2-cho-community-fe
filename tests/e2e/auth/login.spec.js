// tests/e2e/auth/login.spec.js
// 로그인 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import { createTestUser, loginViaUI } from '../fixtures/test-helpers.js';

test.describe('로그인', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test('정상 로그인 시 메인 페이지로 이동', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);

    // 이메일 입력
    await page.fill('input#email', testUser.email);

    // 비밀번호 입력
    await page.fill('input#password', testUser.password);

    // 버튼 활성화 대기 후 클릭
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeEnabled({ timeout: 10000 });
    await loginBtn.click();

    // 메인 페이지로 이동 확인 (React SPA: / )
    await expect(page).toHaveURL(/^\/$|.*\/$/, { timeout: 10000 });
  });

  test('잘못된 비밀번호 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', testUser.email);
    await page.fill('input#password', 'WrongPass1!@#');

    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeEnabled({ timeout: 10000 });
    await loginBtn.click();

    // 에러 메시지 표시 확인
    const errorMsg = page.locator('.error-msg');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });

    // 로그인 페이지에 머무름
    await expect(page).toHaveURL(/.*login/);
  });

  test('빈 필드 제출 시 페이지 유지', async ({ page }) => {
    await page.goto('/login');

    // 로그인 버튼이 비활성화 상태인지 확인
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeDisabled();

    // 빈 상태에서 폼 제출 시도 (Enter 키)
    await page.press('input#email', 'Enter');

    // 로그인 페이지에 머무름
    await expect(page).toHaveURL(/.*login/);
  });

  test('로그아웃 시 로그인 페이지로 이동', async ({ page }) => {
    // 로그인
    await loginViaUI(page, testUser.email, testUser.password);

    // 프로필 드롭다운 열기
    const profileBtn = page.locator('.profile-circle');
    await expect(profileBtn).toBeVisible({ timeout: 10000 });
    await profileBtn.click();

    // 로그아웃 클릭
    const logoutBtn = page.locator('.header-dropdown button', { hasText: '로그아웃' });
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();

    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
