import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Lock, Palette, Bell, KeyRound, SlidersHorizontal } from 'lucide-react';

export const SettingsLayout: React.FC = () => {
  const tabs = [
    { to: '/settings', label: 'Tổng quan cài đặt', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { to: '/settings/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-4 h-4" /> },
    { to: '/settings/account', label: 'Tài khoản & Bảo mật', icon: <KeyRound className="w-4 h-4" /> },
    { to: '/settings/privacy', label: 'Quyền riêng tư', icon: <Lock className="w-4 h-4" /> },
    { to: '/settings/appearance', label: 'Giao diện & Trải nghiệm', icon: <Palette className="w-4 h-4 text-[var(--color-orange)]" /> },
    { to: '/settings/notifications', label: 'Thông báo', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-7 text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Cài đặt</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">
          Quản lý thông tin hồ sơ, tùy chỉnh giao diện, quyền riêng tư và thông báo của bạn.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Settings Sub-Sidebar */}
        <nav aria-label="Các mục cài đặt" className="flex w-full shrink-0 gap-1 overflow-x-auto pb-1 md:block md:w-60 md:space-y-1 md:overflow-visible md:pb-0">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/settings'}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full ${
                  isActive
                    ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`
              }
            >
              <span className="shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Settings Content Area */}
        <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
