// tests/e2e/auth/signup.spec.js
// 회원가입 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import { createTestUser, API_BASE } from '../fixtures/test-helpers.js';

/**
 * 회원가입 폼 입력 헬퍼
 * React SPA: 프로필 이미지는 선택사항, dispatchEvent 불필요
 */
async function fillSignupForm(page, { email, password, passwordConfirm, nickname }) {
  if (email) {
    await page.fill('input#email', email);
  }
  if (password) {
    await page.fill('input#password', password);
  }
  if (passwordConfirm) {
    await page.fill('input#passwordConfirm', passwordConfirm);
  }
  if (nickname) {
    await page.fill('input#nickname', nickname);
  }

  // 이용약관 동의 체크
  await page.check('.terms-checkbox input[type="checkbox"]');
}

test.describe('회원가입', () => {
  test('정상 가입 후 로그인 페이지로 이동', async ({ page }) => {
    const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    await page.goto('/signup');
    await expect(page).toHaveURL(/.*signup/);

    // 회원가입 API를 인터셉트하여 성공 응답 반환
    await page.route(/\/v1\/users\/?$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { user_id: 99999 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await fillSignupForm(page, {
      email: `e2e_signup_${suffix}@test.com`,
      password: 'Test1234!@',
      passwordConfirm: 'Test1234!@',
      nickname: `su${suffix.slice(-7)}`,
    });

    // 가입 버튼 클릭
    const signupBtn = page.locator('button[type="submit"]');
    await expect(signupBtn).toBeEnabled({ timeout: 10000 });
    await signupBtn.click();

    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('중복 이메일 시 에러 표시', async ({ page, request }) => {
    // API로 사용자 생성
    const existing = await createTestUser(request);

    await page.goto('/signup');

    // 중복 이메일 시 409 응답 반환하도록 인터셉트
    await page.route(/\/v1\/users\/?$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: { error: 'email_already_exists', message: '이미 존재하는 이메일입니다' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await fillSignupForm(page, {
      email: existing.email,
      password: 'Test1234!@',
      passwordConfirm: 'Test1234!@',
      nickname: `dup${Date.now().toString(36).slice(-6)}`,
    });

    const signupBtn = page.locator('button[type="submit"]');
    await expect(signupBtn).toBeEnabled({ timeout: 10000 });
    await signupBtn.click();

    // 에러 메시지 확인 (React: .error-msg)
    const errorMsg = page.locator('.error-msg');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test('이용약관 미체크 시 가입 실패', async ({ page }) => {
    await page.goto('/signup');

    // 모든 필드 입력 (약관 제외)
    await page.fill('input#email', `terms_test_${Date.now()}@test.com`);
    await page.fill('input#password', 'Test1234!@');
    await page.fill('input#passwordConfirm', 'Test1234!@');
    await page.fill('input#nickname', `tt${Date.now().toString(36).slice(-5)}`);

    // 약관 미체크 상태에서 제출 → 에러 메시지 표시
    // React SPA: submit 버튼은 항상 활성화, validation은 onSubmit에서 처리
    const signupBtn = page.locator('button[type="submit"]');
    await signupBtn.click();

    // 가입 페이지에 머무름
    await expect(page).toHaveURL(/.*signup/);
  });

  test('필수 필드 미입력 시 제출 차단', async ({ page }) => {
    await page.goto('/signup');

    // 아무것도 입력하지 않은 상태
    const signupBtn = page.locator('button[type="submit"]');

    // Enter 키로 제출 시도
    await page.press('input#email', 'Enter');

    // 가입 페이지에 머무름
    await expect(page).toHaveURL(/.*signup/);
  });
});
