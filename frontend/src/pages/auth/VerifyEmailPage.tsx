import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import { MailCheck, RotateCcw, ArrowLeft } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { pendingEmail, verifyEmail, resendOtp } = useAuthStore();
  const { addToast } = useToastStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số.');
      return;
    }

    setIsLoading(true);
    try {
      if (!pendingEmail) {
        throw new Error('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.');
      }
      await verifyEmail(pendingEmail, code);
      addToast('Xác thực email thành công! Bạn có thể đăng nhập ngay.', 'success');
      navigate('/login', { replace: true });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Xác thực email thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      if (!pendingEmail) {
        throw new Error('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.');
      }
      await resendOtp(pendingEmail);
      setCooldown(60);
      addToast('Mã OTP mới đã được gửi tới email của bạn.', 'success');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Không thể gửi lại mã OTP.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="w-11 h-11 rounded-full bg-[var(--color-orange-soft)] flex items-center justify-center text-[var(--color-orange-ink)]">
        <MailCheck className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Xác thực email</h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Mã xác thực gồm 6 chữ số đã được gửi tới{' '}
          <span className="font-semibold text-[var(--text-primary)]">{pendingEmail || 'email của bạn'}</span>.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-sm text-[var(--color-danger)] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        {/* OTP Input 6 boxes */}
        <div className="flex justify-between gap-2" aria-label="Mã xác thực gồm 6 chữ số">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-box-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              aria-label={`Chữ số OTP thứ ${idx + 1}`}
              autoComplete={idx === 0 ? 'one-time-code' : 'off'}
              className="h-12 w-11 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-center text-lg font-code font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-12"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-semibold"
        >
          Xác thực tài khoản
        </Button>
      </form>

      {/* Resend Cooldown */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-secondary)] pt-2">
        <span>Không nhận được mã?</span>
        {cooldown > 0 ? (
          <span className="text-[var(--text-muted)]">Gửi lại sau {cooldown}s</span>
        ) : (
          <button
            onClick={handleResend}
            className="flex items-center gap-1.5 text-[var(--color-orange-ink)] hover:underline font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gửi lại mã OTP</span>
          </button>
        )}
      </div>

      <div className="pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
