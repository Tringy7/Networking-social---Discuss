import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader2, MailCheck, ArrowLeft, MessageSquareCode } from 'lucide-react';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

export default function LoginPage({ onOpenForgotPassword, onOpenVerifyEmail }) {
  const { login, loginSocial, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Nếu đã đăng nhập thì điều hướng về trang chủ
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorInfo?.errors?.[field]) {
      setErrorInfo((prev) => {
        if (!prev?.errors) return prev;
        const newErrors = { ...prev.errors };
        delete newErrors[field];
        return { ...prev, errors: Object.keys(newErrors).length > 0 ? newErrors : null };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      navigate('/');
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setErrorInfo(null);
    setSocialLoading(true);

    try {
      await loginSocial('google', credential);
      navigate('/');
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setSocialLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};
  const errorMessage = errorInfo ? getFriendlyErrorMessage(errorInfo) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trang chủ Discuss</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <MessageSquareCode className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Discuss.</h2>
            <p className="text-xs text-slate-500">Mạng Xã Hội Thảo Luận Công Nghệ</p>
          </div>
        </div>

        <h1 className="mt-6 text-xl font-bold text-slate-900">
          Đăng nhập tài khoản của bạn
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {errorMessage && (
              <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-2">
                <p>{errorMessage}</p>

                {errorInfo?.code === 'AUTH_021' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenVerifyEmail) {
                        onOpenVerifyEmail(errorInfo.email || formData.username);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    <MailCheck className="w-4 h-4" />
                    <span>Nhập OTP xác thực email ngay</span>
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên tài khoản <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="nhập username"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.username
                      ? 'border-rose-400 focus:ring-rose-400/30'
                      : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-rose-400/30'
                      : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || socialLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Hoặc tiếp tục với</span>
            </div>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleCredential}
            onError={(errMsg) => setErrorInfo({ message: errMsg })}
            disabled={loading || socialLoading}
            text="signin_with"
          />
        </div>
      </div>
    </div>
  );
}
