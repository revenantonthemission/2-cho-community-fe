// tests/e2e/fixtures/test-helpers.js
// E2E 테스트 공통 헬퍼 함수 — React SPA 버전
import { expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8000';

/**
 * API로 테스트 사용자 생성
 * 기본적으로 이메일 인증까지 자동 처리 (overrides.verified = false로 비활성화 가능)
 */
export async function createTestUser(request, overrides = {}) {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = overrides.email || `e2e_${suffix}@test.com`;
  const password = overrides.password || 'Test1234!@';
  const nickname = overrides.nickname || `e2e${suffix.slice(-7)}`;

  const res = await request.post(`${API_BASE}/v1/users/`, {
    multipart: { email, password, nickname, terms_agreed: 'true' },
  });

  let userId = null;
  try {
    const body = await res.json();
    userId = body?.data?.user_id;
  } catch {}

  if (!userId && res.status() < 400) {
    const findRes = await request.post(`${API_BASE}/v1/test/users/find`, {
      data: { email },
    });
    try {
      const findBody = await findRes.json();
      userId = findBody?.data?.user_id;
    } catch {}
  }

  if (userId && overrides.verified !== false) {
    await verifyEmail(request, userId);
  }

  return { email, password, nickname, userId, statusCode: res.status() };
}

/**
 * API로 로그인하여 토큰 반환
 */
export async function loginViaApi(request, email, password) {
  const res = await request.post(`${API_BASE}/v1/auth/session/`, {
    data: { email, password },
  });
  const body = await res.json();
  return {
    accessToken: body?.data?.access_token,
    headers: { Authorization: `Bearer ${body?.data?.access_token}` },
  };
}

/**
 * React SPA 인증 설정
 * - API 로그인으로 토큰 획득
 * - 라우트 인터셉터로 모든 API 요청에 Bearer 토큰 주입
 * - 페이지의 in-memory 토큰도 설정 (evaluate로 setAccessToken 호출)
 */
async function setupAuth(page, email, password) {
  const res = await page.request.post(`${API_BASE}/v1/auth/session/`, {
    data: { email, password },
  });
  const body = await res.json();
  const accessToken = body?.data?.access_token;

  if (!accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }

  // API 요청에 Authorization 헤더 주입
  await page.route(`${API_BASE}/**`, async (route) => {
    const headers = {
      ...route.request().headers(),
      'authorization': `Bearer ${accessToken}`,
    };
    await route.continue({ headers });
  });

  return accessToken;
}

/**
 * UI를 통해 로그인 (브라우저 로그인 플로우)
 * React SPA: /login → 폼 입력 → / 로 리다이렉트
 */
export async function loginViaUI(page, email, password) {
  await page.goto('/login');

  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // React controlled input: fill()만으로 onChange 트리거됨 (dispatchEvent 불필요)
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled({ timeout: 10000 });

  await submitBtn.click();

  // SPA: /login → / 리다이렉트
  await page.waitForURL('**/', { timeout: 15000 });
}

/**
 * API 로그인 후 특정 페이지로 이동
 * React SPA: 라우트 인터셉터 설정 후 직접 네비게이션
 */
export async function loginAndNavigate(page, url, email, password) {
  await setupAuth(page, email, password);
  await page.goto(url || '/');
  await page.waitForLoadState('networkidle');
}

/**
 * API로 게시글 생성
 */
export async function createTestPost(request, headers, overrides = {}) {
  const title = overrides.title || `E2E 게시글 ${Date.now()}`;
  const res = await request.post(`${API_BASE}/v1/posts/`, {
    headers,
    data: {
      title,
      content: overrides.content || '테스트 본문입니다.',
      category_id: overrides.categoryId || 1,
    },
  });
  const body = await res.json();
  return { postId: body?.data?.post_id, title };
}

/**
 * 테스트 API: 이메일 인증 바이패스
 */
export async function verifyEmail(request, userId) {
  return request.post(`${API_BASE}/v1/test/users/verify-email`, {
    data: { user_id: userId },
  });
}

/**
 * 테스트 API: 관리자 역할 부여
 */
export async function setAdminRole(request, userId) {
  return request.post(`${API_BASE}/v1/test/users/set-role`, {
    data: { user_id: userId, role: 'admin' },
  });
}

/**
 * 테스트 API: 사용자 정지
 */
export async function suspendUser(request, userId, days = 7, reason = '테스트 정지') {
  return request.post(`${API_BASE}/v1/test/users/suspend`, {
    data: { user_id: userId, duration_days: days, reason },
  });
}

/**
 * 테스트 API: 사용자 정지 해제
 */
export async function unsuspendUser(request, userId) {
  return request.delete(`${API_BASE}/v1/test/users/suspend`, {
    data: { user_id: userId },
  });
}

/**
 * 테스트 API: DB 정리
 */
export async function cleanupDatabase(request) {
  return request.post(`${API_BASE}/v1/test/cleanup`);
}

/**
 * SPA 네비게이션 대기 헬퍼
 * React Router는 클라이언트 라우팅이므로 networkidle 대신 DOM 변화 대기
 */
export async function waitForPageContent(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

export { API_BASE };
