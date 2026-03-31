// API 에러 — Error 서브클래스로 스택 트레이스 + instanceof 지원
export class ApiError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`API error ${status}`);
    this.name = 'ApiError';
  }
}

// 환경별 API Base URL
// Vite dev 모드: import.meta.env.DEV로 감지 (포트 기반 감지 제거)
// CLAUDE.md: localhost 사용 금지 (쿠키 도메인 불일치)
const IS_LOCAL = window.location.hostname === '127.0.0.1';

function deriveApiDomain(): string {
  const host = window.location.hostname;
  if (host === 'my-community.shop') return 'api.my-community.shop';
  const parts = host.split('.');
  return `api-${parts[0]}.${parts.slice(1).join('.')}`;
}

export const API_BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8000'    // Vite dev 모드: BE 직접 연결
  : IS_LOCAL
    ? ''                         // Docker Compose: nginx 프록시
    : `https://${deriveApiDomain()}`;  // K8s: hostname에서 도출

// FastAPI는 trailing slash 없는 경로를 307로 리다이렉트하며 body가 유실됨
function ensureTrailingSlash(endpoint: string): string {
  const [path, query] = endpoint.split('?');
  const normalized = path.endsWith('/') ? path : path + '/';
  return query ? `${normalized}?${query}` : normalized;
}

// In-memory Access Token — localStorage 대신 모듈 변수로 관리 (XSS 방지)
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Refresh Token으로 Access Token 갱신 (thundering herd 방지: 진행 중인 요청 재사용)
async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const token = json?.data?.access_token;
        if (token) {
          accessToken = token;
          return true;
        }
      }
      accessToken = null;
      return false;
    } catch {
      accessToken = null;
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// 공통 HTTP 요청 함수
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${ensureTrailingSlash(endpoint)}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 → refresh 시도 → 재요청 (auth 엔드포인트 제외: 무한 루프 방지)
  const isAuthEndpoint = endpoint.includes('/auth/');
  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorBody);
  }

  // 204 No Content 등 본문 없는 응답 처리
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return {} as T;
}

export const api = {
  get: <T = unknown>(endpoint: string) =>
    request<T>(endpoint),

  post: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : '{}',
    }),

  put: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : '{}',
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : '{}',
    }),

  delete: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),

  // FormData 전송 — Content-Type 미설정 (브라우저가 multipart boundary 자동 추가)
  postFormData: async <T = unknown>(
    endpoint: string,
    formData: FormData,
  ): Promise<T> => {
    const url = `${API_BASE_URL}${ensureTrailingSlash(endpoint)}`;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    let res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    // 401 → refresh 시도 → 재요청
    if (res.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        const retryHeaders: Record<string, string> = {};
        if (accessToken) retryHeaders['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(url, {
          method: 'POST',
          headers: retryHeaders,
          body: formData,
          credentials: 'include',
        });
      }
    }
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errorBody);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return {} as T;
  },
};
