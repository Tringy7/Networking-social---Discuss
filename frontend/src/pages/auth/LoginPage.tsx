import React, { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginSocial } = useAuthStore();
  const { addToast } = useToastStore();
  const redirectTo = (location.state as {
    from?: { pathname: string; search: string; hash: string };
  } | null)?.from;

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    setIsLoading(true);
    try {
      await login(emailOrUsername, password);
      addToast('Chào mừng bạn quay trở lại DISCUSS!', 'success');
      navigate(redirectTo || '/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async (credential: string) => {
    setError('');
    setIsLoading(true);
    try {
      await loginSocial('google', credential);
      addToast('Đăng nhập với Google thành công!', 'success');
      navigate(redirectTo || '/', { replace: true });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đăng nhập Google không thành công.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, loginSocial, navigate]);

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
          Chào mừng trở lại!
        </h2>
        <p className="text-xs sm:text-sm text-[#9A9DA3]">
          Đăng nhập để tiếp tục tham gia cộng đồng thảo luận.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email hoặc Tên đăng nhập"
          type="text"
          value={emailOrUsername}
          onChange={(e) => {
            setEmailOrUsername(e.target.value);
            setError('');
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="huutria22005@gmail.com"
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
            placeholder="••••••••••••"
            required
          />
        </div>

        <div className="flex justify-end text-xs pt-1">
          <Link to="/forgot-password" className="text-[#FF5700] hover:underline font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full text-sm font-bold shadow-lg shadow-[#FF5700]/25"
        >
          Đăng nhập vào DISCUSS
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-color)]" />
        </div>
        <span className="relative bg-[var(--bg-main)] px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Hoặc tiếp tục với
        </span>
      </div>

      <GoogleSignInButton disabled={isLoading} onCredential={handleGoogleSignIn} />

      {/* Link to Register */}
      <div className="text-center text-xs text-[#9A9DA3] pt-2">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[#FF5700] hover:underline font-bold">
          Đăng ký miễn phí ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
