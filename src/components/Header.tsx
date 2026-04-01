import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [activeMenuIndex, setActiveMenuIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

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

  // 드롭다운 열릴 때 첫 항목에 포커스
  useEffect(() => {
    if (dropdownOpen) {
      setActiveMenuIndex(0);
    } else {
      setActiveMenuIndex(-1);
    }
  }, [dropdownOpen]);

  // activeMenuIndex 변경 시 해당 요소에 포커스
  useEffect(() => {
    if (activeMenuIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
      // menuitem 내부의 링크 또는 버튼에 포커스
      const target = items[activeMenuIndex]?.querySelector<HTMLElement>('a, button') ?? items[activeMenuIndex];
      target?.focus();
    }
  }, [activeMenuIndex]);

  const MENU_ITEM_COUNT = 2; // 회원정보수정, 로그아웃

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveMenuIndex((prev) => (prev + 1) % MENU_ITEM_COUNT);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveMenuIndex((prev) => (prev - 1 + MENU_ITEM_COUNT) % MENU_ITEM_COUNT);
          break;
        case 'Enter': {
          e.preventDefault();
          if (activeMenuIndex >= 0 && menuRef.current) {
            const items = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
            const target = items[activeMenuIndex]?.querySelector<HTMLElement>('a, button');
            target?.click();
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          setDropdownOpen(false);
          break;
      }
    },
    [activeMenuIndex],
  );

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
                  <ul role="menu" ref={menuRef} onKeyDown={handleMenuKeyDown}>
                    <li role="menuitem" tabIndex={activeMenuIndex === 0 ? 0 : -1}>
                      <Link to={ROUTES.PROFILE} onClick={() => setDropdownOpen(false)}>
                        회원정보수정
                      </Link>
                    </li>
                    <li role="menuitem" tabIndex={activeMenuIndex === 1 ? 0 : -1}>
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
