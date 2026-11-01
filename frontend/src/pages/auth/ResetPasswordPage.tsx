import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const resetPasswordRequest = useAuthStore((state) => state.resetPassword);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordRequest(password, confirmPassword);
      addToast('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', 'success');
      navigate('/login');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="w-11 h-11 rounded-full bg-[var(--color-orange-soft)] flex items-center justify-center text-[var(--color-orange-ink)]">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Đặt lại mật khẩu</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Vui lòng tạo mật khẩu mạnh để bảo vệ tài khoản DISCUSS của bạn.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-sm text-[var(--color-danger)] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="Tối thiểu 8 ký tự"
          required
        />

        {/* Strength Indicator */}
        {password && (
          <div className="space-y-1.5">
            <div className="flex h-1.5 gap-1.5" role="meter" aria-label="Độ mạnh mật khẩu" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength}>
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-colors duration-[var(--duration-fast)] ${
                    strength >= level
                      ? strength <= 1
                        ? 'bg-[#EF4444]'
                        : strength <= 2
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#22C55E]'
                      : 'bg-[var(--bg-elevated)]'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {strength <= 1 ? 'Mật khẩu yếu' : strength <= 2 ? 'Mật khẩu trung bình' : 'Mật khẩu mạnh an toàn'}
            </div>
          </div>
        )}

        <Input
          label="Xác nhận mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }}
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="Nhập lại mật khẩu"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-semibold mt-2"
        >
          Lưu mật khẩu mới
        </Button>
      </form>

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

export default ResetPasswordPage;
