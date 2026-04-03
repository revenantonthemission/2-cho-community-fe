import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { useAuth } from '../hooks/useAuth';
import { isValidPassword } from '../utils/validators';

export default function PasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError('비밀번호는 영문·숫자·특수문자(!@#$%^&*) 포함 8자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(API_ENDPOINTS.USERS.PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        setError('현재 비밀번호가 올바르지 않습니다.');
      } else {
        setError('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="password-container">
      <h1 className="page-title">비밀번호 변경</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label" htmlFor="current-pw">현재 비밀번호</label>
          <input
            id="current-pw"
            type="password"
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="new-pw">새 비밀번호</label>
          <input
            id="new-pw"
            type="password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="confirm-pw">새 비밀번호 확인</label>
          <input
            id="confirm-pw"
            type="password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={!isValid || isSubmitting}>
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}
