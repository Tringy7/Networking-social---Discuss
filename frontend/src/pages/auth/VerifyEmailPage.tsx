import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import { MailCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import { AuthError, AuthHeading } from '../../components/auth/AuthFormParts';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { pendingEmail, verifyEmail, resendOtp } = useAuthStore();
  const { addToast } = useToastStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const requestInFlight = useRef(false);

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

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ''));
    setError('');
    document.getElementById(`otp-box-${Math.min(digits.length, 5)}`)?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestInFlight.current) return;
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số.');
      return;
    }

    requestInFlight.current = true;
    setError('');
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
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || requestInFlight.current) return;
    requestInFlight.current = true;
    setIsResending(true);
    setError('');
    try {
      if (!pendingEmail) {
        throw new Error('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.');
      }
      await resendOtp(pendingEmail);
      setCooldown(60);
      addToast('Mã OTP mới đã được gửi tới email của bạn.', 'success');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Không thể gửi lại mã OTP.');
    } finally {
      requestInFlight.current = false;
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page">
      <MailCheck className="auth-verification-icon" size={32} aria-hidden="true" />

      <AuthHeading title="Kiểm tra email của bạn">
          Mã xác thực gồm 6 chữ số đã được gửi tới{' '}
          <span className="font-semibold text-[var(--text-primary)]">{pendingEmail || 'email của bạn'}</span>.
      </AuthHeading>

      <AuthError message={error} />

      <form onSubmit={handleVerify} className="auth-fields" aria-busy={isLoading}>
        {/* OTP Input 6 boxes */}
        <div className="auth-otp" role="group" aria-label="Mã xác thực gồm 6 chữ số">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-box-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isLoading || isResending}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              aria-label={`Chữ số OTP thứ ${idx + 1}`}
              autoComplete={idx === 0 ? 'one-time-code' : 'off'}
              aria-invalid={error ? true : undefined}
              className="border border-[var(--border-color)] text-center font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange-ink)]"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={isResending}
          className="auth-submit"
        >
          Xác thực tài khoản
        </Button>
      </form>

      {/* Resend Cooldown */}
      <div className="auth-resend">
        <span>Không nhận được mã?</span>
        {cooldown > 0 ? (
          <span className="text-[var(--text-muted)]">Gửi lại sau {cooldown}s</span>
        ) : (
          <button
            onClick={handleResend}
            type="button"
            disabled={isLoading || isResending}
            aria-busy={isResending}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResending ? 'Đang gửi mã…' : 'Gửi lại mã OTP'}</span>
          </button>
        )}
      </div>

        <Link
          to="/login"
          className="auth-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
    </div>
  );
};

export default VerifyEmailPage;
