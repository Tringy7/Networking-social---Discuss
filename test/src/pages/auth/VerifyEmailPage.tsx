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
      addToast('Xác thực email thành công! Chào mừng bạn gia nhập DISCUSS.', 'success');
      navigate('/');
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
      <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/15 border border-[#FF5700]/30 flex items-center justify-center text-[#FF5700]">
        <MailCheck className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Xác thực địa chỉ Email</h2>
        <p className="text-xs sm:text-sm text-[#9A9DA3]">
          Mã xác thực gồm 6 chữ số đã được gửi tới{' '}
          <span className="text-[#F5F5F5] font-semibold">{pendingEmail || 'email của bạn'}</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        {/* OTP Input 6 boxes */}
        <div className="flex justify-between gap-2">
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
              className="w-11 sm:w-13 h-13 text-center text-lg font-mono font-bold bg-[#191A1C] border border-[#303235] focus:border-[#FF5700] rounded-xl text-[#F5F5F5] outline-none transition-all"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-bold shadow-lg shadow-[#FF5700]/25"
        >
          Xác thực tài khoản
        </Button>
      </form>

      {/* Resend Cooldown */}
      <div className="flex items-center justify-between text-xs text-[#9A9DA3] pt-2">
        <span>Không nhận được mã?</span>
        {cooldown > 0 ? (
          <span className="text-[#70747C]">Gửi lại sau {cooldown}s</span>
        ) : (
          <button
            onClick={handleResend}
            className="flex items-center gap-1.5 text-[#FF5700] hover:underline font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gửi lại mã OTP</span>
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-[#303235]">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
