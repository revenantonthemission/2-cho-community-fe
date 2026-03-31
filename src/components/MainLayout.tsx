import { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomTab from './BottomTab';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';

export default function MainLayout() {
  const { user, isAuthenticated } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sidebar가 있는 레이아웃에서 body 클래스 설정 (CSS가 header 너비 조정에 사용)
  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar');
  }, []);

  // 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION);
      showToast('인증 메일이 재발송되었습니다.');
      setResendCooldown(60);
    } catch {
      showToast('메일 발송에 실패했습니다.', 'error');
    }
  }, [resendCooldown]);

  const showVerifyBanner = isAuthenticated && user && !user.email_verified;

  return (
    <>
      <Header />
      {showVerifyBanner && (
        <div className="email-verify-banner">
          <span>이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.</span>
          <button
            className="email-verify-banner__btn"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `재발송 (${resendCooldown}초)` : '인증 메일 재발송'}
          </button>
        </div>
      )}
      <main className="main-container">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <BottomTab />
    </>
  );
}
