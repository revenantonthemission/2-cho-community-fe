import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import { ROUTES } from '../constants/routes';

// 관리자 전용 라우트 가드 — AuthGuard(로그인) + role 검증
export default function AdminGuard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.role !== 'admin') return <Navigate to={ROUTES.HOME} replace />;
  return <Outlet />;
}
