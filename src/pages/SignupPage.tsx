import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { UI_MESSAGES } from '../constants/messages';
import { showToast } from '../utils/toast';
import {
  isValidEmail,
  isValidPassword,
  isValidNickname,
} from '../utils/validators';

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string => {
    if (!isValidEmail(email)) return '올바른 이메일 형식이 아닙니다.';
    if (!isValidPassword(password))
      return '비밀번호는 영문·숫자·특수문자(!@#$%^&*) 포함 8자 이상이어야 합니다.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    if (!isValidNickname(nickname)) return '닉네임은 2~20자 사이여야 합니다.';
    if (!termsAgreed) return '이용약관에 동의해주세요.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('nickname', nickname);
      if (profileImage) formData.append('profile_image', profileImage);

      await api.postFormData(API_ENDPOINTS.USERS.ROOT, formData);
      showToast(UI_MESSAGES.SIGNUP_SUCCESS);
      navigate(ROUTES.LOGIN);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; detail?: string } };
      const message =
        apiErr?.data?.message ?? apiErr?.data?.detail ?? '회원가입에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="write-header">
        <Link to="/" className="write-header__logo">
          Camp Linux
        </Link>
      </header>
      <div className="signup-container">
        <h2 className="page-title">회원가입</h2>
        <form onSubmit={handleSubmit}>
          {/* 프로필 이미지 */}
          <div className="input-group" style={{ textAlign: 'center' }}>
            <label className="input-label">프로필 사진 (선택)</label>
            <label
              className="profile-circle signup-profile-upload"
              style={
                profilePreview
                  ? { backgroundImage: `url(${profilePreview})`, backgroundSize: 'cover', cursor: 'pointer' }
                  : { cursor: 'pointer' }
              }
            >
              {!profilePreview && '📷'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setProfileImage(file);
                  const reader = new FileReader();
                  reader.onload = () => setProfilePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">
              이메일*
            </label>
            <input
              id="email"
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="password">
              비밀번호*
            </label>
            <input
              id="password"
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="영문·숫자·특수문자 포함 8자 이상"
              autoComplete="new-password"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="passwordConfirm">
              비밀번호 확인*
            </label>
            <input
              id="passwordConfirm"
              className="input-field"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              autoComplete="new-password"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="nickname">
              닉네임*
            </label>
            <input
              id="nickname"
              className="input-field"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="2~20자 닉네임을 입력하세요"
              autoComplete="username"
            />
          </div>
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
            />
            이용약관 및 개인정보 처리방침에 동의합니다
          </label>
          {error && <p className="error-msg">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <div className="links">
          <Link to={ROUTES.LOGIN}>로그인으로 돌아가기</Link>
        </div>
      </div>
    </>
  );
}
