import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  MailCheck,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Plus,
  User,
} from 'lucide-react';

const GoogleIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
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
);

export const AuthModals = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    pendingEmailForVerification,
    setPendingEmailForVerification,
    pendingResetToken,
    registerWithApi,
    verifyEmailWithApi,
    loginWithApi,
    loginWithGoogle,
    googleDemoAccounts,
    forgotPasswordWithApi,
    resetPasswordWithApi,
  } = useApp();

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Google Sign-In Chooser state
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Status feedback
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when pending values change
  useEffect(() => {
    if (pendingEmailForVerification) {
      setVerifyEmail(pendingEmailForVerification);
    }
  }, [pendingEmailForVerification]);

  useEffect(() => {
    if (pendingResetToken) {
      setResetToken(pendingResetToken);
    }
  }, [pendingResetToken]);

  if (!isAuthModalOpen) return null;

  const clearAlert = () => setAlert(null);

  // Google Sign-In Handler
  const handleGoogleSignIn = async (account) => {
    clearAlert();
    setIsLoadingGoogle(true);
    const res = await loginWithGoogle({
      email: account.email,
      displayName: account.displayName || account.email.split('@')[0],
      avatar: account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });
    setIsLoadingGoogle(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
    } else {
      setIsGoogleChooserOpen(false);
      setShowCustomGoogleInput(false);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập địa chỉ email Google' });
      return;
    }
    handleGoogleSignIn({
      email: customGoogleEmail.trim(),
      displayName: customGoogleName.trim() || customGoogleEmail.split('@')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
  };

  // 1. Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    clearAlert();
    setIsLoading(true);

    const res = await loginWithApi({
      username: loginUsername.trim(),
      password: loginPassword,
    });

    setIsLoading(false);
    if (!res.success) {
      if (res.needsVerification) {
        setAlert({
          type: 'error',
          message: 'Tài khoản chưa được kích hoạt. Vui lòng xác thực email của bạn.',
        });
        if (res.email) {
          setVerifyEmail(res.email);
          setPendingEmailForVerification(res.email);
        }
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } else {
      setIsAuthModalOpen(false);
      setLoginPassword('');
    }
  };

  // 2. Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    clearAlert();

    if (regPassword !== regConfirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsLoading(true);
    const res = await registerWithApi({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });

    setIsLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
    } else {
      setAlert({
        type: 'success',
        message: 'Đăng ký thành công! Vui lòng nhập mã xác thực vừa gửi đến email của bạn.',
      });
      setVerifyEmail(regEmail.trim());
      setPendingEmailForVerification(regEmail.trim());
      setTimeout(() => {
        setAuthModalMode('verify-email');
        clearAlert();
      }, 1200);
    }
  };

  // 3. Verify Email Handler
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearAlert();
    setIsLoading(true);

    const res = await verifyEmailWithApi({
      email: verifyEmail.trim(),
      code: verifyCode.trim(),
    });

    setIsLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
    } else {
      setAlert({
        type: 'success',
        message: 'Xác thực email thành công! Tài khoản đã được kích hoạt. Hãy đăng nhập ngay.',
      });
      setLoginUsername(regUsername || verifyEmail);
      setTimeout(() => {
        setAuthModalMode('login');
        clearAlert();
      }, 1500);
    }
  };

  // 4. Forgot Password Handler
  const handleForgot = async (e) => {
    e.preventDefault();
    clearAlert();
    setIsLoading(true);

    const res = await forgotPasswordWithApi({
      email: forgotEmail.trim(),
    });

    setIsLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
    } else {
      setAlert({
        type: 'success',
        message: 'Đã gửi hướng dẫn và mã đặt lại mật khẩu đến hòm thư của bạn.',
      });
      setTimeout(() => {
        setAuthModalMode('reset-password');
        clearAlert();
      }, 1500);
    }
  };

  // 5. Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearAlert();

    if (resetNewPassword !== resetConfirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }

    setIsLoading(true);
    const res = await resetPasswordWithApi({
      token: resetToken.trim(),
      newPassword: resetNewPassword,
    });

    setIsLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message });
    } else {
      setAlert({
        type: 'success',
        message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
      });
      setTimeout(() => {
        setAuthModalMode('login');
        clearAlert();
      }, 1500);
    }
  };

  const isMainTab = authModalMode === 'login' || authModalMode === 'register';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        {isGoogleChooserOpen ? (
          <div>
            {/* Google Chooser Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearAlert();
                    setIsGoogleChooserOpen(false);
                    setShowCustomGoogleInput(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Quay lại"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Đăng nhập bằng Google
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tiếp tục tới mạng xã hội Discuss
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsGoogleChooserOpen(false);
                  setIsAuthModalOpen(false);
                  clearAlert();
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert inside Google Chooser */}
            {alert && (
              <div className="p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{alert.message}</span>
              </div>
            )}

            {showCustomGoogleInput ? (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5 text-xs sm:text-sm">
                <p className="text-xs text-slate-600">
                  Nhập địa chỉ email tài khoản Google của bạn để liên kết và đăng nhập nhanh:
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Google:
                  </label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden text-slate-900"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên hiển thị (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Tên của bạn"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isLoadingGoogle}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isLoadingGoogle && <RotateCw className="w-4 h-4 animate-spin" />}
                    <span>Xác nhận</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 mb-3">
                  Chọn tài khoản Google để đăng nhập vào Discuss:
                </p>

                <div className="space-y-2">
                  {googleDemoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isLoadingGoogle}
                      onClick={() => handleGoogleSignIn(account)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition text-left cursor-pointer group disabled:opacity-60"
                    >
                      <img
                        src={account.avatar}
                        alt={account.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600">
                            {account.displayName}
                          </p>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{account.email}</p>
                        {account.description && (
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            {account.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 transition text-left cursor-pointer text-slate-700 text-xs font-semibold"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Sử dụng tài khoản khác</p>
                      <p className="text-[11px] text-slate-400 font-normal">Đăng nhập bằng một email Google khác</p>
                    </div>
                  </button>
                </div>

                {isLoadingGoogle && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-600 font-medium">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối tài khoản Google...</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 text-center pt-3 leading-relaxed border-t border-slate-100 mt-3">
                  Để tiếp tục, Google sẽ cấp quyền cho Discuss truy cập tên và ảnh đại diện công khai của bạn.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                {!isMainTab && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAlert();
                      setAuthModalMode('login');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition mr-1 cursor-pointer"
                    title="Quay lại đăng nhập"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  {authModalMode === 'login' && <LogIn className="w-4 h-4" />}
                  {authModalMode === 'register' && <UserPlus className="w-4 h-4" />}
                  {authModalMode === 'verify-email' && <MailCheck className="w-4 h-4 text-emerald-600" />}
                  {authModalMode === 'forgot' && <KeyRound className="w-4 h-4" />}
                  {authModalMode === 'reset-password' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {authModalMode === 'login' && 'Đăng nhập'}
                    {authModalMode === 'register' && 'Đăng ký tài khoản'}
                    {authModalMode === 'verify-email' && 'Xác thực tài khoản'}
                    {authModalMode === 'forgot' && 'Quên mật khẩu'}
                    {authModalMode === 'reset-password' && 'Đặt lại mật khẩu'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {authModalMode === 'login' && 'Chào mừng bạn quay lại với Discuss'}
                    {authModalMode === 'register' && 'Tham gia thảo luận cùng cộng đồng'}
                    {authModalMode === 'verify-email' && 'Nhập mã để kích hoạt tài khoản'}
                    {authModalMode === 'forgot' && 'Khôi phục quyền truy cập tài khoản'}
                    {authModalMode === 'reset-password' && 'Thiết lập mật khẩu mới an toàn'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  clearAlert();
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standard Switch Tab (Only on Login / Register) */}
            {isMainTab && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    clearAlert();
                    setAuthModalMode('login');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                    authModalMode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAlert();
                    setAuthModalMode('register');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                    authModalMode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* Alert Notification Banner */}
            {alert && (
              <div
                className={`p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2.5 ${
                  alert.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {alert.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                )}
                <span className="leading-relaxed">{alert.message}</span>
              </div>
            )}

            {/* 1. LOGIN VIEW */}
            {authModalMode === 'login' && (
              <div>
                {/* Google Sign-in Button */}
                <button
                  id="google-login-btn"
                  type="button"
                  onClick={() => {
                    clearAlert();
                    setIsGoogleChooserOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer mb-3.5"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span>Đăng nhập bằng Google</span>
                </button>

                <div className="relative flex items-center justify-center mb-3.5">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-2.5 text-[11px] text-slate-400 font-medium shrink-0">
                    hoặc đăng nhập bằng tài khoản Discuss
                  </span>
                </div>

                <form onSubmit={handleLogin} className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập:</label>
                    <input
                      id="login-username-input"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Nhập username của bạn"
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
                          clearAlert();
                          setAuthModalMode('forgot');
                        }}
                        className="text-xs text-orange-600 hover:underline cursor-pointer"
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
                    disabled={isLoading}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading && <RotateCw className="w-4 h-4 animate-spin" />}
                    <span>Đăng nhập</span>
                  </button>

                  <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearAlert();
                        setAuthModalMode('register');
                      }}
                      className="font-semibold text-orange-600 hover:underline cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. REGISTER VIEW */}
            {authModalMode === 'register' && (
              <div>
                {/* Google Sign-in Button */}
                <button
                  id="google-register-btn"
                  type="button"
                  onClick={() => {
                    clearAlert();
                    setIsGoogleChooserOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer mb-3.5"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span>Đăng ký nhanh bằng Google</span>
                </button>

                <div className="relative flex items-center justify-center mb-3.5">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-2.5 text-[11px] text-slate-400 font-medium shrink-0">
                    hoặc điền thông tin đăng ký
                  </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username):</label>
                    <input
                      id="reg-username-input"
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="ví dụ: nguyenvana"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
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
                      placeholder="name@example.com"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mật khẩu:</label>
                      <input
                        id="reg-password-input"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu:</label>
                      <input
                        id="reg-confirm-password-input"
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <button
                    id="reg-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading && <RotateCw className="w-4 h-4 animate-spin" />}
                    <span>Đăng ký</span>
                  </button>

                  <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearAlert();
                        setAuthModalMode('login');
                      }}
                      className="font-semibold text-orange-600 hover:underline cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </form>
              </div>
            )}

        {/* 3. VERIFY EMAIL VIEW */}
        {authModalMode === 'verify-email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-3.5 text-xs sm:text-sm">
            <p className="text-xs text-slate-600 leading-relaxed">
              Vui lòng kiểm tra hòm thư và nhập mã xác thực để kích hoạt tài khoản của bạn.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email tài khoản:</label>
              <input
                id="verify-email-input"
                type="email"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã xác thực:</label>
              <input
                id="verify-code-input"
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Nhập mã xác thực"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden text-slate-900 text-center tracking-widest text-base font-bold"
                required
              />
            </div>

            <button
              id="verify-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading && <RotateCw className="w-4 h-4 animate-spin" />}
              <span>Xác thực tài khoản</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  clearAlert();
                  setAuthModalMode('login');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD VIEW */}
        {authModalMode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-3.5 text-xs sm:text-sm">
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhập email tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email:</label>
              <input
                id="forgot-email-input"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading && <RotateCw className="w-4 h-4 animate-spin" />}
              <span>Gửi yêu cầu khôi phục</span>
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  clearAlert();
                  setAuthModalMode('login');
                }}
                className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAlert();
                  setAuthModalMode('reset-password');
                }}
                className="font-semibold text-orange-600 hover:underline cursor-pointer"
              >
                Đã có mã token?
              </button>
            </div>
          </form>
        )}

        {/* 5. RESET PASSWORD VIEW */}
        {authModalMode === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-3 text-xs sm:text-sm">
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhập mã token đã nhận được từ email và đặt lại mật khẩu mới cho tài khoản.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã xác thực (Token):</label>
              <input
                id="reset-token-input"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Nhập mã token"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới:</label>
              <input
                id="reset-new-password-input"
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới:</label>
              <input
                id="reset-confirm-password-input"
                type="password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden text-slate-900"
                required
              />
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <RotateCw className="w-4 h-4 animate-spin" />}
              <span>Cập nhật mật khẩu</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  clearAlert();
                  setAuthModalMode('login');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}
          </div>
        )}
      </div>
    </div>
  );
};
