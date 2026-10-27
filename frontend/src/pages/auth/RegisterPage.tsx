import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { addToast } = useToastStore();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await register({
        username: username.toLowerCase().trim(),
        email: email.trim(),
        password,
        confirmPassword,
        displayName: displayName.trim() || username.trim(),
      });
      addToast('Đăng ký tài khoản thành công! Mã OTP đã được gửi.', 'success');
      navigate('/verify-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng ký không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
          Tạo tài khoản DISCUSS
        </h2>
        <p className="text-xs sm:text-sm text-[#9A9DA3]">
          Khám phá và kết nối cùng cộng đồng công nghệ lớn nhất.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Tên đăng nhập (username)"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="huutri_dev"
          required
        />

        <Input
          label="Tên hiển thị (Display Name)"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Hữu Trí"
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="huutria22005@gmail.com"
          required
        />

        <Input
          label="Mật khẩu"
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

        <Input
          label="Xác nhận mật khẩu"
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

        {/* Terms agreement checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                setError('');
              }}
              className="mt-0.5 rounded accent-[var(--color-orange)]"
            />
            <span className="leading-snug">
              Tôi đồng ý với{' '}
              <Link to="/terms" className="font-semibold text-[var(--color-orange)] hover:underline">
                Điều khoản sử dụng
              </Link>{' '}
              và Quy chuẩn ứng xử cộng đồng.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-bold shadow-lg shadow-[#FF5700]/25 mt-2"
        >
          Hoàn tất đăng ký
        </Button>
      </form>

      {/* Link to Login */}
      <div className="text-center text-xs text-[#9A9DA3] pt-2 border-t border-[#303235]">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[#FF5700] hover:underline font-bold">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
