import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Logo from '../components/common/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import PageTransition from '../components/layout/PageTransition';
import CommunityIllustration from '../components/auth/CommunityIllustration';
import { useSettingsStore } from '../store/useSettingsStore';
import '../auth.css';

export default function AuthLayout() {
  const admin = useLocation().pathname.startsWith('/admin');
  const reducedMotion = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reducedMotion || intensity !== 'full';

  return (
    <div className="auth-layout">
      <a className="skip-link" href="#main-content">Đến biểu mẫu</a>
      <header className="auth-header">
        <Logo />
        <nav className="auth-nav" aria-label="Điều hướng xác thực">
          <ThemeToggle />
          <Link to="/" className="auth-home">Trang chủ <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </nav>
      </header>

      <div className="auth-body">
        <motion.aside
          className="auth-editorial"
          aria-label={admin ? 'Khu vực quản trị DISCUSS' : 'Kết nối cùng cộng đồng DISCUSS'}
          initial={quiet ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <p className="auth-quote">{admin ? <>Discuss.<br /><span>Quản trị hệ thống.</span></> : <>Cùng sở thích.<br /><span>Cùng kết nối.</span></>}</p>
          <p className="auth-intro">{admin ? 'Quản lý người dùng, cộng đồng và nội dung tại một không gian riêng.' : <>Một góc dành cho điều bạn yêu thích.<br className="auth-desktop-break" /> Chia sẻ góc nhìn, tìm thấy những người đồng điệu.</>}</p>
          <CommunityIllustration />
          {!admin && <Link to="/explore" className="auth-explore">
            Khám phá cộng đồng <ArrowUpRight size={17} aria-hidden="true" />
          </Link>}
        </motion.aside>

        <main className="auth-main" id="main-content" tabIndex={-1}>
          <div className="auth-form">
            <PageTransition><Outlet /></PageTransition>
            <p className="auth-legal">
              Cùng xây dựng một cộng đồng tôn trọng và cởi mở.{' '}
              <Link to="/terms">Điều khoản sử dụng DISCUSS</Link>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
