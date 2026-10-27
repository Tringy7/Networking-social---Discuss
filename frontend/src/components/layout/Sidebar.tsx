import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import {
  Home,
  Compass,
  TrendingUp,
  Bookmark,
  Users,
  Settings,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  LogIn,
  User as UserIcon,
  Menu,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const { settings, toggleSidebar } = useSettingsStore();
  const { communities } = useCommunityStore();
  const location = useLocation();

  const isCollapsed = settings.sidebarCollapsed;
  const isHomeFeed =
    location.pathname === '/' && new URLSearchParams(location.search).get('tab') !== 'popular';
  const isTrendingFeed =
    location.pathname === '/' && new URLSearchParams(location.search).get('tab') === 'popular';

  const joinedCommunities = communities.filter(
    (c) => c.currentUserRole === 'OWNER' || c.currentUserRole === 'MODERATOR' || c.currentUserRole === 'MEMBER'
  );

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors duration-150 select-none ${
      isActive
        ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange)] border-[var(--color-orange-border)] font-bold'
        : 'border-transparent text-[#959DAA] hover:text-[#F1F3F7] hover:bg-[#1A1E29]'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;

  return (
    <aside
      className={`sticky top-[72px] relative h-[calc(100vh-72px)] bg-[#0F1217] flex flex-col transition-all duration-300 z-30 shrink-0 border-r border-[#262C3A] ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core feeds */}
        <div className="space-y-1">
          <NavLink
            to="/"
            end
            className={() => navItemClass({ isActive: isHomeFeed })}
            title="Trang chủ"
          >
            <Home className="w-4 h-4 shrink-0 text-[var(--color-orange)]" />
            {!isCollapsed && <span>Trang chủ</span>}
          </NavLink>

          <NavLink to="/explore" className={navItemClass} title="Khám phá cộng đồng">
            <Compass className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Khám phá cộng đồng</span>}
          </NavLink>

          <NavLink
            to="/?tab=popular"
            end
            className={() => navItemClass({ isActive: isTrendingFeed })}
            title="Phổ biến & Xu hướng"
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Thảo luận xu hướng</span>}
          </NavLink>
        </div>

        {/* User Sections */}
        {isAuthenticated && user ? (
          <>
            <div className="space-y-1 pt-2 border-t border-[#303235]">
              {!isCollapsed && (
                <div className="text-[11px] font-bold text-[#70747C] uppercase px-3 mb-2 tracking-wider">
                  Cá nhân
                </div>
              )}

              <NavLink to="/saved" className={navItemClass} title="Đã lưu">
                <Bookmark className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Bài viết đã lưu</span>}
              </NavLink>

              <NavLink to={`/u/${user.username}`} className={navItemClass} title="Trang cá nhân">
                <UserIcon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Trang cá nhân</span>}
              </NavLink>

              <NavLink to="/communities/mine" className={navItemClass} title="Cộng đồng của tôi">
                <Users className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Cộng đồng của tôi</span>}
              </NavLink>
            </div>

            {/* My Communities list */}
            <div className="space-y-1 pt-2 border-t border-[#303235]">
              <div className={`flex items-center justify-between px-3 mb-1.5 ${isCollapsed ? 'hidden' : ''}`}>
                <span className="text-[11px] font-bold text-[#70747C] uppercase tracking-wider">
                  Đã tham gia ({joinedCommunities.length})
                </span>
                <Link
                  to="/communities/create"
                  className="text-[#70747C] hover:text-[#FF5700] transition-colors p-1"
                  title="Tạo cộng đồng mới"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-0.5">
                {joinedCommunities.map((c) => (
                  <NavLink
                    key={c.id}
                    to={`/c/${c.name}`}
                    className={navItemClass}
                    title={c.displayName}
                  >
                    <Avatar src={c.avatarUrl} alt={c.displayName} size="xs" shape="rounded" />
                    {!isCollapsed && (
                      <span className="truncate text-xs">{c.displayName}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Moderation & Admin */}
            {(activeRole === 'OWNER' || activeRole === 'MODERATOR' || activeRole === 'ADMIN') && (
              <div className="space-y-1 pt-2 border-t border-[#303235]">
                {!isCollapsed && (
                  <div className="text-[11px] font-bold text-[#70747C] uppercase px-3 mb-2 tracking-wider">
                    Công cụ quản trị
                  </div>
                )}

                <NavLink
                  to="/c/lap-trinh-viet-nam/moderation"
                  className={navItemClass}
                  title="Kiểm duyệt cộng đồng"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#3B82F6]" />
                  {!isCollapsed && <span>Kiểm duyệt bài viết</span>}
                </NavLink>

                {activeRole === 'ADMIN' && (
                  <NavLink to="/admin" end className={navItemClass} title="Bảng điều khiển Admin">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#EF4444]" />
                    {!isCollapsed && <span>Admin Dashboard</span>}
                  </NavLink>
                )}
              </div>
            )}
          </>
        ) : (
          /* Guest Banner */
          <div className="pt-2 border-t border-[#303235]">
            {!isCollapsed ? (
              <div className="p-3 bg-[#191A1C] border border-[#303235] rounded-2xl space-y-2.5 text-left">
                <p className="text-xs text-[#9A9DA3]">
                  Đăng nhập để tham gia thảo luận, lưu bài viết và quản lý cộng đồng.
                </p>
                <Link to="/login" className="block w-full">
                  <Button variant="primary" size="sm" className="w-full">
                    Đăng nhập ngay
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/login" className={navItemClass({ isActive: false })} title="Đăng nhập">
                <LogIn className="w-4 h-4 text-[#FF5700]" />
              </Link>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="space-y-1 pt-2 border-t border-[#262C3A]">
          <NavLink to="/settings" className={navItemClass} title="Cài đặt">
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Cài đặt hệ thống</span>}
          </NavLink>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute right-0 top-[30%] z-50 flex h-10 w-10 translate-x-1/2 items-center justify-center rounded-full border border-[#59616E] bg-[#0F1217] text-[#D8DEE8] shadow-lg transition-colors hover:border-[var(--color-orange)] hover:text-[var(--color-orange)]"
        title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
      >
        <Menu className="h-5 w-5" />
      </button>
    </aside>
  );
};

export default Sidebar;
