import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse } from '../types/common';

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,10}$/;

export default function SocialSignupPage() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
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
        setAccessToken(decodeURIComponent(value));
        document.cookie = 'access_token_temp=; path=/; max-age=0';
        return;
      }
    }
    // 토큰이 없으면 로그인 페이지로
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;

    // FE 사전 검증 — BE 스키마와 동일: 3~10자, 영문/숫자/언더바
    if (!NICKNAME_REGEX.test(trimmed)) {
      setError('닉네임은 3~10자의 영문, 숫자, 언더바(_)만 사용할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post<ApiResponse<{ nickname?: string }>>(
        API_ENDPOINTS.AUTH.SOCIAL_COMPLETE_SIGNUP,
        { nickname: trimmed },
      );
      // BE가 200 + NICKNAME_DUPLICATED 코드로 반환하는 경우 처리
      if (res.code === 'NICKNAME_DUPLICATED') {
        setError('이미 사용 중인 닉네임입니다.');
        return;
      }
      // 닉네임 설정 완료 → AuthContext 갱신 후 홈으로
      await fetchUser();
      showToast('회원가입이 완료되었습니다!');
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      setError(data?.message ?? '닉네임 설정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = nickname.trim().length >= 3 && nickname.trim().length <= 10;

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
              placeholder="3~10자 영문/숫자/언더바"
              minLength={3}
              maxLength={10}
              pattern="[a-zA-Z0-9_]{3,10}"
              autoFocus
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={!isValid || isSubmitting}>
            {isSubmitting ? '설정 중...' : '시작하기'}
          </button>
          </form>
        </div>
      </div>
    </div>
  );
}
