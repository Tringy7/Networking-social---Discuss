import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';
import { NavLink, Outlet } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';
import { User, Lock, Palette, Bell, KeyRound, SlidersHorizontal } from 'lucide-react';

export const SettingsLayout: React.FC = () => {
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const tabs = [
    { to: '/settings', label: 'Tổng quan cài đặt', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { to: '/settings/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-4 h-4" /> },
    { to: '/settings/account', label: 'Tài khoản & Bảo mật', icon: <KeyRound className="w-4 h-4" /> },
    { to: '/settings/privacy', label: 'Quyền riêng tư', icon: <Lock className="w-4 h-4" /> },
    { to: '/settings/appearance', label: 'Giao diện & Trải nghiệm', icon: <Palette className="w-4 h-4 text-[var(--color-orange)]" /> },
    { to: '/settings/notifications', label: 'Thông báo', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="settings-page text-left">
      <header className="utility-heading">
        <h1 className="editorial-title text-[var(--text-primary)]">Cài đặt</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">
          Quản lý thông tin hồ sơ, tùy chỉnh giao diện, quyền riêng tư và thông báo của bạn.
        </p>
      </header>

      <div className="settings-workspace">
        {/* Settings Sub-Sidebar */}
        <nav aria-label="Các mục cài đặt" className="settings-navigation">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/settings'}
              className={({ isActive }) =>
                `settings-tab flex shrink-0 items-center gap-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'is-selected'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`
              }
            >
              {({ isActive }) => <><span className="shrink-0">{tab.icon}</span><span>{tab.label}</span>{isActive && <motion.span className="tab-indicator" layoutId="settings-tab" transition={reduced || intensity !== 'full' ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 35 }} />}</>}
            </NavLink>
          ))}
        </nav>

        {/* Settings Content Area */}
        <div className="settings-content">
          <PageTransition><Outlet /></PageTransition>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
