import React, { useCallback, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { ApiError } from '../../services/apiClient';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton.tsx';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { getApiFieldErrors } from '../../utils/apiFieldErrors';
import { AuthDivider, AuthError, AuthHeading, AuthSwitch } from '../../components/auth/AuthFormParts';

export const LoginPage: React.FC<{ admin?: boolean }> = ({ admin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const role = useAuthStore(state => state.activeRole);
  const { login, loginSocial } = useAuthStore();
  const { addToast } = useToastStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requestInFlight = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestInFlight.current) return;
    const errors: Record<string, string> = {};
    if (!emailOrUsername.trim()) errors.username = 'Vui lòng nhập tên đăng nhập.';
    if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
    setFieldErrors(errors);
    setError('');
    if (Object.keys(errors).length) {
      (e.currentTarget.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement)?.focus();
      return;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    try {
      await login(emailOrUsername, password);
      if (admin && useAuthStore.getState().activeRole !== 'ADMIN') {
        await useAuthStore.getState().logout().catch(() => undefined);
        setError('Tài khoản này không có quyền truy cập khu vực quản trị.');
        return;
      }
      addToast(admin ? 'Đăng nhập quản trị thành công!' : 'Chào mừng bạn quay trở lại DISCUSS!', 'success');
      const from = location.state?.from;
      const destination = from?.pathname?.startsWith('/admin/') && from.pathname !== '/admin/login'
        ? `${from.pathname}${from.search || ''}` : '/admin';
      navigate(useAuthStore.getState().activeRole === 'ADMIN' ? destination : '/', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_LOCKED') {
        navigate('/account-locked', { state: { accountIdentifier: emailOrUsername.trim() } });
        return;
      }
      setFieldErrors(getApiFieldErrors(err));
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async (credential: string) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await loginSocial('google', credential);
      addToast('Đăng nhập với Google thành công!', 'success');
      navigate(useAuthStore.getState().activeRole === 'ADMIN' ? '/admin' : '/', { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'ACCOUNT_LOCKED') {
        navigate('/account-locked', { replace: true });
        return;
      }
      setFieldErrors(getApiFieldErrors(error));
      setError(error instanceof Error ? error.message : 'Đăng nhập Google không thành công.');
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  }, [addToast, loginSocial, navigate]);

  if (authenticated && (!admin || role === 'ADMIN')) return <Navigate to={role === 'ADMIN' ? '/admin' : '/'} replace />;

  return (
    <div className="auth-page">
      <AuthHeading title={admin ? 'Đăng nhập quản trị' : 'Chào mừng trở lại'}>{admin ? 'Dành cho tài khoản có quyền quản trị hệ thống Discuss.' : 'Đăng nhập để tiếp tục câu chuyện của bạn.'}</AuthHeading>
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
          leftIcon={<User className="w-4 h-4" aria-hidden="true" />}
          placeholder="Nhập tên đăng nhập"
          error={fieldErrors.username || fieldErrors.emailOrUsername}
          required
        />

          <Input
            label="Mật khẩu"
            name="password"
            autoComplete="current-password"
            disabled={isLoading}
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
                aria-pressed={showPassword}
                className="auth-password-toggle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            placeholder="Nhập mật khẩu"
            error={fieldErrors.password}
            required
          />
        <div className="auth-forgot">
          <Link to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="auth-submit"
        >
          Đăng nhập
        </Button>
      </form>

      {!admin && <><AuthDivider />
      <GoogleSignInButton disabled={isLoading} onCredential={handleGoogleSignIn} />
      <AuthSwitch prompt="Chưa có tài khoản?" to="/register">Đăng ký</AuthSwitch></>}
      {admin && <AuthSwitch prompt="Dành cho thành viên" to="/login">Đăng nhập người dùng</AuthSwitch>}
    </div>
  );
};

export default LoginPage;
