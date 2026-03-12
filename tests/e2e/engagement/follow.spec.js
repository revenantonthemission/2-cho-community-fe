// tests/e2e/engagement/follow.spec.js
// 팔로우 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
} from '../fixtures/test-helpers.js';

test.describe('팔로우', () => {
  let follower; // 팔로우하는 사용자
  let target;   // 팔로우 대상 사용자

  test.beforeAll(async ({ request }) => {
    follower = await createTestUser(request);
    target = await createTestUser(request);
  });

  test('팔로우 버튼 클릭 → 텍스트 변경 (팔로우→팔로잉)', async ({ page }) => {
    await loginAndNavigate(page, `/user-profile?id=${target.userId}`, follower.email, follower.password);

    // 팔로우 버튼 표시 확인
    const followBtn = page.locator('#follow-user-btn');
    await expect(followBtn).toBeVisible({ timeout: 10000 });
    await expect(followBtn).toHaveText('팔로우');

    // 팔로우 클릭
    await followBtn.click();

    // 텍스트 변경 확인: 팔로우 → 팔로잉
    await expect(followBtn).toHaveText('팔로잉', { timeout: 5000 });
    await expect(followBtn).toHaveClass(/following/);
  });

  test('팔로워 수 업데이트', async ({ page }) => {
    // 새 유저로 팔로우 테스트 (이전 테스트와 독립)
    const newFollower = await createTestUser(page.request);
    await loginAndNavigate(page, `/user-profile?id=${target.userId}`, newFollower.email, newFollower.password);

    // 팔로워 통계 확인 (profile-stats 내부의 팔로워 항목)
    const statsContainer = page.locator('#profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로우 전 팔로워 수 기록
    const followerStat = statsContainer.locator('div', { hasText: '팔로워' });
    const followerCountBefore = await followerStat.locator('.profile-stat-value').textContent()
      .catch(() => '0');

    // 팔로우 클릭
    const followBtn = page.locator('#follow-user-btn');
    await expect(followBtn).toBeVisible({ timeout: 5000 });
    await followBtn.click();

    // 팔로잉으로 변경 대기
    await expect(followBtn).toHaveText('팔로잉', { timeout: 5000 });

    // 팔로워 수 증가 확인
    const followerCountAfter = await followerStat.locator('.profile-stat-value').textContent()
      .catch(() => '0');
    expect(parseInt(followerCountAfter)).toBe(parseInt(followerCountBefore) + 1);
  });

  test('언팔로우 동작', async ({ page }) => {
    // 먼저 팔로우 상태 만들기
    const unfollower = await createTestUser(page.request);
    const { headers } = await loginViaApi(page.request, unfollower.email, unfollower.password);

    // API로 먼저 팔로우
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers,
    });

    await loginAndNavigate(page, `/user-profile?id=${target.userId}`, unfollower.email, unfollower.password);

    const followBtn = page.locator('#follow-user-btn');
    await expect(followBtn).toBeVisible({ timeout: 10000 });

    // 이미 팔로잉 상태 확인
    await expect(followBtn).toHaveText('팔로잉', { timeout: 5000 });

    // 언팔로우 클릭
    await followBtn.click();

    // 텍스트 변경: 팔로잉 → 팔로우
    await expect(followBtn).toHaveText('팔로우', { timeout: 5000 });
    await expect(followBtn).not.toHaveClass(/following/);
  });
});
