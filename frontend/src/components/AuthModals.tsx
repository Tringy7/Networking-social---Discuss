import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, LogIn, UserPlus, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AuthModals: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginAs,
    register,
    forgotPassword,
    users,
  } = useApp();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const user = users.find(
      (u) => u.username.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (!user) {
      setMessage({ text: 'Tên đăng nhập không chính xác hoặc không tồn tại.', isError: true });
      return;
    }

    if (user.isLocked) {
      setMessage({
        text: 'Tài khoản này đã bị Quản trị viên (Admin) khóa do vi phạm chính sách cộng đồng.',
        isError: true,
      });
      return;
    }

    loginAs(user.id);
    setIsAuthModalOpen(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = register(regUsername, regDisplayName, regEmail);
    if (!res.success) {
      setMessage({ text: res.message, isError: true });
    } else {
      alert(res.message);
      setIsAuthModalOpen(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = forgotPassword(forgotEmail);
    if (!res.success) {
      setMessage({ text: res.message, isError: true });
    } else {
      setMessage({ text: res.message, isError: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            {authModalMode === 'login' && <LogIn className="w-5 h-5 text-orange-600" />}
            {authModalMode === 'register' && <UserPlus className="w-5 h-5 text-orange-600" />}
            {authModalMode === 'forgot' && <KeyRound className="w-5 h-5 text-orange-600" />}
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {authModalMode === 'login' && 'Đăng nhập'}
              {authModalMode === 'register' && 'Đăng ký tài khoản'}
              {authModalMode === 'forgot' && 'Quên mật khẩu'}
            </h2>
          </div>

          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setMessage(null);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
              message.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authModalMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập:</label>
              <input
                id="login-username-input"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin, user_a, user_b..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Mật khẩu:</label>
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setAuthModalMode('forgot');
                  }}
                  className="text-xs text-orange-600 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                id="login-password-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Đăng nhập
            </button>

            {/* Quick Login Accounts */}
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
              <span className="block font-medium mb-1 text-slate-400">Đăng nhập nhanh với tài khoản:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('user_a');
                    setLoginPassword('123456');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                >
                  user_a
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('user_b');
                    setLoginPassword('123456');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                >
                  user_b
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('admin');
                    setLoginPassword('admin123');
                  }}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-mono font-bold"
                >
                  admin
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-slate-500 text-xs">Chưa có tài khoản? </span>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setAuthModalMode('register');
                }}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {authModalMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username):</label>
              <input
                id="reg-username-input"
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="ví dụ: nguyenvana"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị:</label>
              <input
                id="reg-displayname-input"
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="ví dụ: Nguyễn Văn A"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email:</label>
              <input
                id="reg-email-input"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu:</label>
              <input
                id="reg-password-input"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Hoàn tất Đăng ký
            </button>

            <div className="text-center pt-2">
              <span className="text-slate-500 text-xs">Đã có tài khoản? </span>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setAuthModalMode('login');
                }}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {authModalMode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-3.5 text-xs sm:text-sm">
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhập email đã đăng ký của bạn. Hệ thống sẽ xác thực và gửi hướng dẫn đặt lại mật khẩu cho bạn.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email tài khoản:</label>
              <input
                id="forgot-email-input"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="user_a@student.ctu.edu.vn"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition cursor-pointer"
            >
              Đặt lại mật khẩu
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setAuthModalMode('login');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
