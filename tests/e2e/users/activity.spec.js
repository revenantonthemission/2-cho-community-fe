// tests/e2e/users/activity.spec.js
// 내 활동 페이지 — 차단 목록 탭 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  API_BASE,
} from '../fixtures/test-helpers.js';

test.describe('내 활동 - 차단 목록', () => {
  let blocker;
  let blocked;

  test.beforeAll(async ({ request }) => {
    blocker = await createTestUser(request);
    blocked = await createTestUser(request);

    // blocker가 blocked를 차단
    const { headers } = await loginViaApi(request, blocker.email, blocker.password);
    await request.post(`${API_BASE}/v1/users/${blocked.userId}/block`, {
      headers,
    });
  });

  test('차단 목록 탭이 표시된다', async ({ page }) => {
    await loginAndNavigate(page, '/my-activity', blocker.email, blocker.password);

    // 탭 버튼 확인
    const blocksTab = page.locator('.tab-btn[data-tab="blocks"]');
    await expect(blocksTab).toBeVisible({ timeout: 10000 });
    await expect(blocksTab).toHaveText('차단 목록');
  });

  test('차단 목록 탭 클릭 → 차단된 사용자 표시', async ({ page }) => {
    await loginAndNavigate(page, '/my-activity', blocker.email, blocker.password);

    // 차단 목록 탭 클릭
    const blocksTab = page.locator('.tab-btn[data-tab="blocks"]');
    await expect(blocksTab).toBeVisible({ timeout: 10000 });
    await blocksTab.click();

    // 탭 활성화 확인
    await expect(blocksTab).toHaveClass(/active/);

    // 차단 카드 표시 확인
    const blockCard = page.locator('.block-card').first();
    await expect(blockCard).toBeVisible({ timeout: 10000 });

    // 차단된 사용자 닉네임 표시
    const nickname = blockCard.locator('.block-card-nickname');
    await expect(nickname).toBeVisible();
    await expect(nickname).not.toBeEmpty();

    // 차단 해제 버튼 표시
    const unblockBtn = blockCard.locator('.block-card-unblock-btn');
    await expect(unblockBtn).toBeVisible();
    await expect(unblockBtn).toHaveText('차단 해제');
  });

  test('차단 해제 버튼 클릭 → 카드 제거', async ({ page }) => {
    // 별도의 차단 관계 생성 (이전 테스트와 독립)
    const newBlocker = await createTestUser(page.request);
    const target = await createTestUser(page.request);
    const { headers } = await loginViaApi(page.request, newBlocker.email, newBlocker.password);
    await page.request.post(`${API_BASE}/v1/users/${target.userId}/block`, { headers });

    await loginAndNavigate(page, '/my-activity', newBlocker.email, newBlocker.password);

    // 차단 목록 탭 클릭
    const blocksTab = page.locator('.tab-btn[data-tab="blocks"]');
    await expect(blocksTab).toBeVisible({ timeout: 10000 });
    await blocksTab.click();

    // 차단 카드 표시 대기
    const blockCard = page.locator('.block-card').first();
    await expect(blockCard).toBeVisible({ timeout: 10000 });

    // 차단 해제 클릭
    const unblockBtn = blockCard.locator('.block-card-unblock-btn');
    await unblockBtn.click();

    // 카드 제거 확인 (빈 상태 또는 카드 없음)
    await expect(page.locator('.block-card')).toHaveCount(0, { timeout: 10000 });

    // 빈 상태 메시지 표시 확인
    const emptyState = page.locator('#activity-empty');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('차단 목록이 비어있으면 빈 상태 표시', async ({ page }) => {
    // 차단 없는 새 유저
    const freshUser = await createTestUser(page.request);
    await loginAndNavigate(page, '/my-activity', freshUser.email, freshUser.password);

    // 차단 목록 탭 클릭
    const blocksTab = page.locator('.tab-btn[data-tab="blocks"]');
    await expect(blocksTab).toBeVisible({ timeout: 10000 });
    await blocksTab.click();

    // 빈 상태 메시지 표시 확인
    const emptyState = page.locator('#activity-empty');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(emptyState).toContainText('활동 내역이 없습니다');
  });

  test('탭 전환이 정상 동작한다 (게시글 → 차단 → 게시글)', async ({ page }) => {
    await loginAndNavigate(page, '/my-activity', blocker.email, blocker.password);

    // 기본 탭 활성 상태 확인 (게시글)
    const postsTab = page.locator('.tab-btn[data-tab="posts"]');
    await expect(postsTab).toHaveClass(/active/, { timeout: 10000 });

    // 차단 목록으로 전환
    const blocksTab = page.locator('.tab-btn[data-tab="blocks"]');
    await blocksTab.click();
    await expect(blocksTab).toHaveClass(/active/);
    await expect(postsTab).not.toHaveClass(/active/);

    // 차단 카드 또는 빈 상태가 표시되어야 함
    const hasCard = await page.locator('.block-card').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('#activity-empty:not(.hidden)').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCard || hasEmpty).toBeTruthy();

    // 다시 게시글 탭으로 전환
    await postsTab.click();
    await expect(postsTab).toHaveClass(/active/);
    await expect(blocksTab).not.toHaveClass(/active/);
  });
});
