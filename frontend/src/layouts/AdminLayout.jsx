import { useEffect, useRef, useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AdminDataProvider } from '../components/admin/AdminDataContext.jsx';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import AdminContent from '../components/admin/AdminContent.jsx';
import './admin.css';
function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButtonRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const sidebar = document.getElementById('admin-navigation');
    const firstLink = sidebar?.querySelector('nav a');
    const frame = requestAnimationFrame(() => firstLink?.focus());
    const close = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', close);
    };
  }, [menuOpen]);
  return <div className={`admin-workspace ${collapsed ? 'is-collapsed' : ''}`}>
    <a href="#main-content" className="admin-skip-link">Đến nội dung chính</a>
    <AdminHeader menuOpen={menuOpen} menuButtonRef={menuButtonRef} onMenu={() => setMenuOpen(value => !value)} />
    <div className="admin-frame">
      {menuOpen && <button type="button" className="admin-nav-backdrop" aria-label="Đóng điều hướng" onClick={() => {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }} />}
      <AdminSidebar open={menuOpen} collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} onNavigate={() => setMenuOpen(false)} />
      <main id="main-content" className="admin-sheet" tabIndex={-1}><AdminContent /></main>
    </div>
  </div>;
}
export default function AdminLayout() {
  const {
    activeRole,
    isAuthenticated
  } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{
    from: location
  }} replace />;
  if (activeRole !== 'ADMIN') return <main className="admin-workspace"><div className="admin-empty"><h1>Không có quyền quản trị</h1><p>Tài khoản của bạn không có quyền truy cập khu vực này.</p><Link className="admin-button" to="/">Về trang người dùng</Link></div></main>;
  return <AdminDataProvider><AdminShell /></AdminDataProvider>;
}
