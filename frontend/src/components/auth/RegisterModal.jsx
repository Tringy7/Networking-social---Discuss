import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Loader2 } from 'lucide-react';

export default function RegisterModal({ isOpen, onClose, onOpenLogin, onOpenVerifyEmail }) {
  const { register, loginSocial } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);
    try {
      const res = await register(formData);
      onClose();
      if (onOpenVerifyEmail) {
        onOpenVerifyEmail(res.data.email);
      }
    } catch (err) {
      setErrorInfo({
        code: err.code || 'AUTH_ERR',
        status: err.status || 400,
        message: err.message || 'Đăng ký không thành công',
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
    <Modal isOpen={isOpen} onClose={onClose} title="Đăng ký tài khoản Discuss" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorInfo && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>Lỗi đăng ký</span>
              {errorInfo.code && (
                <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                  {errorInfo.code} ({errorInfo.status})
                </span>
              )}
            </div>
            <p>{errorInfo.message}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tên tài khoản (Username) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ví dụ: john_doe"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Địa chỉ Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Xác nhận mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Đăng ký tài khoản</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">hoặc</span>
          <div className="border-t border-slate-200 w-full" />
        </div>

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
          <span>Đăng ký nhanh bằng Google</span>
        </button>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </form>
    </Modal>
  );
}
