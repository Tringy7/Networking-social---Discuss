import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

type RecoveryStep = 'email' | 'verify' | 'complete';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { forgotPassword, verifyForgotPasswordOtp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<RecoveryStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updatedCode = [...code];
    updatedCode[index] = value.slice(-1);
    setCode(updatedCode);
    setError('');

    if (value && index < 5) {
      document.getElementById(`forgot-otp-box-${index + 1}`)?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`forgot-otp-box-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedCode) return;

    event.preventDefault();
    setCode(Array.from({ length: 6 }, (_, index) => pastedCode[index] || ''));
    setError('');
    document.getElementById(`forgot-otp-box-${Math.min(pastedCode.length, 5)}`)?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (step === 'email') {
        await forgotPassword(email);
        setStep('verify');
        addToast('Mã xác thực đã được gửi tới email của bạn.', 'success');
      } else if (step === 'verify') {
        const otp = code.join('');
        if (!/^\d{6}$/.test(otp)) {
          throw new Error('Vui lòng nhập mã OTP 6 chữ số.');
        }
        await verifyForgotPasswordOtp(email, otp);
        setStep('complete');
        addToast('Email đã được xác thực. Bạn có thể đặt lại mật khẩu.', 'success');
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xử lý yêu cầu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/15 border border-[#FF5700]/30 flex items-center justify-center text-[#FF5700]">
        <KeyRound className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Quên mật khẩu?</h2>
        <p className="text-xs sm:text-sm text-[#9A9DA3]">
          {step === 'email'
            ? 'Nhập email đăng ký để nhận mã xác thực khôi phục mật khẩu.'
            : step === 'verify'
              ? `Nhập mã OTP đã gửi tới ${email}.`
              : 'Email đã được xác thực. Tiếp tục để tạo mật khẩu mới.'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      {step === 'complete' ? (
        <div className="p-4 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#22C55E]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã xác thực email</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => navigate('/reset-password')}
          >
            Tiến hành đặt lại mật khẩu
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'email' ? (
            <Input
              label="Địa chỉ Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="name@example.com"
              required
            />
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#9A9DA3]">
                Mã xác thực OTP
              </label>
              <div className="flex justify-between gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    id={`forgot-otp-box-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={code[index]}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleDigitKeyDown(index, event)}
                    onPaste={handleCodePaste}
                    aria-label={`Chữ số OTP thứ ${index + 1}`}
                    className="w-11 sm:w-13 h-13 text-center text-lg font-mono font-bold bg-[#191A1C] border border-[#303235] focus:border-[#FF5700] rounded-xl text-[#F5F5F5] outline-none transition-all"
                    required
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full text-sm font-bold shadow-lg shadow-[#FF5700]/25"
          >
            {step === 'email' ? 'Gửi mã xác thực' : 'Xác thực email'}
          </Button>
        </form>
      )}

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

export default ForgotPasswordPage;
