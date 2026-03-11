// tests/e2e/posts/create.spec.js
// 게시글 작성 E2E 테스트

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginViaUI,
  loginAndNavigate,
} from '../fixtures/test-helpers.js';

test.describe('게시글 작성', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test('글쓰기 페이지 진입 확인', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    // 페이지 제목 확인
    await expect(page.locator('.page-title')).toHaveText('게시글 작성');

    // 필수 폼 요소 확인
    await expect(page.locator('#post-title')).toBeVisible();
    await expect(page.locator('#post-content')).toBeVisible();
    await expect(page.locator('#category-select')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();
  });

  test('카테고리 선택 옵션 로드', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    // 카테고리 select에 옵션이 로드될 때까지 대기
    const categorySelect = page.locator('#category-select');
    await expect(categorySelect).toBeVisible({ timeout: 10000 });

    // 옵션이 1개 이상 존재 (기본 placeholder 포함)
    const options = categorySelect.locator('option');
    await expect(options).not.toHaveCount(0, { timeout: 10000 });
  });

  test('태그 입력 (최대 5개 제한)', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    const tagInput = page.locator('#tag-input');
    await expect(tagInput).toBeVisible({ timeout: 10000 });

    // 태그 5개 입력
    for (let i = 1; i <= 5; i++) {
      await tagInput.fill(`태그${i}`);
      await tagInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // 태그 칩 5개 존재 확인
    const tagChips = page.locator('#tag-chips .tag-chip');
    await expect(tagChips).toHaveCount(5, { timeout: 5000 });

    // 6번째 태그 입력 시도 → 추가 안 됨
    await tagInput.fill('초과태그');
    await tagInput.press('Enter');
    await page.waitForTimeout(300);

    // 여전히 5개
    await expect(tagChips).toHaveCount(5);
  });

  test('제출 버튼 초기 비활성화 → 입력 시 활성화', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    // 초기 비활성화 확인
    const submitBtn = page.locator('#submit-btn');
    await expect(submitBtn).toBeDisabled();

    // 제목 입력
    await page.fill('#post-title', '테스트 제목');
    await page.dispatchEvent('#post-title', 'input');

    // 내용 입력
    await page.fill('#post-content', '테스트 본문 내용입니다.');
    await page.dispatchEvent('#post-content', 'input');

    // 버튼 활성화 확인
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
  });

  test('게시글 제출 → 메인 페이지로 이동', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    const uniqueTitle = `작성테스트 ${Date.now()}`;

    // 제목 입력
    await page.fill('#post-title', uniqueTitle);
    await page.dispatchEvent('#post-title', 'input');

    // 내용 입력
    await page.fill('#post-content', 'E2E 테스트로 작성한 게시글 본문입니다.');
    await page.dispatchEvent('#post-content', 'input');

    // 제출
    const submitBtn = page.locator('#submit-btn');
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // 메인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*main/, { timeout: 10000 });

    // 작성한 게시글이 목록에 표시되는지 확인
    await page.waitForSelector('.post-card', { timeout: 10000 });
    const createdPost = page.locator('.post-card').filter({ hasText: uniqueTitle });
    await expect(createdPost.first()).toBeVisible({ timeout: 10000 });
  });
});
