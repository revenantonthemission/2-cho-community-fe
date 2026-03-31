import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import NotificationBell from './NotificationBell';
import DMBadge from './dm/DMBadge';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  async function handleLogout() {
    await logout();
    showToast(UI_MESSAGES.LOGOUT_SUCCESS);
    navigate(ROUTES.LOGIN);
  }

  return (
    <header>
      <div className="header-title-wrapper">
        <Link to={ROUTES.HOME} className="header-home-link">
          <span className="header-brand">Camp Linux</span>
        </Link>
        <div className="header-auth">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated && user && <NotificationBell />}
          {isAuthenticated && user && <DMBadge />}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="profile-circle"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="프로필 메뉴"
                style={
                  user.profile_image
                    ? { backgroundImage: `url(${user.profile_image})`, backgroundSize: 'cover' }
                    : undefined
                }
              >
                {!user.profile_image && user.nickname?.charAt(0).toUpperCase()}
              </button>
              {dropdownOpen && (
                <div className="header-dropdown">
                  <ul role="menu">
                    <li role="menuitem">
                      <Link to={ROUTES.PROFILE} onClick={() => setDropdownOpen(false)}>
                        회원정보수정
                      </Link>
                    </li>
                    <li role="menuitem">
                      <button onClick={handleLogout}>로그아웃</button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link to={ROUTES.LOGIN} className="btn btn-primary btn-sm">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
