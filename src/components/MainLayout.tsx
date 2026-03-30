import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomTab from './BottomTab';

export default function MainLayout() {
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
