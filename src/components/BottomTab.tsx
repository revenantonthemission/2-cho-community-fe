import { Link, useLocation } from 'react-router-dom';
import { LayoutList, PenSquare } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import type { ReactNode } from 'react';

const tabs: { path: string; label: string; icon: ReactNode }[] = [
  { path: ROUTES.HOME, label: '피드', icon: <LayoutList size={20} /> },
  { path: ROUTES.POST_WRITE, label: '글쓰기', icon: <PenSquare size={20} /> },
];

export default function BottomTab() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`bottom-tab ${pathname === tab.path ? 'active' : ''}`}
        >
          <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
          <span className="bottom-tab__label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
