import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import Logo from '../common/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { AdminAvatar, AdminRowMenu } from './AdminUI';

export default function AdminHeader({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const addToast = useToastStore(state => state.addToast);
  return <header className="admin-topbar">
    <div className="admin-brand"><button className="admin-button admin-menu-toggle" aria-label="Mở điều hướng" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={onMenu}><Menu size={18} /></button><Logo size="sm" /><span>Quản trị</span></div>
    <div className="admin-top-actions"><ThemeToggle /><Link to="/" className="admin-button admin-back" aria-label="Về cộng đồng"><ArrowLeft size={15} /><span>Về cộng đồng</span></Link>
      <div className="admin-profile-menu"><AdminRowMenu label="tài khoản quản trị"><div className="admin-menu-account"><strong>{user?.displayName || user?.username}</strong><span>@{user?.username}</span></div><Link to="/settings/profile"><Settings size={15} />Hồ sơ và cài đặt</Link><button onClick={() => { logout().catch(() => addToast('Phiên đăng nhập đã kết thúc trên thiết bị này.', 'info')); }}><LogOut size={15} />Đăng xuất</button></AdminRowMenu><span className="admin-profile-face" aria-hidden="true"><AdminAvatar name={user?.displayName || user?.username || 'Admin'} src={user?.avatarUrl} /><ChevronDown size={12} /></span></div>
    </div>
  </header>;
}
