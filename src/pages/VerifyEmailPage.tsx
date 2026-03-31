import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
        setStatus('success');
      } catch {
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {status === 'loading' && <p>이메일 인증 처리 중...</p>}
        {status === 'success' && (
          <>
            <h2>이메일 인증 완료</h2>
            <p>이메일이 성공적으로 인증되었습니다.</p>
            <Link to={ROUTES.LOGIN} className="btn btn-primary">로그인</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2>인증 실패</h2>
            <p>유효하지 않거나 만료된 인증 링크입니다.</p>
            <Link to={ROUTES.LOGIN} className="btn btn-secondary">로그인으로 돌아가기</Link>
          </>
        )}
      </div>
    </div>
  );
}
