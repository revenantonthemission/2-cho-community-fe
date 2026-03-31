// tests/e2e/users/settings.spec.js
// 회원정보 수정 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginAndNavigate,
} from '../fixtures/test-helpers.js';

test.describe('회원정보 수정', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test('닉네임 수정 → 성공 토스트 표시', async ({ page }) => {
    await loginAndNavigate(page, '/edit-profile', testUser.email, testUser.password);

    // 기존 닉네임이 채워질 때까지 대기
    const nicknameInput = page.locator('input#nickname');
    await expect(nicknameInput).toHaveValue(testUser.nickname, { timeout: 10000 });

    // 새 닉네임으로 수정
    const newNickname = `edit${Date.now().toString(36).slice(-6)}`;
    await nicknameInput.fill(newNickname);

    // 저장 버튼 클릭
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // 성공 토스트 확인
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText('수정');
  });

  test('비밀번호 변경 페이지 진입 및 폼 표시', async ({ page }) => {
    await loginAndNavigate(page, '/password', testUser.email, testUser.password);

    // 비밀번호 변경 폼 요소 확인
    const currentPw = page.locator('input#current-pw');
    const newPw = page.locator('input#new-pw');
    const confirmPw = page.locator('input#confirm-pw');

    await expect(currentPw).toBeVisible({ timeout: 10000 });
    await expect(newPw).toBeVisible();
    await expect(confirmPw).toBeVisible();

    // 수정 버튼이 초기 비활성화 상태인지 확인
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('회원탈퇴 확인 모달 표시', async ({ page }) => {
    // 탈퇴 테스트용 별도 사용자 생성
    const withdrawUser = await createTestUser(page.request);
    await loginAndNavigate(page, '/edit-profile', withdrawUser.email, withdrawUser.password);

    // 기존 닉네임 로드 대기
    const nicknameInput = page.locator('input#nickname');
    await nicknameInput.waitFor({ state: 'visible', timeout: 10000 });
    await expect(nicknameInput).not.toHaveValue('', { timeout: 10000 });

    // 회원탈퇴 버튼 클릭
    await page.click('.btn.btn-danger', { hasText: '회원 탈퇴' });

    // 탈퇴 모달 표시 확인 (React SPA: Modal 컴포넌트)
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 비밀번호 입력 필드 확인
    await expect(page.locator('input#delete-pw')).toBeVisible();

    // 취소/탈퇴 버튼 확인
    await expect(page.locator('.modal-actions .btn.btn-secondary')).toBeVisible();
    await expect(page.locator('.modal-actions .btn.btn-danger')).toBeVisible();

    // 취소 클릭 → 모달 닫힘
    await page.click('.modal-actions .btn.btn-secondary');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });
});
