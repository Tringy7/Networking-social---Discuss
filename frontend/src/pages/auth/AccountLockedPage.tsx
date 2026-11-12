import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Mail, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthHeading } from '../../components/auth/AuthFormParts';

const APPEAL_EMAIL = 'discussforcommunity@gmail.com';

interface AccountLockedLocationState {
  accountIdentifier?: string;
}

export default function AccountLockedPage() {
  const location = useLocation();
  const routeState = location.state as AccountLockedLocationState | null;
  const [accountIdentifier, setAccountIdentifier] = useState(routeState?.accountIdentifier || '');
  const [contactEmail, setContactEmail] = useState('');
  const [appealDetails, setAppealDetails] = useState('');

  const sendAppeal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = 'Khiếu nại về việc tài khoản DISCUSS bị khóa';
    const body = [
      'Kính gửi đội ngũ DISCUSS,',
      '',
      'Tôi muốn gửi khiếu nại về việc tài khoản của mình bị khóa.',
      `Tên đăng nhập hoặc email tài khoản: ${accountIdentifier.trim() || '(chưa cung cấp)'}`,
      `Email liên hệ: ${contactEmail.trim()}`,
      '',
      'Nội dung khiếu nại:',
      appealDetails.trim(),
    ].join('\n');

    window.location.href = `mailto:${APPEAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="auth-page">
      <AuthHeading title="Tài khoản của bạn đang bị khóa">
        Bạn không thể đăng nhập vào tài khoản này. Nếu cho rằng đây là nhầm lẫn, hãy gửi khiếu nại để đội ngũ DISCUSS xem xét.
      </AuthHeading>

      <div className="auth-error" role="alert">
        <LockKeyhole size={18} aria-hidden="true" />
        <p>Tài khoản đang bị khóa. Bạn có thể liên hệ đội ngũ hỗ trợ qua biểu mẫu bên dưới.</p>
      </div>

      <form className="auth-fields" onSubmit={sendAppeal}>
        <Input
          label="Tên đăng nhập hoặc email tài khoản bị khóa"
          autoComplete="username"
          value={accountIdentifier}
          onChange={(event) => setAccountIdentifier(event.target.value)}
          placeholder="Nhập tên đăng nhập hoặc email"
        />

        <Input
          label="Email để đội ngũ phản hồi"
          type="email"
          autoComplete="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <div className="w-full space-y-1.5 text-left">
          <label htmlFor="appeal-details" className="block text-sm font-semibold text-[var(--text-primary)]">
            Nội dung khiếu nại
          </label>
          <textarea
            id="appeal-details"
            value={appealDetails}
            onChange={(event) => setAppealDetails(event.target.value)}
            placeholder="Mô tả vấn đề và lý do bạn cho rằng tài khoản cần được xem xét mở khóa..."
            minLength={20}
            maxLength={3000}
            rows={5}
            required
            className="w-full resize-y rounded-[var(--radius-control)] border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus:border-[var(--color-orange-ink)]"
          />
          <p className="text-xs leading-5 text-[var(--text-secondary)]">Tối thiểu 20 ký tự. Nội dung sẽ được mở trong ứng dụng email để bạn kiểm tra và gửi.</p>
        </div>

        <Button type="submit" variant="primary" size="lg" className="auth-submit" leftIcon={<Send size={17} aria-hidden="true" />}>
          Soạn email khiếu nại
        </Button>
      </form>

      <p className="flex flex-wrap items-center justify-center gap-1 text-center text-sm text-[var(--text-secondary)]">
        <Mail size={16} aria-hidden="true" />
        Hoặc liên hệ trực tiếp:{' '}
        <a className="font-semibold text-[var(--color-orange-ink)] hover:underline" href={`mailto:${APPEAL_EMAIL}`}>
          {APPEAL_EMAIL}
        </a>
      </p>

      <Link to="/login" className="auth-back justify-center">
        <ArrowLeft size={17} aria-hidden="true" />
        Quay lại đăng nhập
      </Link>
    </div>
  );
}
