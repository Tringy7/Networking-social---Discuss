import ThemeToggle from '../components/ui/ThemeToggle';
import React from 'react';
import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import PageTransition from '../components/layout/PageTransition';
import Logo from '../components/common/Logo';
import Avatar from '../components/ui/Avatar';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderKanban,
  ArrowLeft,
  Shield,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, activeRole, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not admin, redirect to /403
  if (activeRole !== 'ADMIN') {
    return <Navigate to="/403" replace />;
  }

  const navLinks = [
    { to: '/admin', end: true, label: 'Tổng quan hệ thống', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/users', end: false, label: 'Quản lý người dùng', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/communities', end: false, label: 'Quản lý cộng đồng', icon: <FolderKanban className="w-4 h-4" /> },
    { to: '/admin/reports', end: false, label: 'Báo cáo vi phạm', icon: <ShieldAlert className="w-4 h-4 text-[var(--color-danger)]" /> },
  ];

  return (
    <div className="admin-app min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col antialiased transition-colors duration-200">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--bg-nav)] px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Logo size="sm" compactOnMobile />
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-danger)]">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quản trị</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link
            to="/"
            className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label="Quay lại trang chính"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quay lại trang chính</span>
          </Link>
          {user && <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />}
        </div>
      </header>

      <div className="flex-1 flex w-full mx-auto">
        {/* Admin Sidebar */}
        <aside aria-label="Điều hướng quản trị" className="admin-sidebar hidden w-52 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-left md:block">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[var(--text-muted)] px-3 mb-2 tracking-normal">
              Trung tâm kiểm soát
            </div>
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <p className="sidebar-caption px-3 pt-6">DISCUSS · Quản trị cộng đồng</p>

        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <nav aria-label="Điều hướng quản trị" className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 py-2 md:hidden">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <main id="main-content" className="admin-canvas min-w-0 p-4 sm:p-6">
            <PageTransition><Outlet /></PageTransition>
          </main>
        </div>
      </div>

    </div>
  );
};

export default AdminLayout;
