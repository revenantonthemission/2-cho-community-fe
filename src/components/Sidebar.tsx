import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { useDM } from '../hooks/useDM';
import type { Category, CategoriesResponse } from '../types/post';
import type { ApiResponse } from '../types/common';

const PACKAGE_CATEGORIES = [
  { key: 'editor', label: '에디터' },
  { key: 'terminal', label: '터미널' },
  { key: 'devtool', label: '개발 도구' },
  { key: 'system', label: '시스템' },
  { key: 'desktop', label: '데스크톱' },
  { key: 'utility', label: '유틸리티' },
  { key: 'multimedia', label: '멀티미디어' },
  { key: 'security', label: '보안' },
];

export default function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotification();
  const { unreadCount: dmUnreadCount } = useDM();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wikiTags, setWikiTags] = useState<{ id: number; name: string }[]>([]);

  const path = location.pathname;
  const isFeed = path === '/';
  const isWiki = path.startsWith('/wiki');
  const isPackages = path.startsWith('/packages');
  const isAdmin = user?.role === 'admin';

  // 카테고리 로드 (피드 페이지)
  useEffect(() => {
    if (!isFeed) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<CategoriesResponse>>(API_ENDPOINTS.CATEGORIES.ROOT);
        setCategories(res.data?.categories ?? []);
      } catch { /* ignore */ }
    })();
  }, [isFeed]);

  // 위키 인기 태그 로드 (위키 페이지)
  useEffect(() => {
    if (!isWiki) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<{ tags: { id: number; name: string }[] }>>(API_ENDPOINTS.WIKI.TAGS_POPULAR);
        setWikiTags(res.data?.tags ?? []);
      } catch { /* ignore */ }
    })();
  }, [isWiki]);

  const currentCategory = searchParams.get('category_id');
  const currentTag = searchParams.get('tag');
  const currentPkgCategory = searchParams.get('category');

  function handleCategoryClick(categoryId: number | null) {
    const params = new URLSearchParams(searchParams);
    if (categoryId === null) {
      params.delete('category_id');
    } else {
      params.set('category_id', String(categoryId));
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  return (
    <nav className="sidebar" id="app-sidebar">
      {/* navigate */}
      <SidebarSection title="navigate">
        <SidebarLink to={ROUTES.HOME} active={isFeed}>피드</SidebarLink>
        <SidebarLink to={ROUTES.WIKI} active={isWiki}>위키</SidebarLink>
        <SidebarLink to={ROUTES.PACKAGES} active={isPackages}>패키지</SidebarLink>
      </SidebarSection>

      {/* categories — 피드 페이지에서만 */}
      {isFeed && (
        <SidebarSection title="categories">
          <li className="sidebar__item">
            <button
              className={`sidebar__link sidebar__link--category${currentCategory === null ? ' active' : ''}`}
              onClick={() => handleCategoryClick(null)}
            >
              전체
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.category_id} className="sidebar__item">
              <button
                className={`sidebar__link sidebar__link--category${currentCategory === String(cat.category_id) ? ' active' : ''}`}
                onClick={() => handleCategoryClick(cat.category_id)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </SidebarSection>
      )}

      {/* wiki tags — 위키 페이지에서만 */}
      {isWiki && wikiTags.length > 0 && (
        <SidebarSection title="wiki" titleLink={ROUTES.WIKI}>
          {wikiTags.map((tag) => (
            <li key={tag.id} className="sidebar__item">
              <Link
                className={`sidebar__link sidebar__link--category${currentTag === tag.name ? ' active' : ''}`}
                to={`${ROUTES.WIKI}?tag=${encodeURIComponent(tag.name)}`}
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </SidebarSection>
      )}

      {/* packages — 패키지 페이지에서만 */}
      {isPackages && (
        <SidebarSection title="packages" titleLink={ROUTES.PACKAGES}>
          {PACKAGE_CATEGORIES.map(({ key, label }) => (
            <li key={key} className="sidebar__item">
              <Link
                className={`sidebar__link sidebar__link--category${currentPkgCategory === key ? ' active' : ''}`}
                to={`${ROUTES.PACKAGES}?category=${key}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </SidebarSection>
      )}

      {/* social — 로그인 시 */}
      {isAuthenticated && (
        <SidebarSection title="social">
          <SidebarLink to={ROUTES.NOTIFICATIONS} active={path === '/notifications'} badge={unreadCount}>
            알림
          </SidebarLink>
          <SidebarLink to={ROUTES.DM} active={path === '/dm'} badge={dmUnreadCount}>
            메시지
          </SidebarLink>
          <SidebarLink to={ROUTES.MY_ACTIVITY} active={path === '/my-activity'}>
            내 활동
          </SidebarLink>
        </SidebarSection>
      )}

      {/* admin — 관리자만 */}
      {isAdmin && (
        <SidebarSection title="admin">
          <SidebarLink to={ROUTES.ADMIN} active={path === '/admin'}>대시보드</SidebarLink>
          <SidebarLink to={ROUTES.ADMIN_REPORTS} active={path === '/admin/reports'}>신고 관리</SidebarLink>
        </SidebarSection>
      )}
    </nav>
  );
}

// 섹션 컴포넌트 — 터미널 프롬프트 스타일 헤더
function SidebarSection({ title, titleLink, children }: {
  title: string;
  titleLink?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sidebar__section">
      <div className="sidebar__section-header">
        <span className="sidebar__prompt">$</span>
        {titleLink ? (
          <Link to={titleLink} className="sidebar__section-link">{title}</Link>
        ) : (
          <span>{title}</span>
        )}
      </div>
      <ul className="sidebar__list">{children}</ul>
    </div>
  );
}

// 네비게이션 링크 컴포넌트
function SidebarLink({ to, active, badge, children }: {
  to: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <li className="sidebar__item">
      <Link className={`sidebar__link${active ? ' active' : ''}`} to={to}>
        <span className="sidebar__item-label">{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="sidebar__badge">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
}
