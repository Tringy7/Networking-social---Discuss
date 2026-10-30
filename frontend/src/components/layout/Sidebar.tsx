import React from 'react';
import { NavLink, Link, useLocation, matchPath } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import Avatar from '../ui/Avatar';
import { Home, Compass, TrendingUp, Bookmark, Bell, MessageSquare, Users, Settings, ShieldAlert, ShieldCheck, Plus, LogIn, UserRound, PanelLeftClose, PanelLeftOpen, ArrowUpRight } from 'lucide-react';

export default function Sidebar() {
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const { settings, toggleSidebar } = useSettingsStore();
  const communities = useCommunityStore((state) => state.communities);
  const location = useLocation();
  const reduced = useReducedMotion();
  const collapsed = settings.sidebarCollapsed;
  const quiet = reduced || settings.animationIntensity !== 'full';
  const joined = communities.filter((c) => ['OWNER', 'MODERATOR', 'MEMBER'].includes(c.currentUserRole));
  const managed = joined.find((c) => ['OWNER', 'MODERATOR'].includes(c.currentUserRole));
  const moderationActive = managed ? ['/community/:name/moderation', '/c/:name/moderation'].some((path) => {
    const match = matchPath({ path, end: true }, location.pathname);
    return match?.params.name === managed.name;
  }) : false;
  const popular = location.pathname === '/' && new URLSearchParams(location.search).get('tab') === 'popular';
  const link = (to: string, label: string, Icon: React.ElementType, active?: boolean, end = false) => (
    <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined} aria-label={label}
      className={({ isActive }) => `side-link ${(active ?? isActive) ? 'is-active' : ''}`}>
      <Icon className="side-icon" aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
  return (
    <motion.aside aria-label="Điều hướng chính" className={`editorial-sidebar ${collapsed ? 'is-collapsed' : ''}`}
      initial={false} animate={{ width: collapsed ? 72 : 248 }}
      transition={quiet ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 36 }}>
      <div className="sidebar-top">
        {!collapsed && <span className="sidebar-caption">Không gian của bạn</span>}
        <button type="button" onClick={toggleSidebar} className="icon-button" aria-expanded={!collapsed}
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <div className="sidebar-scroll">
        <nav className="side-group">
          {link('/', 'Trang chủ', Home, location.pathname === '/' && !popular, true)}
          {link('/?tab=popular', 'Phổ biến', TrendingUp, popular, true)}
          {link('/explore', 'Khám phá cộng đồng', Compass)}
        </nav>
        {isAuthenticated && user ? <>
          <nav className="side-group">
            {!collapsed && <p className="sidebar-caption">Thư viện cá nhân</p>}
            {link('/saved', 'Bài viết đã lưu', Bookmark)}
            {link(`/user/${user.username}`, 'Hồ sơ của bạn', UserRound)}
            {link('/notifications', 'Thông báo', Bell)}
            {link('/messages', 'Tin nhắn', MessageSquare)}
          </nav>
          <nav className="side-group">
            {!collapsed && <div className="side-group-title"><span className="sidebar-caption">Cộng đồng của bạn</span><Link to="/communities/create" className="icon-button" aria-label="Tạo cộng đồng"><Plus size={16} /></Link></div>}
            {joined.slice(0, 5).map((c) => <NavLink key={c.id} to={`/community/${c.name}`} end title={c.displayName} aria-label={c.displayName} className={({ isActive }) => `side-link community-link ${isActive ? 'is-active' : ''}`}>
              <Avatar src={c.avatarUrl} alt={c.displayName} size="xs" shape="rounded" />{!collapsed && <span className="truncate">{c.displayName}</span>}
            </NavLink>)}
            {link('/communities/mine', 'Tất cả cộng đồng', Users)}
            {collapsed && link('/communities/create', 'Tạo cộng đồng', Plus)}
          </nav>
          {(managed || activeRole === 'ADMIN') && <nav className="side-group">
            {!collapsed && <p className="sidebar-caption">Quản lý</p>}
            {managed && link(`/community/${managed.name}/moderation`, 'Kiểm duyệt', ShieldAlert, moderationActive, true)}
            {activeRole === 'ADMIN' && link('/admin', 'Trung tâm quản trị', ShieldCheck)}
          </nav>}
        </> : !collapsed ? <div className="sidebar-invitation">
          <p className="sidebar-invitation-title">Có cộng đồng dành cho bạn</p><p>Gặp những người cùng sở thích và chia sẻ câu chuyện của bạn.</p>
          <Link to="/register">Tham gia DISCUSS <ArrowUpRight size={16} /></Link>
        </div> : link('/login', 'Đăng nhập', LogIn)}
        {link('/settings', 'Cài đặt', Settings)}
      </div>
      <div className="sidebar-bottom">
        {!collapsed && <span className="sidebar-signoff">DISCUSS · Cùng nhau kết nối.</span>}
      </div>
    </motion.aside>
  );
}
