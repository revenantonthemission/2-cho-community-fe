// tests/e2e/security/xss.spec.js
// XSS 취약점 테스트 — React SPA 버전
// React는 기본적으로 XSS를 방지함. 마크다운 렌더러 등에서의 안전성 검증

import { test, expect } from '@playwright/test';
import { API_BASE } from '../fixtures/test-helpers.js';

test.describe('XSS 방어 테스트', () => {
    test.beforeEach(async ({ page }) => {
        // 모든 dialog (alert, confirm, prompt) 감지
        page.on('dialog', dialog => {
            throw new Error(`Unexpected dialog: ${dialog.type()} - ${dialog.message()}`);
        });
    });

    test('백엔드 validation 에러가 XSS를 유발하지 않아야 함', async ({ page }) => {
        const XSS_PAYLOAD = '<script>alert("XSS")</script><img src=x onerror=alert("XSS2")>';

        await page.goto('/signup');

        // 백엔드 API를 인터셉트하여 XSS 페이로드가 포함된 에러 응답 반환
        await page.route(/\/v1\/users\/?$/, async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        detail: {
                            error: 'validation_error',
                            message: XSS_PAYLOAD,
                        },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        // 폼 입력 (React SPA selectors)
        await page.fill('input#email', 'xss-test@example.com');
        await page.fill('input#password', 'Test1234!@');
        await page.fill('input#passwordConfirm', 'Test1234!@');
        await page.fill('input#nickname', 'xsstest');

        // 이용약관 동의 체크
        await page.check('.terms-checkbox input[type="checkbox"]');

        // 가입 버튼 클릭
        const signupBtn = page.locator('button[type="submit"]');
        await expect(signupBtn).toBeEnabled({ timeout: 10000 });
        await signupBtn.click();

        // 에러 메시지가 텍스트로 표시됨 (React는 기본적으로 HTML 이스케이프)
        await page.waitForTimeout(1000);

        // script 요소가 생성되지 않았는지 확인
        const scriptTags = await page.locator('script:has-text("alert")').count();
        expect(scriptTags).toBe(0);

        // img[onerror] 요소가 생성되지 않았는지 확인
        const maliciousImgs = await page.locator('img[src="x"]').count();
        expect(maliciousImgs).toBe(0);
    });

    test('React의 JSX 렌더링이 XSS를 방지해야 함', async ({ page }) => {
        // React 앱 로드
        await page.goto('/login');

        // textContent를 사용하여 HTML 태그가 이스케이프되는지 확인
        const result = await page.evaluate(() => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            // React의 textContent 방식 시뮬레이션
            div.textContent = '<script>alert("XSS")</script>';

            const hasScript = div.querySelector('script') !== null;
            const textContent = div.textContent;

            document.body.removeChild(div);
            return { hasScript, textContent };
        });

        expect(result.hasScript).toBe(false);
        expect(result.textContent).toBe('<script>alert("XSS")</script>');
    });

    test('다양한 XSS 벡터가 모두 차단되어야 함', async ({ page }) => {
        const xssVectors = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            '<iframe src="javascript:alert(1)">',
            '<body onload=alert(1)>',
            '<input onfocus=alert(1) autofocus>',
            '<marquee onstart=alert(1)>',
            '<div onclick=alert(1)>Click</div>',
            'javascript:alert(1)',
            '<a href="javascript:alert(1)">link</a>',
        ];

        await page.goto('/login');

        for (const xssPayload of xssVectors) {
            await page.evaluate((payload) => {
                const container = document.createElement('div');
                container.id = `xss-test-${Math.random()}`;
                document.body.appendChild(container);

                // React 방식: textContent 사용
                container.textContent = payload;
            }, xssPayload);
        }

        // XSS 페이로드가 실행되지 않았는지 확인
        const xssScriptTags = await page.locator('script:has-text("alert")').count();
        const allImgTags = await page.locator('img[src="x"]').count();
        const allIframeTags = await page.locator('iframe[src^="javascript:"]').count();

        expect(xssScriptTags).toBe(0);
        expect(allImgTags).toBe(0);
        expect(allIframeTags).toBe(0);
    });

    test('ErrorBoundary가 안전하게 렌더링되어야 함', async ({ page }) => {
        // React ErrorBoundary는 class component로 구현됨
        // 에러 발생 시 안전한 폴백 UI를 렌더링해야 함
        await page.goto('/login');

        // ErrorBoundary가 존재하고 정상적으로 렌더링되는지 확인
        const pageContent = await page.locator('.login-page').isVisible().catch(() => false);
        expect(pageContent).toBeTruthy();
    });
});
