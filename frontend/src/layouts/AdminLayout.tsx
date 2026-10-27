import React from 'react';
import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Logo from '../components/common/Logo';
import Avatar from '../components/ui/Avatar';
import { useToastStore } from '../store/useToastStore';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderKanban,
  ArrowLeft,
  Shield,
  Loader2,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, activeRole, isAuthenticated, authLoading, authStatus, authError, hydrate } =
    useAuthStore();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);

  if (!isAuthenticated && (authLoading || authStatus === 'initializing')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-orange)]" />
        <p className="text-sm text-[var(--text-secondary)]">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated && authStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          {authError || 'Không thể xác minh phiên đăng nhập. Vui lòng thử lại.'}
        </p>
        <button
          type="button"
          className="rounded-lg bg-[var(--color-orange)] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            void hydrate().catch((error: unknown) =>
              addToast(
                error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.',
                'error'
              )
            );
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

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
    { to: '/admin/reports', end: false, label: 'Báo cáo vi phạm', icon: <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col antialiased transition-colors duration-200">
      {/* Top Admin Header */}
      <header className="h-16 bg-[var(--bg-nav)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Center</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#959DAA] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chính</span>
          </Link>
          {user && <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />}
        </div>
      </header>

      <div className="flex-1 flex max-w-screen-2xl w-full mx-auto">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] p-4 shrink-0 hidden md:block text-left space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-[#70747C] uppercase px-3 mb-2 tracking-wider">
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
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold'
                      : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#191A1C]'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="p-3 bg-[#191A1C] border border-[#303235] rounded-xl text-[11px] text-[#70747C] space-y-1">
            <div className="font-semibold text-[#F5F5F5]">Spring Boot REST API</div>
            <div>Connected via Spring Security 6 & JWT Session token.</div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
