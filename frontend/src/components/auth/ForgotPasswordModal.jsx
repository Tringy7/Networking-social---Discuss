import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Mail, KeyRound, Lock, CheckCircle, Loader2, RotateCcw, ArrowLeft } from 'lucide-react';

const STEPS = {
  EMAIL: 'EMAIL',
  VERIFY_OTP: 'VERIFY_OTP',
  RESET_PASSWORD: 'RESET_PASSWORD',
  SUCCESS: 'SUCCESS',
};

export default function ForgotPasswordModal({ isOpen, onClose, onOpenLogin }) {
  const { forgotPassword, verifyForgotPasswordOtp, resetPassword } = useAuth();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [errorInfo, setErrorInfo] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (isOpen && step === STEPS.VERIFY_OTP && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [isOpen, step, countdown]);

  const handleResetState = () => {
    setStep(STEPS.EMAIL);
    setEmail('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setErrorInfo(null);
    setSuccessMsg('');
    setCountdown(60);
    setCanResend(false);
    setLoading(false);
    setResending(false);
    onClose();
  };

  const handleFieldChange = (setter, field) => (e) => {
    setter(e.target.value);
    if (errorInfo?.errors?.[field]) {
      setErrorInfo((prev) => {
        if (!prev?.errors) return prev;
        const newErrors = { ...prev.errors };
        delete newErrors[field];
        return { ...prev, errors: Object.keys(newErrors).length > 0 ? newErrors : null };
      });
    }
  };

  // Bước 1.7: Yêu cầu gửi email (POST /auth/forgot-password)
  const handleRequestEmail = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      setSuccessMsg(res?.message || '');
      setStep(STEPS.VERIFY_OTP);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP (POST /auth/forgot-password)
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setErrorInfo(null);
    setResending(true);

    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      setSuccessMsg(res?.message || '');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setResending(false);
    }
  };

  // Bước 1.8: Xác minh OTP (POST /auth/forgot-password/verify)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      const res = await verifyForgotPasswordOtp({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      setSuccessMsg(res?.message || '');
      setStep(STEPS.RESET_PASSWORD);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  // Bước 1.9: Đặt lại mật khẩu (POST /auth/forgot-password/reset)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      const res = await resetPassword({
        password,
        confirmPassword,
      });
      setSuccessMsg(res?.message || '');
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  const modalTitle = {
    [STEPS.EMAIL]: 'Quên mật khẩu',
    [STEPS.VERIFY_OTP]: 'Xác minh mã OTP',
    [STEPS.RESET_PASSWORD]: 'Đặt lại mật khẩu',
    [STEPS.SUCCESS]: 'Khôi phục thành công',
  }[step];

  return (
    <Modal isOpen={isOpen} onClose={handleResetState} title={modalTitle} maxWidth="max-w-md">
      {/* Bước 4: Thành công */}
      {step === STEPS.SUCCESS && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">{successMsg}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới.
            </p>
          </div>
          <button
            onClick={() => {
              const currentEmail = email;
              handleResetState();
              if (onOpenLogin) {
                onOpenLogin(currentEmail);
              }
            }}
            className="btn-primary w-full"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Bước 1: Nhập email (POST /auth/forgot-password) */}
      {step === STEPS.EMAIL && (
        <form onSubmit={handleRequestEmail} className="space-y-4">
          {errorInfo?.message && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              <p>{errorInfo.message}</p>
            </div>
          )}

          <div>
            <label className="form-label">
              Địa chỉ Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={handleFieldChange(setEmail, 'email')}
                placeholder=""
                className={`input-with-icon ${fieldErrors.email ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading || !email.trim()} className="btn-primary w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Gửi mã xác thực</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                handleResetState();
                if (onOpenLogin) onOpenLogin();
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        </form>
      )}

      {/* Bước 2: Xác minh OTP (POST /auth/forgot-password/verify) */}
      {step === STEPS.VERIFY_OTP && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs">
            <div className="truncate text-slate-600">
              Mã gửi tới: <span className="font-semibold text-slate-800">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorInfo(null);
                setStep(STEPS.EMAIL);
              }}
              className="text-indigo-600 hover:underline font-medium shrink-0 ml-2 cursor-pointer"
            >
              Đổi email
            </button>
          </div>

          {errorInfo?.message && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              <p>{errorInfo.message}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mã xác thực (Code) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={code}
                onChange={handleFieldChange(setCode, 'code')}
                placeholder=""
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:ring-2 ${
                  fieldErrors.code
                    ? 'border-rose-400 focus:ring-rose-400/30'
                    : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.code && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.code}</p>
            )}
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">Chưa nhận được mã?</span>
            <button
              type="button"
              disabled={!canResend || resending}
              onClick={handleResendOtp}
              className={`font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canResend
                  ? 'text-indigo-600 hover:text-indigo-700 hover:underline'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>{canResend ? 'Gửi lại mã OTP' : `Gửi lại sau (${countdown}s)`}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Xác minh mã OTP</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setErrorInfo(null);
                setStep(STEPS.EMAIL);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại bước trước
            </button>
          </div>
        </form>
      )}

      {/* Bước 3: Đặt lại mật khẩu (POST /auth/forgot-password/reset) */}
      {step === STEPS.RESET_PASSWORD && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {errorInfo?.message && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              <p>{errorInfo.message}</p>
            </div>
          )}

          <div>
            <label className="form-label">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={handleFieldChange(setPassword, 'password')}
                placeholder=""
                className={`input-with-icon ${fieldErrors.password ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={handleFieldChange(setConfirmPassword, 'confirmPassword')}
                placeholder=""
                className={`input-with-icon ${fieldErrors.confirmPassword ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Đặt lại mật khẩu</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
