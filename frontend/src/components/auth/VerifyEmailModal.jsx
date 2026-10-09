import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle2, RotateCcw, Loader2, KeyRound, ArrowRight } from 'lucide-react';

export default function VerifyEmailModal({
  isOpen,
  onClose,
  initialEmail = '',
  onOpenLogin,
}) {
  const { verifyEmail, resendOtp } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (!isOpen) {
      setCode('');
      setErrorInfo(null);
      setIsSuccess(false);
    }
  }, [initialEmail, isOpen]);

  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      setErrorInfo({
        code: err.code || 'AUTH_010',
        status: err.status || 400,
        message: err.message || 'Mã xác thực không hợp lệ',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setErrorInfo(null);
    setResending(true);

    try {
      await resendOtp({ email: email.trim() });
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setErrorInfo({
        code: err.code || 'AUTH_011',
        status: err.status || 400,
        message: err.message || 'Không thể gửi lại mã OTP',
      });
    } finally {
      setResending(false);
    }
  };

  const handleGoToLogin = () => {
    setIsSuccess(false);
    onClose();
    if (onOpenLogin) {
      onOpenLogin(email);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác thực Email" maxWidth="max-w-md">
      {isSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Xác thực email thành công</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tài khoản của bạn đã được kích hoạt. Bạn có thể tiến hành đăng nhập vào Discuss.
            </p>
          </div>
          <button
            onClick={handleGoToLogin}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            Mã xác thực gồm 6 chữ số đã được gửi đến: <strong className="text-slate-900 font-mono">{email}</strong>
          </div>

          {errorInfo && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Lỗi xác thực</span>
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
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mã xác thực (Code) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã 6 chữ số"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">Chưa nhận được mã?</span>
            <button
              type="button"
              disabled={!canResend || resending}
              onClick={handleResend}
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
              disabled={loading || code.length < 4}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Xác thực email</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
