import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, FileText, MessageSquare, Tags, ShieldAlert, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminData } from './AdminDataContext';
import { AdminAvatar, adminNumber } from './AdminUI';

const groups = [
  { label: 'Tổng quan', items: [{ to: '/admin', label: 'Tổng quan hệ thống', icon: LayoutDashboard }] },
  { label: 'Quản lý', items: [
    { to: '/admin/users', label: 'Người dùng', icon: Users },
    { to: '/admin/communities', label: 'Cộng đồng', icon: FolderKanban },
    { to: '/admin/posts', label: 'Bài viết', icon: FileText },
    { to: '/admin/comments', label: 'Bình luận', icon: MessageSquare },
    { to: '/admin/categories', label: 'Danh mục', icon: Tags },
  ] },
  { label: 'Kiểm duyệt', items: [{ to: '/admin/reports', label: 'Báo cáo', icon: ShieldAlert }] },
];
export default function AdminSidebar({ open, collapsed, onCollapse, onNavigate }: { open: boolean; collapsed: boolean; onCollapse: () => void; onNavigate: () => void }) {
  const user = useAuthStore(state => state.user);
  const { reports } = useAdminData();
  return <aside className={`admin-navigation ${open ? 'is-open' : ''}`} id="admin-navigation">
    <div><div className="admin-sidebar-scope"><span>Không gian quản trị</span><button className="admin-sidebar-collapse" aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} aria-expanded={!collapsed} onClick={onCollapse}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
    <nav aria-label="Điều hướng quản trị">{groups.map(group => <div className="admin-nav-group" key={group.label}><p className="admin-nav-label">{group.label}</p>{group.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} title={collapsed ? label : undefined} aria-label={label} onClick={onNavigate} className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{to === '/admin/reports' && !reports.loading && !reports.error && !!reports.data?.pending && <span className="admin-nav-count" aria-label={`${reports.data.pending} báo cáo chờ xử lý`}>{adminNumber(reports.data.pending)}</span>}</NavLink>)}</div>)}</nav></div>
    <div className="admin-account"><AdminAvatar name={user?.displayName || user?.username || 'Admin'} src={user?.avatarUrl} /><div><strong>{user?.displayName || user?.username}</strong><span>Quản trị viên hệ thống</span></div></div>
  </aside>;
}
