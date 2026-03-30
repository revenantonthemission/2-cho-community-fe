import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; detail?: string | object } };
      const detail = apiErr?.data?.detail;
      const message =
        apiErr?.data?.message
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
          <h2>로그인</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="login-btn" disabled={isDisabled}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="links">
            <Link to={ROUTES.SIGNUP}>회원가입</Link>
            <a href="/find-account">이메일 / 비밀번호 찾기</a>
          </div>
        </div>
      </div>
    </div>
  );
}
