import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { DMProvider } from './contexts/DMContext';
import MainLayout from './components/MainLayout';
import AuthGuard from './components/AuthGuard';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import PostWritePage from './pages/PostWritePage';
import PostEditPage from './pages/PostEditPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationPage from './pages/NotificationPage';
import DMPage from './pages/DMPage';
import WikiListPage from './pages/wiki/WikiListPage';
import WikiDetailPage from './pages/wiki/WikiDetailPage';
import WikiWritePage from './pages/wiki/WikiWritePage';
import WikiEditPage from './pages/wiki/WikiEditPage';
import WikiHistoryPage from './pages/wiki/WikiHistoryPage';
import WikiRevisionPage from './pages/wiki/WikiRevisionPage';
import WikiDiffPage from './pages/wiki/WikiDiffPage';
import PackageListPage from './pages/packages/PackageListPage';
import PackageDetailPage from './pages/packages/PackageDetailPage';
import PackageWritePage from './pages/packages/PackageWritePage';
import PackageEditPage from './pages/packages/PackageEditPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <WebSocketProvider>
              <DMProvider>
                <Toast />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  <Route element={<MainLayout />}>
                    <Route path="/" element={<PostListPage />} />
                    <Route path="/detail/:id" element={<PostDetailPage />} />
                    <Route path="/user-profile/:id" element={<UserProfilePage />} />

                    <Route element={<AuthGuard />}>
                      <Route path="/notifications" element={<NotificationPage />} />
                      <Route path="/write" element={<PostWritePage />} />
                      <Route path="/edit/:id" element={<PostEditPage />} />
                      <Route path="/edit-profile" element={<ProfilePage />} />
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

                    {/* 관리자 */}
                    <Route element={<AuthGuard />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/reports" element={<AdminReportsPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </DMProvider>
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
