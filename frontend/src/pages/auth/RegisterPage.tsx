import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { getApiFieldErrors } from '../../utils/apiFieldErrors';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    registrationDraft,
    updateRegistrationDraft,
    clearRegistrationDraft,
  } = useAuthStore();
  const { addToast } = useToastStore();

  const [username, setUsername] = useState(registrationDraft.username);
  const [displayName, setDisplayName] = useState(registrationDraft.displayName);
  const [email, setEmail] = useState(registrationDraft.email);
  const [password, setPassword] = useState(registrationDraft.password);
  const [confirmPassword, setConfirmPassword] = useState(registrationDraft.confirmPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(registrationDraft.agreeTerms);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

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
      setError('');
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.');
      return;
    }

    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await register({
        username: username.toLowerCase().trim(),
        email: email.trim(),
        password,
        confirmPassword,
        displayName: displayName.trim() || username.trim(),
      });
      clearRegistrationDraft();
      addToast('Đăng ký tài khoản thành công! Mã OTP đã được gửi.', 'success');
      navigate('/verify-email');
    } catch (err: unknown) {
      setFieldErrors(getApiFieldErrors(err));
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
            updateRegistrationDraft({ username: e.target.value });
            setError('');
            clearFieldError('username');
          }}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="dev_user123"
          error={fieldErrors.username}
          required
        />

        <Input
          label="Tên hiển thị (Display Name)"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            updateRegistrationDraft({ displayName: e.target.value });
            clearFieldError('displayName');
          }}
          placeholder="Người dùng mẫu"
          error={fieldErrors.displayName}
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            updateRegistrationDraft({ email: e.target.value });
            setError('');
            clearFieldError('email');
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="user@example.com"
          error={fieldErrors.email}
          required
        />

        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            updateRegistrationDraft({ password: e.target.value });
            setError('');
            clearFieldError('password');
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
          error={fieldErrors.password}
          required
        />

        <Input
          label="Xác nhận mật khẩu"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            updateRegistrationDraft({ confirmPassword: e.target.value });
            setError('');
            clearFieldError('confirmPassword');
          }}
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="Nhập lại mật khẩu"
          error={fieldErrors.confirmPassword}
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
                updateRegistrationDraft({ agreeTerms: e.target.checked });
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
