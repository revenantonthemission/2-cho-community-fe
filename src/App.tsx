import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { DMProvider } from './contexts/DMContext';
import MainLayout from './components/MainLayout';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';

// 핵심 페이지 — 즉시 로드 (초기 네비게이션에 필요)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import NotFoundPage from './pages/NotFoundPage';

// 인증 관련 페이지 — lazy 로드
const FindAccountPage = lazy(() => import('./pages/FindAccountPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const SocialSignupPage = lazy(() => import('./pages/SocialSignupPage'));

// 저빈도 페이지 — lazy 로드 (방문 시 비동기 로드)
const PasswordPage = lazy(() => import('./pages/PasswordPage'));
const PostWritePage = lazy(() => import('./pages/PostWritePage'));
const PostEditPage = lazy(() => import('./pages/PostEditPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const NotificationPage = lazy(() => import('./pages/NotificationPage'));
const DMPage = lazy(() => import('./pages/DMPage'));
const WikiListPage = lazy(() => import('./pages/wiki/WikiListPage'));
const WikiDetailPage = lazy(() => import('./pages/wiki/WikiDetailPage'));
const WikiWritePage = lazy(() => import('./pages/wiki/WikiWritePage'));
const WikiEditPage = lazy(() => import('./pages/wiki/WikiEditPage'));
const WikiHistoryPage = lazy(() => import('./pages/wiki/WikiHistoryPage'));
const WikiRevisionPage = lazy(() => import('./pages/wiki/WikiRevisionPage'));
const WikiDiffPage = lazy(() => import('./pages/wiki/WikiDiffPage'));
const TagDetailPage = lazy(() => import('./pages/TagDetailPage'));
const PackageListPage = lazy(() => import('./pages/packages/PackageListPage'));
const PackageDetailPage = lazy(() => import('./pages/packages/PackageDetailPage'));
const PackageWritePage = lazy(() => import('./pages/packages/PackageWritePage'));
const PackageEditPage = lazy(() => import('./pages/packages/PackageEditPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const MyActivityPage = lazy(() => import('./pages/MyActivityPage'));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <WebSocketProvider>
              <DMProvider>
                <Toast />
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/social-signup" element={<SocialSignupPage />} />
                    <Route path="/find-account" element={<FindAccountPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    <Route element={<MainLayout />}>
                      <Route path="/" element={<PostListPage />} />
                      <Route path="/detail/:id" element={<PostDetailPage />} />
                      <Route path="/user-profile/:id" element={<UserProfilePage />} />

                      <Route element={<AuthGuard />}>
                        <Route path="/notifications" element={<NotificationPage />} />
                        <Route path="/write" element={<PostWritePage />} />
                        <Route path="/edit/:id" element={<PostEditPage />} />
                        <Route path="/edit-profile" element={<ProfilePage />} />
                        <Route path="/password" element={<PasswordPage />} />
                        <Route path="/dm" element={<DMPage />} />
                      </Route>

                      {/* 위키 */}
                      <Route path="/wiki" element={<WikiListPage />} />
                      <Route element={<AuthGuard />}>
                        <Route path="/wiki/write" element={<WikiWritePage />} />
                        <Route path="/wiki/edit/:slug" element={<WikiEditPage />} />
                      </Route>
                      <Route path="/wiki/:slug" element={<WikiDetailPage />} />
                      <Route path="/wiki/:slug/history" element={<WikiHistoryPage />} />
                      <Route path="/wiki/:slug/revisions/:n" element={<WikiRevisionPage />} />
                      <Route path="/wiki/:slug/diff" element={<WikiDiffPage />} />

                      {/* 패키지 */}
                      <Route path="/packages" element={<PackageListPage />} />
                      <Route element={<AuthGuard />}>
                        <Route path="/packages/write" element={<PackageWritePage />} />
                        <Route path="/packages/edit/:id" element={<PackageEditPage />} />
                      </Route>
                      <Route path="/packages/:id" element={<PackageDetailPage />} />

                      {/* 관리자 — role 검증 포함 */}
                      <Route element={<AdminGuard />}>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/reports" element={<AdminReportsPage />} />
                      </Route>

                      {/* 활동 / 뱃지 */}
                      <Route element={<AuthGuard />}>
                        <Route path="/my-activity" element={<MyActivityPage />} />
                      </Route>
                      <Route path="/badges" element={<BadgesPage />} />
                      <Route path="/tags/:name" element={<TagDetailPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </DMProvider>
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
