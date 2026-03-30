import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const tabs = [
  { path: ROUTES.HOME, label: '피드', icon: '📋' },
  { path: ROUTES.POST_WRITE, label: '글쓰기', icon: '✏️' },
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
          <span className="bottom-tab__icon">{tab.icon}</span>
          <span className="bottom-tab__label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
