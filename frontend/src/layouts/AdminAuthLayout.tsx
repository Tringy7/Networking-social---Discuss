import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import './admin.css';

export default function AdminAuthLayout() {
  return <div className="admin-workspace admin-auth-workspace">
    <header className="admin-topbar"><div className="admin-brand"><Logo size="sm" /><span>Không gian quản trị</span></div><div className="admin-top-actions"><ThemeToggle /><Link to="/login" className="admin-button">Đăng nhập người dùng</Link></div></header>
    <main className="admin-auth-frame"><section className="admin-auth-intro"><span className="admin-auth-eyebrow">DISCUSS · ADMIN</span><h1>Quản trị hệ thống<br /><span>trong một không gian riêng.</span></h1><p>Đăng nhập bằng tài khoản quản trị để quản lý người dùng, cộng đồng và nội dung.</p></section><section className="admin-auth-card"><Outlet /></section></main>
  </div>;
}
