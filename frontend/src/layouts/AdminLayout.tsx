import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AdminDataProvider } from '../components/admin/AdminDataContext';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import './admin.css';

function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <div className={`admin-workspace ${collapsed ? 'is-collapsed' : ''}`}>
    <a href="#main-content" className="admin-skip-link">Đến nội dung chính</a>
    <AdminHeader menuOpen={menuOpen} onMenu={() => setMenuOpen(value => !value)} />
    <div className="admin-frame">
      {menuOpen && <button className="admin-nav-backdrop" aria-label="Đóng điều hướng" onClick={() => setMenuOpen(false)} />}
      <AdminSidebar open={menuOpen} collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} onNavigate={() => setMenuOpen(false)} />
      <main id="main-content" className="admin-sheet" tabIndex={-1}><Outlet /></main>
    </div>
  </div>;
}
export default function AdminLayout() {
  const { activeRole, isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (activeRole !== 'ADMIN') return <main className="admin-workspace"><div className="admin-empty"><h1>Không có quyền quản trị</h1><p>Tài khoản của bạn không có quyền truy cập khu vực này.</p><Link className="admin-button" to="/">Về trang người dùng</Link></div></main>;
  return <AdminDataProvider><AdminShell /></AdminDataProvider>;
}
