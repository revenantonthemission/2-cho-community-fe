// tests/e2e/users/settings.spec.js
// 회원정보 수정 E2E 테스트

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
    await expect(page.locator('#nickname-input')).toHaveValue(testUser.nickname, {
      timeout: 10000,
    });

    // 새 닉네임으로 수정
    const newNickname = `edit${Date.now().toString(36).slice(-6)}`;
    await page.fill('#nickname-input', newNickname);
    await page.dispatchEvent('#nickname-input', 'input');

    // 수정 버튼 활성화 대기 및 클릭
    const submitBtn = page.locator('#submit-btn');
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // 성공 토스트 확인
    await expect(page.locator('#toast')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#toast')).toContainText('수정');

    // 수정된 닉네임이 반영되었는지 확인
    await expect(page.locator('#nickname-input')).toHaveValue(newNickname);
  });

  test('비밀번호 변경 페이지 진입 및 폼 표시', async ({ page }) => {
    await loginAndNavigate(page, '/password', testUser.email, testUser.password);

    // 비밀번호 변경 폼 요소 확인
    const currentPw = page.locator('#current-password');
    const newPw = page.locator('#new-password');
    const confirmPw = page.locator('#confirm-password');

    await expect(currentPw).toBeVisible({ timeout: 10000 });
    await expect(newPw).toBeVisible();
    await expect(confirmPw).toBeVisible();

    // 수정 버튼이 초기 비활성화 상태인지 확인
    const submitBtn = page.locator('#submit-btn');
    await expect(submitBtn).toBeDisabled();
  });

  test('회원탈퇴 확인 모달 표시', async ({ page }) => {
    // 탈퇴 테스트용 별도 사용자 생성
    const withdrawUser = await createTestUser(page.request);
    await loginAndNavigate(page, '/edit-profile', withdrawUser.email, withdrawUser.password);

    // 기존 닉네임 로드 대기
    await expect(page.locator('#nickname-input')).not.toHaveValue('', {
      timeout: 10000,
    });

    // 회원탈퇴 버튼 클릭
    await page.click('#withdraw-btn');

    // 탈퇴 모달 표시 확인
    const modal = page.locator('#withdraw-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 비밀번호 입력 필드 확인
    await expect(page.locator('#withdraw-password')).toBeVisible();

    // 확인/취소 버튼 확인
    await expect(page.locator('#withdraw-modal #modal-confirm-btn')).toBeVisible();
    await expect(page.locator('#withdraw-modal #modal-cancel-btn')).toBeVisible();

    // 취소 클릭 → 모달 닫힘
    await page.click('#withdraw-modal #modal-cancel-btn');
    await expect(modal).toBeHidden();
  });
});
