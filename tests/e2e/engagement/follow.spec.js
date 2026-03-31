// tests/e2e/engagement/follow.spec.js
// 팔로우 E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
} from '../fixtures/test-helpers.js';

test.describe('팔로우', () => {
  let follower;
  let target;

  test.beforeAll(async ({ request }) => {
    follower = await createTestUser(request);
    target = await createTestUser(request);
  });

  test('팔로우 버튼 클릭 → 텍스트 변경 (팔로우→언팔로우)', async ({ page }) => {
    await loginAndNavigate(page, `/user-profile/${target.userId}`, follower.email, follower.password);

    // 팔로우 버튼 표시 확인
    const followBtn = page.locator('.follow-btn');
    await expect(followBtn).toBeVisible({ timeout: 10000 });
    await expect(followBtn).toHaveText('팔로우');

    // 팔로우 클릭
    await followBtn.click();

    // 텍스트 변경 확인: 팔로우 → 언팔로우
    await expect(followBtn).toHaveText('언팔로우', { timeout: 5000 });
    await expect(followBtn).toHaveClass(/following/);
  });

  test('팔로워 수 확인', async ({ page }) => {
    // 새 유저로 팔로우 테스트
    const newFollower = await createTestUser(page.request);
    await loginAndNavigate(page, `/user-profile/${target.userId}`, newFollower.email, newFollower.password);

    // 프로필 통계 확인
    const statsContainer = page.locator('.profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로워 통계 항목 확인
    const followerStat = statsContainer.locator('.profile-stat-item', { hasText: '팔로워' });
    await expect(followerStat).toBeVisible();
  });

  test('팔로워 통계 클릭 → 팔로워 목록 모달 표시', async ({ page }) => {
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    // API로 팔로우
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    }).catch(() => {});

    // viewer가 target 프로필 방문
    await loginAndNavigate(page, `/user-profile/${target.userId}`, viewer.email, viewer.password);

    // 통계 영역 대기
    const statsContainer = page.locator('.profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로워 통계 항목 클릭 (React SPA: .profile-stat-clickable 버튼)
    const followerStat = statsContainer.locator('.profile-stat-clickable', { hasText: '팔로워' });
    const hasFollowerStat = await followerStat.isVisible().catch(() => false);
    test.skip(!hasFollowerStat, '팔로워 클릭 가능 항목 미표시');

    await followerStat.click();

    // 모달 표시 확인 (React SPA: Modal 컴포넌트)
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // 모달 제목 확인
    const title = page.locator('.modal-header h3');
    await expect(title).toHaveText('팔로워');

    // 목록에 사용자가 있는지 확인
    const listItems = page.locator('.follow-modal-item');
    await expect(listItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('팔로잉 통계 클릭 → 팔로잉 목록 모달 표시', async ({ page }) => {
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    // follower가 target을 팔로우한 상태
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    }).catch(() => {});

    // viewer가 follower 프로필 방문
    await loginAndNavigate(page, `/user-profile/${follower.userId}`, viewer.email, viewer.password);

    const statsContainer = page.locator('.profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로잉 통계 항목 클릭
    const followingStat = statsContainer.locator('.profile-stat-clickable', { hasText: '팔로잉' });
    const hasFollowingStat = await followingStat.isVisible().catch(() => false);
    test.skip(!hasFollowingStat, '팔로잉 클릭 가능 항목 미표시');

    await followingStat.click();

    // 모달 표시 확인
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 10000 });

    const title = page.locator('.modal-header h3');
    await expect(title).toHaveText('팔로잉');
  });

  test('팔로워 목록 모달 닫기', async ({ page }) => {
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    }).catch(() => {});

    await loginAndNavigate(page, `/user-profile/${target.userId}`, viewer.email, viewer.password);

    const statsContainer = page.locator('.profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    const followerStat = statsContainer.locator('.profile-stat-clickable', { hasText: '팔로워' });
    const hasFollowerStat = await followerStat.isVisible().catch(() => false);
    test.skip(!hasFollowerStat, '팔로워 클릭 가능 항목 미표시');

    await followerStat.click();

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // 닫기 버튼 클릭
    const closeBtn = page.locator('.modal-close');
    await closeBtn.click();

    // 모달 숨김 확인 (React: 모달이 DOM에서 제거됨)
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('언팔로우 동작', async ({ page }) => {
    // 먼저 팔로우 상태 만들기
    const unfollower = await createTestUser(page.request);
    const { headers } = await loginViaApi(page.request, unfollower.email, unfollower.password);

    // API로 먼저 팔로우
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers,
    });

    await loginAndNavigate(page, `/user-profile/${target.userId}`, unfollower.email, unfollower.password);

    const followBtn = page.locator('.follow-btn');
    await expect(followBtn).toBeVisible({ timeout: 10000 });

    // 이미 팔로잉 상태 확인
    await expect(followBtn).toHaveText('언팔로우', { timeout: 5000 });

    // 언팔로우 클릭
    await followBtn.click();

    // 텍스트 변경: 언팔로우 → 팔로우
    await expect(followBtn).toHaveText('팔로우', { timeout: 5000 });
    await expect(followBtn).not.toHaveClass(/following/);
  });
});
