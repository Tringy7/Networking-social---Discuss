import React from 'react';
import { NavLink, Outlet, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Logo from '../components/common/Logo';
import Avatar from '../components/ui/Avatar';
import DevRoleSwitcher from '../components/common/DevRoleSwitcher';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderKanban,
  ArrowLeft,
  Shield,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, activeRole } = useAuthStore();

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

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
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

      <DevRoleSwitcher />
    </div>
  );
};

export default AdminLayout;
