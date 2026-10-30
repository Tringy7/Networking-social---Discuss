import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { BookOpen, MessageCircle, Users } from 'lucide-react';

const communityPillars = [
  { icon: Users, label: 'Cộng đồng theo mối quan tâm' },
  { icon: BookOpen, label: 'Bài viết và kiến thức được chia sẻ' },
  { icon: MessageCircle, label: 'Thảo luận cùng thành viên' },
];

export const AuthLayout: React.FC = () => (
  <div className="min-h-[100svh] bg-[var(--bg-main)] text-[var(--text-primary)] antialiased lg:grid lg:grid-cols-[minmax(320px,0.9fr)_1.1fr]">
    <aside className="relative hidden min-h-[100svh] flex-col justify-between bg-[var(--bg-sidebar)] px-10 py-9 lg:flex xl:px-14">
      <Link to="/" aria-label="DISCUSS — trang chủ" className="w-fit">
        <Logo size="lg" />
      </Link>

      <div className="my-auto max-w-lg py-16">
        <p className="mb-4 text-sm font-semibold text-[var(--color-orange-ink)]">DISCUSS · Mạng xã hội cộng đồng</p>
        <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] xl:text-[2.5rem]">
          Chia sẻ tri thức.
        </p>
        <p className="mt-5 max-w-md text-base leading-7 text-[var(--text-secondary)]">
          Tham gia những cộng đồng theo chủ đề, đăng bài và tiếp tục cuộc trò chuyện với mọi người.
        </p>

        <ul className="mt-10 space-y-4">
          {communityPillars.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Icon className="h-4 w-4 shrink-0 text-[var(--color-orange-ink)]" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-[var(--text-muted)]">Kết nối đam mê. Chia sẻ tri thức.</p>
    </aside>

    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-7 sm:px-10 lg:px-12">
      <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
        <Link to="/" aria-label="DISCUSS — trang chủ"><Logo size="md" /></Link>
        <Link to="/" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          Trang chủ
        </Link>
      </div>

      <div className="my-auto w-full max-w-[420px]">
        <Outlet />
      </div>

      <footer className="mt-8 max-w-md text-center text-xs leading-5 text-[var(--text-muted)]">
        Bằng cách tiếp tục, bạn đồng ý với{' '}
        <Link to="/terms" className="font-medium text-[var(--text-secondary)] underline underline-offset-2 transition-colors hover:text-[var(--color-orange-ink)]">
          Điều khoản dịch vụ
        </Link>{' '}
        và{' '}
        <Link to="/settings/privacy" className="font-medium text-[var(--text-secondary)] underline underline-offset-2 transition-colors hover:text-[var(--color-orange-ink)]">
          Chính sách quyền riêng tư
        </Link>{' '}
        của DISCUSS.
      </footer>
    </main>
  </div>
);

export default AuthLayout;
