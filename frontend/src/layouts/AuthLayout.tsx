import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import PageTransition from '../components/layout/PageTransition';
import { ArrowUpRight, MessageSquare } from 'lucide-react';

export default function AuthLayout() {
  return <div className="auth-layout">
    <aside className="auth-editorial">
      <Logo size="lg" />
      <div className="auth-manifesto">
        <p className="auth-quote">Một câu hỏi.<br />Nhiều góc nhìn.</p>
        <p className="auth-intro">Có những điều chỉ sáng tỏ khi ta cùng trò chuyện. Tìm cộng đồng của bạn, chia sẻ điều bạn biết và khám phá điều mới.</p>
        <Link to="/explore" className="auth-explore">Khám phá các cộng đồng <ArrowUpRight size={17} /></Link>
      </div>
      <div className="auth-conversation" aria-hidden="true"><MessageSquare size={19} /><span>Lắng nghe. Chia sẻ. Kết nối.</span></div>
      <div className="auth-colophon"><span>DISCUSS Community Network</span><span>Kết nối qua từng góc nhìn.</span></div>
    </aside>
    <main className="auth-main" id="main-content">
      <div className="auth-top"><div className="lg:hidden"><Logo /></div><Link to="/">Trang chủ <ArrowUpRight size={15} /></Link></div>
      <div className="auth-form"><PageTransition><Outlet /></PageTransition></div>
      <footer className="auth-legal">Bằng cách tiếp tục, bạn đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và <Link to="/settings/privacy">Chính sách quyền riêng tư</Link> của DISCUSS.</footer>
    </main>
  </div>;
}
