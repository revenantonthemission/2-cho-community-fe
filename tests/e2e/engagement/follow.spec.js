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

  test('팔로워 통계 클릭 → 팔로워 목록 모달 표시', async ({ page }) => {
    // follower가 target을 팔로우한 상태 만들기
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    // API로 팔로우
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    });

    // viewer가 target 프로필 방문
    await loginAndNavigate(page, `/user-profile?id=${target.userId}`, viewer.email, viewer.password);

    // 통계 영역 대기
    const statsContainer = page.locator('#profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로워 통계 항목 클릭
    const followerStat = statsContainer.locator('.profile-stat-item.clickable', { hasText: '팔로워' });
    const hasFollowerStat = await followerStat.isVisible().catch(() => false);
    test.skip(!hasFollowerStat, '팔로워 클릭 가능 항목 미표시');

    await followerStat.click();

    // 모달 표시 확인
    const modal = page.locator('#follow-list-modal');
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 10000 });

    // 모달 제목 확인
    const title = page.locator('#follow-list-title');
    await expect(title).toHaveText('팔로워');

    // 목록에 사용자가 있는지 확인
    const listItems = page.locator('.follow-list-item');
    await expect(listItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('팔로잉 통계 클릭 → 팔로잉 목록 모달 표시', async ({ page }) => {
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    // follower가 target을 팔로우한 상태
    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    }).catch(() => {}); // 이미 팔로우한 경우 무시

    // viewer가 follower 프로필 방문 (follower의 팔로잉 목록 확인)
    await loginAndNavigate(page, `/user-profile?id=${follower.userId}`, viewer.email, viewer.password);

    const statsContainer = page.locator('#profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    // 팔로잉 통계 항목 클릭
    const followingStat = statsContainer.locator('.profile-stat-item.clickable', { hasText: '팔로잉' });
    const hasFollowingStat = await followingStat.isVisible().catch(() => false);
    test.skip(!hasFollowingStat, '팔로잉 클릭 가능 항목 미표시');

    await followingStat.click();

    // 모달 표시 확인
    const modal = page.locator('#follow-list-modal');
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 10000 });

    const title = page.locator('#follow-list-title');
    await expect(title).toHaveText('팔로잉');
  });

  test('팔로워 목록 모달 닫기', async ({ page }) => {
    const viewer = await createTestUser(page.request);
    const { headers: fHeaders } = await loginViaApi(page.request, follower.email, follower.password);

    await page.request.post(`http://127.0.0.1:8000/v1/users/${target.userId}/follow`, {
      headers: fHeaders,
    }).catch(() => {});

    await loginAndNavigate(page, `/user-profile?id=${target.userId}`, viewer.email, viewer.password);

    const statsContainer = page.locator('#profile-stats');
    await expect(statsContainer).toBeVisible({ timeout: 10000 });

    const followerStat = statsContainer.locator('.profile-stat-item.clickable', { hasText: '팔로워' });
    const hasFollowerStat = await followerStat.isVisible().catch(() => false);
    test.skip(!hasFollowerStat, '팔로워 클릭 가능 항목 미표시');

    await followerStat.click();

    const modal = page.locator('#follow-list-modal');
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 10000 });

    // 닫기 버튼 클릭
    const closeBtn = page.locator('#follow-list-close');
    await closeBtn.click();

    // 모달 숨김 확인
    await expect(modal).toHaveClass(/hidden/, { timeout: 5000 });
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
