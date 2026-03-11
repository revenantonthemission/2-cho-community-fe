// tests/e2e/fixtures/test-helpers.js
// E2E 테스트 공통 헬퍼 함수
const API_BASE = 'http://127.0.0.1:8000';

/**
 * API로 테스트 사용자 생성
 * 주의: E2E에서는 DB 직접 접근 불가. 이메일 인증이 필요한 경우
 * 백엔드 테스트 환경에서 자동 인증되도록 설정하거나,
 * 이미 시딩된 사용자를 사용해야 함.
 */
export async function createTestUser(request, overrides = {}) {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = overrides.email || `e2e_${suffix}@test.com`;
  const password = overrides.password || 'Test1234!@#$';
  const nickname = overrides.nickname || `e2e${suffix.slice(-8)}`;

  const res = await request.post(`${API_BASE}/v1/users/`, {
    multipart: { email, password, nickname },
  });

  let userId = null;
  try {
    const body = await res.json();
    userId = body?.data?.user_id;
  } catch {}

  return { email, password, nickname, userId, statusCode: res.status() };
}

/**
 * API로 로그인하여 토큰 반환
 */
export async function loginViaApi(request, email, password) {
  const res = await request.post(`${API_BASE}/v1/auth/session`, {
    data: { email, password },
  });
  const body = await res.json();
  return {
    accessToken: body?.data?.access_token,
    headers: { Authorization: `Bearer ${body?.data?.access_token}` },
  };
}

/**
 * UI를 통해 로그인
 */
export async function loginViaUI(page, email, password) {
  await page.goto('/login');
  await page.fill('input[name="email"], #email', email);
  await page.fill('input[name="password"], #password', password);
  await page.click('button[type="submit"], #login-btn');
  await page.waitForURL('**/main', { timeout: 10000 });
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
 * 로그인 후 특정 페이지로 이동
 */
export async function loginAndNavigate(page, url, email, password) {
  await loginViaUI(page, email, password);
  if (url && url !== '/main') {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
}

export { API_BASE };
