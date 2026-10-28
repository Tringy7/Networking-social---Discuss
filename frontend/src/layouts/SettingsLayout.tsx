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
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F3F7]">Cài đặt hệ thống</h1>
        <p className="text-xs text-[#959DAA] mt-1">
          Quản lý thông tin hồ sơ, tùy chỉnh giao diện, quyền riêng tư và thông báo của bạn.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sub-Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/settings'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange)] border border-[var(--color-orange-border)] font-bold'
                    : 'text-[#959DAA] hover:text-[#F1F3F7] hover:bg-[#1E232F]'
                }`
              }
            >
              <span className="shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0 bg-[#161922] border border-[#262C3A] rounded-2xl p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
