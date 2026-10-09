import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, MailCheck } from 'lucide-react';

export default function LoginModal({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenForgotPassword,
  onOpenVerifyEmail,
  prefilledUsername = '',
}) {
  const { login, loginSocial } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (prefilledUsername) {
      setFormData((prev) => ({ ...prev, username: prefilledUsername }));
    }
  }, [prefilledUsername, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      onClose();
    } catch (err) {
      setErrorInfo({
        code: err.code || 'AUTH_020',
        status: err.status || 401,
        message: err.message || 'Invalid username or password',
        email: err.email,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorInfo(null);
    setSocialLoading(true);

    try {
      await loginSocial('google', 'mock_google_oauth_token_' + Date.now());
      onClose();
    } catch (err) {
      setErrorInfo({
        code: err.code || 'AUTH_040',
        status: err.status || 400,
        message: err.message || 'Đăng nhập Google thất bại',
      });
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đăng nhập tài khoản Discuss" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorInfo && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-2">
            <div className="font-bold flex items-center justify-between">
              <span>Đăng nhập thất bại</span>
              {errorInfo.code && (
                <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                  {errorInfo.code} ({errorInfo.status})
                </span>
              )}
            </div>
            <p>{errorInfo.message}</p>

            {/* If error is AUTH_021 (Pending email verification), provide 1-click CTA */}
            {errorInfo.code === 'AUTH_021' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenVerifyEmail) {
                    onOpenVerifyEmail(errorInfo.email || formData.username, '482915');
                  }
                }}
                className="mt-1 w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MailCheck className="w-3.5 h-3.5" />
                <span>Nhập mã OTP xác thực email ngay</span>
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên đăng nhập (Username)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ví dụ: john_doe"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenForgotPassword();
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Đăng nhập</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">hoặc</span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Google Social Login Button (POST /auth/social/google) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={socialLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
        >
          {socialLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Đăng nhập với Google</span>
        </button>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </form>
    </Modal>
  );
}
