// tests/e2e/posts/create.spec.js
// 게시글 작성 E2E 테스트 — React SPA 버전

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
    await expect(page.locator('input#post-title')).toBeVisible();
    await expect(page.locator('select#category-select')).toBeVisible();
  });

  test('카테고리 선택 옵션 로드', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    // 카테고리 select에 옵션이 로드될 때까지 대기
    const categorySelect = page.locator('select#category-select');
    await expect(categorySelect).toBeVisible({ timeout: 10000 });

    // 옵션이 1개 이상 존재 (기본 placeholder 포함)
    const options = categorySelect.locator('option');
    await expect(options).not.toHaveCount(0, { timeout: 10000 });
  });

  test('태그 입력 (최대 제한)', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    const tagInput = page.locator('.tag-input-container input');
    await expect(tagInput).toBeVisible({ timeout: 10000 });

    // 태그 5개 입력
    for (let i = 1; i <= 5; i++) {
      await tagInput.fill(`태그${i}`);
      await tagInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // 태그 배지 5개 존재 확인
    const tagBadges = page.locator('.tag-chips .tag-badge');
    await expect(tagBadges).toHaveCount(5, { timeout: 5000 });
  });

  test('제출 버튼 초기 비활성화 → 입력 시 활성화', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    // 초기 비활성화 확인
    const submitBtn = page.locator('button.btn.btn-primary[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // 카테고리 선택
    const categorySelect = page.locator('select#category-select');
    await categorySelect.waitFor({ state: 'visible', timeout: 10000 });
    const options = await categorySelect.locator('option:not([disabled])').all();
    if (options.length > 0) {
      await categorySelect.selectOption({ index: 1 });
    }

    // 제목 입력
    await page.fill('input#post-title', '테스트 제목');

    // 내용 입력 (MarkdownEditor: textarea)
    const contentArea = page.locator('.write-form textarea').first();
    await contentArea.fill('테스트 본문 내용입니다.');

    // 버튼 활성화 확인
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
  });

  test('게시글 제출 → 상세 또는 메인 페이지로 이동', async ({ page }) => {
    await loginAndNavigate(page, '/write', testUser.email, testUser.password);

    const uniqueTitle = `작성테스트 ${Date.now()}`;

    // 카테고리 선택
    const categorySelect = page.locator('select#category-select');
    await categorySelect.waitFor({ state: 'visible', timeout: 10000 });
    await categorySelect.selectOption({ index: 1 });

    // 제목 입력
    await page.fill('input#post-title', uniqueTitle);

    // 내용 입력
    const contentArea = page.locator('.write-form textarea').first();
    await contentArea.fill('E2E 테스트로 작성한 게시글 본문입니다.');

    // 제출
    const submitBtn = page.locator('button.btn.btn-primary[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    // React SPA: 게시 후 상세 페이지(/detail/:id) 또는 홈(/)으로 이동
    await page.waitForURL(/\/(detail\/\d+)?$/, { timeout: 10000 });
  });
});
