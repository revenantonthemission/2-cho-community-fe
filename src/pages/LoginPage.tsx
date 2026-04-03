import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { API_BASE_URL, ApiError } from '../services/api';
import { showToast } from '../utils/toast';

const GITHUB_AUTH_URL = `${API_BASE_URL}/v1/auth/social/github/authorize/`;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 쿼리 파라미터 처리 (리다이렉트 후 알림)
  useEffect(() => {
    const suspended = searchParams.get('suspended');
    const session = searchParams.get('session');
    const oauthError = searchParams.get('error');

    if (suspended === 'true') {
      setError('계정이 정지되었습니다.');
    } else if (session === 'expired') {
      showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
    } else if (oauthError === 'cancelled') {
      showToast('소셜 로그인이 취소되었습니다.', 'error');
    } else if (oauthError === 'suspended') {
      setError('계정이 정지되어 로그인할 수 없습니다.');
    } else if (oauthError) {
      showToast('소셜 로그인에 실패했습니다.', 'error');
    }

    // 쿼리 파라미터 정리 (URL 깔끔하게)
    if (suspended || session || oauthError) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      const data = apiErr?.data as { message?: string; detail?: string | object } | undefined;
      const detail = data?.detail;
      const message =
        data?.message
        ?? (typeof detail === 'string' ? detail : null)
        ?? '로그인에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !email || !password;

  return (
    <div className="login-page">
      {/* 좌측: 브랜딩 */}
      <div className="login-brand">
        <div className="login-brand__content">
          <h1 className="login-brand__logo">
            Camp Linux<span className="login-brand__cursor">_</span>
          </h1>
          <p className="login-brand__tagline">리눅스 유저를 위한 베이스캠프</p>
          <div className="login-brand__terminal">
            <div className="login-brand__terminal-bar">
              <span className="terminal-dot terminal-dot--red"></span>
              <span className="terminal-dot terminal-dot--yellow"></span>
              <span className="terminal-dot terminal-dot--green"></span>
            </div>
            <div className="login-brand__terminal-body">
              <p>
                <span className="terminal-prompt">$</span> cat /etc/motd
              </p>
              <p className="terminal-output">배포판 토론, Q&amp;A, 위키, 패키지 리뷰</p>
              <p className="terminal-output">커뮤니티에서 함께 배우고 공유하세요.</p>
              <p>
                <span className="terminal-prompt">$</span>{' '}
                <span className="terminal-typing">_</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 로그인 폼 */}
      <div className="login-form-section">
        <div className="login-container">
          <h1 className="page-title">로그인</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">이메일</label>
              <input
                id="email"
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="password">비밀번호</label>
              <input
                id="password"
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            {error && <p className="error-msg" id="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isDisabled}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="social-login-divider">
            <span>또는</span>
          </div>

          <a href={GITHUB_AUTH_URL} className="social-login-btn social-login-btn--github">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub로 로그인
          </a>

          <div className="links">
            <Link to={ROUTES.SIGNUP}>회원가입</Link>
            <Link to={ROUTES.FIND_ACCOUNT}>이메일 / 비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
