import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
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

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toast />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<MainLayout />}>
              <Route path="/" element={<PostListPage />} />
              <Route path="/detail/:id" element={<PostDetailPage />} />
              <Route path="/user-profile/:id" element={<UserProfilePage />} />

              <Route element={<AuthGuard />}>
                <Route path="/write" element={<PostWritePage />} />
                <Route path="/edit/:id" element={<PostEditPage />} />
                <Route path="/edit-profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
