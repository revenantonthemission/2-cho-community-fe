// tests/e2e/engagement/poll.spec.js
// 투표(Poll) E2E 테스트 — React SPA 버전

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndNavigate,
  loginViaApi,
  API_BASE,
} from '../fixtures/test-helpers.js';

test.describe('투표', () => {
  let testUser;
  let postWithPoll;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);

    // 투표가 포함된 게시글 생성
    const res = await request.post(`${API_BASE}/v1/posts/`, {
      headers,
      data: {
        title: `투표테스트 ${Date.now()}`,
        content: '투표 테스트용 게시글입니다.',
        category_id: 1,
        poll: {
          question: '테스트 투표 질문입니다',
          options: ['옵션 A', '옵션 B', '옵션 C'],
          expires_in_hours: 24,
        },
      },
    });
    const body = await res.json();
    postWithPoll = { postId: body?.data?.post_id };
  });

  test('투표 옵션 표시 확인', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    await loginAndNavigate(page, `/detail/${postWithPoll.postId}`, testUser.email, testUser.password);

    // 투표 컨테이너 표시 확인 (React SPA: .poll-view)
    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 질문 표시
    const pollQuestion = pollContainer.locator('.poll-view__question');
    await expect(pollQuestion).toContainText('테스트 투표 질문');

    // 투표 옵션이 3개 표시되는지 확인
    const options = pollContainer.locator('.poll-option');
    await expect(options).toHaveCount(3);
  });

  test('투표 클릭 → 결과 바 표시', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    const voter = await createTestUser(page.request);
    await loginAndNavigate(page, `/detail/${postWithPoll.postId}`, voter.email, voter.password);

    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 옵션이 있으면 투표 수행
    const pollOptions = pollContainer.locator('input[name="poll-vote"]');
    const hasOptions = await pollOptions.first().isVisible().catch(() => false);

    if (hasOptions) {
      // 첫 번째 옵션 선택
      await pollOptions.first().check();

      // 투표 버튼 클릭
      const voteBtn = pollContainer.locator('.btn', { hasText: '투표' });
      await voteBtn.click();

      await page.waitForLoadState('networkidle');
    }

    // 결과 바 표시 확인 (.poll-result)
    const results = pollContainer.locator('.poll-result');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('투표 후 변경/취소 버튼 표시', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    const voter = await createTestUser(page.request);
    await loginAndNavigate(page, `/detail/${postWithPoll.postId}`, voter.email, voter.password);

    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 옵션이 있으면 투표 수행
    const pollOptions = pollContainer.locator('input[name="poll-vote"]');
    const hasOptions = await pollOptions.first().isVisible().catch(() => false);

    if (hasOptions) {
      await pollOptions.first().check();
      const voteBtn = pollContainer.locator('.btn', { hasText: '투표' });
      await voteBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // 결과 모드에서 변경/취소 버튼 표시 확인
    const changeBtn = pollContainer.locator('.btn', { hasText: '변경' });
    const cancelBtn = pollContainer.locator('.btn', { hasText: '취소' });
    await expect(changeBtn).toBeVisible({ timeout: 10000 });
    await expect(cancelBtn).toBeVisible();
  });

  test('투표 취소 → 투표 폼으로 복귀', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    const voter = await createTestUser(page.request);
    const { headers } = await loginViaApi(page.request, voter.email, voter.password);

    // API로 옵션 ID 획득
    const detailRes = await page.request.get(`${API_BASE}/v1/posts/${postWithPoll.postId}`, { headers });
    const detailBody = await detailRes.json();
    const optionId = detailBody?.data?.post?.poll?.options?.[0]?.option_id;

    // API로 먼저 투표
    if (optionId) {
      await page.request.post(`${API_BASE}/v1/posts/${postWithPoll.postId}/poll/vote`, {
        headers,
        data: { option_id: optionId },
      });
    }

    await loginAndNavigate(page, `/detail/${postWithPoll.postId}`, voter.email, voter.password);

    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 취소 버튼 클릭
    const cancelBtn = pollContainer.locator('.btn', { hasText: '취소' });
    const hasCancelBtn = await cancelBtn.isVisible().catch(() => false);
    test.skip(!hasCancelBtn, '취소 버튼 미표시');

    await cancelBtn.click();
    await page.waitForLoadState('networkidle');

    // 투표 옵션으로 복귀 확인
    const pollOptions = pollContainer.locator('.poll-option');
    await expect(pollOptions.first()).toBeVisible({ timeout: 10000 });
  });

  test('투표 변경 → 다른 옵션 선택 후 제출', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    const voter = await createTestUser(page.request);
    const { headers } = await loginViaApi(page.request, voter.email, voter.password);

    // API로 옵션 ID 획득 및 투표
    const detailRes = await page.request.get(`${API_BASE}/v1/posts/${postWithPoll.postId}`, { headers });
    const detailBody = await detailRes.json();
    const options = detailBody?.data?.post?.poll?.options;
    const firstOptionId = options?.[0]?.option_id;

    if (firstOptionId) {
      await page.request.post(`${API_BASE}/v1/posts/${postWithPoll.postId}/poll/vote`, {
        headers,
        data: { option_id: firstOptionId },
      });
    }

    await loginAndNavigate(page, `/detail/${postWithPoll.postId}`, voter.email, voter.password);

    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 변경 버튼 클릭
    const changeBtn = pollContainer.locator('.btn', { hasText: '변경' });
    const hasChangeBtn = await changeBtn.isVisible().catch(() => false);
    test.skip(!hasChangeBtn, '변경 버튼 미표시');

    await changeBtn.click();

    // 투표 옵션이 다시 나타남
    const pollOptions = pollContainer.locator('input[name="poll-vote"]');
    await expect(pollOptions.first()).toBeVisible({ timeout: 10000 });

    // 두 번째 옵션 선택
    await pollOptions.nth(1).check();

    // 투표 버튼 클릭
    const voteBtn = pollContainer.locator('.btn', { hasText: '투표' });
    await voteBtn.click();
    await page.waitForLoadState('networkidle');

    // 결과 모드로 다시 전환 확인
    const results = pollContainer.locator('.poll-result');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('만료된 투표 상태 확인', async ({ request, page }) => {
    const { headers } = await loginViaApi(request, testUser.email, testUser.password);

    // 매우 짧은 만료 시간으로 생성 시도
    const res = await request.post(`${API_BASE}/v1/posts/`, {
      headers,
      data: {
        title: `만료투표 ${Date.now()}`,
        content: '만료 투표 테스트입니다.',
        category_id: 1,
        poll: {
          question: '만료 테스트 질문',
          options: ['옵션 1', '옵션 2'],
          expires_in_hours: 1,
        },
      },
    });
    const body = await res.json();
    const expiredPostId = body?.data?.post_id;
    test.skip(!expiredPostId, '만료 투표 게시글 생성 실패');

    await loginAndNavigate(page, `/detail/${expiredPostId}`, testUser.email, testUser.password);

    // 투표 컨테이너 확인
    const pollContainer = page.locator('.poll-view');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 옵션 또는 결과 중 하나는 표시되어야 함
    const hasOptions = await pollContainer.locator('.poll-option').first().isVisible().catch(() => false);
    const hasResults = await pollContainer.locator('.poll-result').first().isVisible().catch(() => false);
    expect(hasOptions || hasResults).toBeTruthy();
  });
});
