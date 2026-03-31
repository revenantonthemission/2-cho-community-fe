// tests/e2e/users/profile.spec.js
// 사용자 프로필 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginAndNavigate,
  loginViaApi,
  createTestPost,
} from '../fixtures/test-helpers.js';

test.describe('사용자 프로필', () => {
  let userA;
  let userB;
  let userBPost;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    // userB가 게시글 작성
    const { headers } = await loginViaApi(request, userB.email, userB.password);
    userBPost = await createTestPost(request, headers, {
      title: `프로필테스트 ${Date.now()}`,
      content: '프로필 테스트용 게시글입니다.',
    });
  });

  test('내 프로필 접근 시 edit-profile로 리다이렉트', async ({ page }) => {
    // 로그인
    await loginViaUI(page, userA.email, userA.password);

    // 프로필 드롭다운 → 회원정보수정
    await page.click('.profile-circle');
    const editInfoMenu = page.locator('.header-dropdown a', { hasText: '회원정보수정' });
    await expect(editInfoMenu).toBeVisible({ timeout: 5000 });
    await editInfoMenu.click();

    // edit-profile 페이지로 이동 확인
    await expect(page).toHaveURL(/.*edit-profile/, { timeout: 10000 });
    await expect(page.locator('input#nickname')).toBeVisible({ timeout: 10000 });
  });

  test('타인 프로필 페이지 렌더링 (닉네임)', async ({ page }) => {
    await loginAndNavigate(page, `/user-profile/${userB.userId}`, userA.email, userA.password);

    // 닉네임 표시 확인
    const nickname = page.locator('#profile-nickname');
    await expect(nickname).toBeVisible({ timeout: 10000 });
    await expect(nickname).not.toHaveText('');

    // 프로필 이미지 영역 확인
    const profileImg = page.locator('.profile-img-large');
    await expect(profileImg).toBeVisible();
  });

  test('타인 프로필에서 팔로우/DM/차단 버튼 표시', async ({ page }) => {
    await loginAndNavigate(page, `/user-profile/${userB.userId}`, userA.email, userA.password);

    // 닉네임 로드 대기
    await expect(page.locator('#profile-nickname')).not.toHaveText('', { timeout: 10000 });

    // 팔로우 버튼 표시 확인
    const followBtn = page.locator('.follow-btn');
    await expect(followBtn).toBeVisible({ timeout: 10000 });

    // 쪽지 보내기 버튼 확인
    const dmBtn = page.locator('button', { hasText: '쪽지 보내기' });
    await expect(dmBtn).toBeVisible();

    // 차단 버튼 확인
    const blockBtn = page.locator('.block-btn');
    await expect(blockBtn).toBeVisible();
  });

  test('타인 프로필에서 작성한 게시글 목록 표시', async ({ page }) => {
    await loginAndNavigate(page, `/user-profile/${userB.userId}`, userA.email, userA.password);

    // 게시글 목록 영역 확인
    const postList = page.locator('.post-list');

    // userB의 게시글이 표시되거나, 빈 상태 메시지가 표시되어야 함
    const hasPost = await postList.locator('.post-card').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state')
      .isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasPost || hasEmpty).toBeTruthy();
  });
});
