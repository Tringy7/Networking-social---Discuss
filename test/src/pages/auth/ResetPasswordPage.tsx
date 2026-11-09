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
      <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/15 border border-[#FF5700]/30 flex items-center justify-center text-[#FF5700]">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Đặt lại mật khẩu mới</h2>
        <p className="text-xs sm:text-sm text-[#9A9DA3]">
          Vui lòng tạo mật khẩu mạnh để bảo vệ tài khoản DISCUSS của bạn.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
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
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#70747C] hover:text-[#F5F5F5] transition-colors cursor-pointer"
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
            <div className="flex gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-all ${
                    strength >= level
                      ? strength <= 1
                        ? 'bg-[#EF4444]'
                        : strength <= 2
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#22C55E]'
                      : 'bg-[#222426]'
                  }`}
                />
              ))}
            </div>
            <div className="text-[10px] text-[#70747C]">
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
          className="w-full text-sm font-bold shadow-lg shadow-[#FF5700]/25 mt-2"
        >
          Lưu mật khẩu mới
        </Button>
      </form>

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

export default ResetPasswordPage;
