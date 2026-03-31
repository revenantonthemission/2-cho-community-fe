import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';

export default function SocialSignupPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 쿠키에서 임시 access token 읽기 (BE가 소셜 로그인 후 설정)
  useEffect(() => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (key === 'access_token_temp' && value) {
        setAccessToken(value);
        document.cookie = 'access_token_temp=; path=/; max-age=0';
        return;
      }
    }
    // 토큰이 없으면 로그인 페이지로
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post(API_ENDPOINTS.AUTH.SOCIAL_COMPLETE_SIGNUP, {
        nickname: nickname.trim(),
      });
      showToast('회원가입이 완료되었습니다!');
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      setError(data?.message ?? '닉네임 설정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="social-signup-container">
          <h2 className="social-signup-title">소셜 계정 설정</h2>
        <p className="social-signup-desc">GitHub 로그인 성공! 커뮤니티에서 사용할 닉네임을 설정해주세요.</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="social-nickname">닉네임</label>
            <input
              id="social-nickname"
              className="input-field"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="2~20자 닉네임"
              minLength={2}
              maxLength={20}
              autoFocus
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={!nickname.trim() || isSubmitting}>
            {isSubmitting ? '설정 중...' : '시작하기'}
          </button>
          </form>
        </div>
      </div>
    </div>
  );
}
