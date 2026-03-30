import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomTab from './BottomTab';

export default function MainLayout() {
  // Sidebar가 있는 레이아웃에서 body 클래스 설정 (CSS가 header 너비 조정에 사용)
  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar');
  }, []);

  return (
    <>
      <Header />
      <main className="main-container">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <BottomTab />
    </>
  );
}
