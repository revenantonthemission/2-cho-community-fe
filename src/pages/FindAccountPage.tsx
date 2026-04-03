import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';

type Tab = 'email' | 'password';

export default function FindAccountPage() {
  const [tab, setTab] = useState<Tab>('email');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setNickname('');
    setEmail('');
    setResult('');
  }

  async function handleFindEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    setResult('');
    try {
      const res = await api.post<{ data: { masked_email: string } }>(
        API_ENDPOINTS.USERS.FIND_EMAIL,
        { nickname: nickname.trim() },
      );
      setResult(`가입된 이메일: ${res.data.masked_email}`);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 429) {
        showToast('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else {
        setResult('일치하는 계정을 찾을 수 없습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setResult('');
    try {
      await api.post(API_ENDPOINTS.USERS.RESET_PASSWORD, { email: email.trim() });
      setResult('임시 비밀번호가 이메일로 발송되었습니다.');
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 429) {
        showToast('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else {
        // 보안: 이메일 존재 여부 노출 방지 — 항상 성공 메시지
        setResult('임시 비밀번호가 이메일로 발송되었습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-container">
          <h1 className="page-title">계정 찾기</h1>
          <div className="tab-nav">
            <button
              className={`tab-btn${tab === 'email' ? ' active' : ''}`}
              onClick={() => handleTabChange('email')}
            >
              이메일 찾기
            </button>
            <button
              className={`tab-btn${tab === 'password' ? ' active' : ''}`}
              onClick={() => handleTabChange('password')}
            >
              비밀번호 찾기
            </button>
          </div>

        {tab === 'email' ? (
          <form onSubmit={handleFindEmail}>
            <div className="input-group">
              <label htmlFor="find-nickname">닉네임</label>
              <input
                id="find-nickname"
                className="input-field"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="가입 시 사용한 닉네임"
                autoComplete="username"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={!nickname.trim() || isSubmitting}>
              {isSubmitting ? '검색 중...' : '이메일 찾기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label htmlFor="find-email">이메일</label>
              <input
                id="find-email"
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입 시 사용한 이메일"
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={!email.trim() || isSubmitting}>
              {isSubmitting ? '발송 중...' : '임시 비밀번호 발송'}
            </button>
          </form>
        )}

        {result && <div className="result-box"><p>{result}</p></div>}

          <div className="links">
            <Link to={ROUTES.LOGIN}>로그인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
