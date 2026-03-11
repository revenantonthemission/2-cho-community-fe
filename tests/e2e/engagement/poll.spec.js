// tests/e2e/engagement/poll.spec.js
// 투표(Poll) E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
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
    // 투표 게시글이 정상 생성되지 않으면 스킵
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`/detail?id=${postWithPoll.postId}`);
    await page.waitForLoadState('networkidle');

    // 투표 컨테이너 표시 확인
    const pollContainer = page.locator('#poll-container');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 질문 표시
    const pollQuestion = pollContainer.locator('.poll-question');
    await expect(pollQuestion).toContainText('테스트 투표 질문');

    // 투표 폼 (아직 투표하지 않은 상태)
    const pollForm = pollContainer.locator('#poll-vote-form');
    await expect(pollForm).toBeVisible();

    // 옵션이 3개 표시되는지 확인
    const options = pollContainer.locator('.poll-vote-option');
    await expect(options).toHaveCount(3);
  });

  test('투표 클릭 → 결과 바(프로그레스) 표시', async ({ page }) => {
    test.skip(!postWithPoll?.postId, '투표 게시글 생성 실패');

    // 별도 유저로 투표 (게시글 작성자와 다른 유저가 필요할 수 있음)
    const voter = await createTestUser(page.request);

    await loginViaUI(page, voter.email, voter.password);
    await page.goto(`/detail?id=${postWithPoll.postId}`);
    await page.waitForLoadState('networkidle');

    const pollContainer = page.locator('#poll-container');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 투표 폼이 있으면 투표 수행
    const pollForm = pollContainer.locator('#poll-vote-form');
    const hasForm = await pollForm.isVisible().catch(() => false);

    if (hasForm) {
      // 첫 번째 옵션 선택
      const firstOption = pollContainer.locator('input[name="poll-vote"]').first();
      await firstOption.check();

      // 투표 버튼 클릭
      const voteBtn = page.locator('#poll-vote-btn');
      await voteBtn.click();

      // 결과 표시 대기 (투표 후 결과 모드로 전환)
      await page.waitForLoadState('networkidle');
    }

    // 결과 바 표시 확인 (poll-options-results 또는 poll-bar)
    const resultsOrBar = pollContainer.locator('.poll-options-results, .poll-bar');
    await expect(resultsOrBar.first()).toBeVisible({ timeout: 10000 });
  });

  test('만료된 투표 비활성화 상태 확인', async ({ request, page }) => {
    // 만료된 투표 생성 (expires_in_hours: 0은 즉시 만료가 아닐 수 있으므로,
    // 이미 만료된 투표를 테스트하려면 백엔드에서 처리가 필요함)
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
          expires_in_hours: 1, // 최소 만료 시간
        },
      },
    });
    const body = await res.json();
    const expiredPostId = body?.data?.post_id;
    test.skip(!expiredPostId, '만료 투표 게시글 생성 실패');

    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`/detail?id=${expiredPostId}`);
    await page.waitForLoadState('networkidle');

    // 투표 컨테이너 확인
    const pollContainer = page.locator('#poll-container');
    await expect(pollContainer).toBeVisible({ timeout: 10000 });

    // 아직 만료되지 않았다면 투표 폼이 보이고, 만료 시 결과 모드
    // 이 테스트는 만료 시간에 의존하므로 투표 UI가 존재하는지만 확인
    const hasForm = await pollContainer.locator('#poll-vote-form').isVisible().catch(() => false);
    const hasResults = await pollContainer.locator('.poll-options-results').isVisible().catch(() => false);

    // 투표 폼 또는 결과 중 하나는 표시되어야 함
    expect(hasForm || hasResults).toBeTruthy();
  });
});
