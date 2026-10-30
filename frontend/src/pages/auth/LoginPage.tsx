import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getApiFieldErrors } from '../../utils/apiFieldErrors';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginSocial } = useAuthStore();
  const { addToast } = useToastStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setError('Vui lòng nhập email hoặc tên đăng nhập');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(emailOrUsername, password);
      addToast('Chào mừng bạn quay trở lại DISCUSS!', 'success');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setFieldErrors(getApiFieldErrors(err));
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async (credential: string) => {
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await loginSocial('google', credential);
      addToast('Đăng nhập với Google thành công!', 'success');
      navigate('/', { replace: true });
    } catch (error: unknown) {
      setFieldErrors(getApiFieldErrors(error));
      setError(error instanceof Error ? error.message : 'Đăng nhập Google không thành công.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, loginSocial, navigate]);

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          Đăng nhập DISCUSS
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Đăng nhập để tiếp tục tham gia cộng đồng thảo luận.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-sm text-[var(--color-danger)] font-medium">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên đăng nhập"
          type="text"
          value={emailOrUsername}
          onChange={(e) => {
            setEmailOrUsername(e.target.value);
            setError('');
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.username;
              delete next.emailOrUsername;
              return next;
            });
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="Nhập tên đăng nhập"
          error={fieldErrors.username || fieldErrors.emailOrUsername}
          required
        />

        <div className="space-y-1.5">
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.password;
                return next;
              });
            }}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            placeholder="••••••••••••"
            error={fieldErrors.password}
            required
          />
        </div>

        <div className="flex justify-end text-xs pt-1">
          <Link to="/forgot-password" className="text-[var(--color-orange-ink)] hover:underline font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-semibold"
        >
          Đăng nhập vào DISCUSS
        </Button>
      </form>

      {/* Divider */}
      <p className="py-1 text-center text-xs font-medium text-[var(--text-muted)]">Hoặc tiếp tục với</p>

      <GoogleSignInButton disabled={isLoading} onCredential={handleGoogleSignIn} />

      {/* Link to Register */}
      <div className="text-center text-sm text-[var(--text-secondary)] pt-2">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[var(--color-orange-ink)] hover:underline font-semibold">
          Đăng ký miễn phí ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
