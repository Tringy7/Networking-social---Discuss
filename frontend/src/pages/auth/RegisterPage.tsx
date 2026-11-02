import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { getApiFieldErrors } from '../../utils/apiFieldErrors';
import { AuthError, AuthHeading, AuthSwitch } from '../../components/auth/AuthFormParts';

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
  const requestInFlight = useRef(false);

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
    if (requestInFlight.current) return;
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = 'Vui lòng nhập tên đăng nhập.';
    else if (username.length < 3) errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự.';
    const emailInput = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
    if (!email.trim()) errors.email = 'Vui lòng nhập địa chỉ email.';
    else if (emailInput.validity.typeMismatch) errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
    if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 8) errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    if (!confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    if (!agreeTerms) errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng để tiếp tục.';
    setError('');
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      (e.currentTarget.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement)?.focus();
      return;
    }

    requestInFlight.current = true;
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
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page auth-register">
      <AuthHeading title={<>Bắt đầu câu chuyện<br />của bạn</>}>Tạo tài khoản để khám phá và tham gia cộng đồng.</AuthHeading>
      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="auth-fields" noValidate aria-busy={isLoading}>
        <Input
          label="Tên đăng nhập"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            updateRegistrationDraft({ username: e.target.value });
            setError('');
            clearFieldError('username');
          }}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="Chọn tên đăng nhập của bạn"
          error={fieldErrors.username}
          required
        />

        <Input
          label="Tên hiển thị (không bắt buộc)"
          name="displayName"
          autoComplete="nickname"
          disabled={isLoading}
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            updateRegistrationDraft({ displayName: e.target.value });
            clearFieldError('displayName');
          }}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="Mọi người sẽ gọi bạn là…"
          error={fieldErrors.displayName}
        />

        <Input
          label="Địa chỉ email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            updateRegistrationDraft({ email: e.target.value });
            setError('');
            clearFieldError('email');
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="Nhập email của bạn"
          error={fieldErrors.email}
          required
        />

        <Input
          label="Mật khẩu"
          name="password"
          autoComplete="new-password"
          disabled={isLoading}
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
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              className="auth-password-toggle"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          placeholder="Tạo mật khẩu"
          helperText="Sử dụng ít nhất 8 ký tự cho mật khẩu."
          error={fieldErrors.password}
          required
        />

        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          autoComplete="new-password"
          disabled={isLoading}
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

        <div>
          <label className="auth-terms">
            <input
              type="checkbox"
              name="agreeTerms"
              disabled={isLoading}
              aria-invalid={fieldErrors.agreeTerms ? true : undefined}
              aria-describedby={fieldErrors.agreeTerms ? 'auth-terms-error' : undefined}
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                updateRegistrationDraft({ agreeTerms: e.target.checked });
                setError('');
                clearFieldError('agreeTerms');
              }}
            />
            <span>
              Tôi đồng ý với{' '}
              <Link to="/terms">
                Điều khoản sử dụng
              </Link>{' '}
              và Quy chuẩn ứng xử cộng đồng.
            </span>
          </label>
          {fieldErrors.agreeTerms && <p id="auth-terms-error" className="auth-terms-error">{fieldErrors.agreeTerms}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="auth-submit"
        >
          Tạo tài khoản
        </Button>
      </form>

      <AuthSwitch prompt="Đã có tài khoản?" to="/login">Đăng nhập</AuthSwitch>
    </div>
  );
};

export default RegisterPage;
