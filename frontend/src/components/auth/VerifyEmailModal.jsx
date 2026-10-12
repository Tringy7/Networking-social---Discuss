import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Mail, RotateCcw, Loader2, KeyRound } from 'lucide-react';

export default function VerifyEmailModal({
  isOpen,
  onClose,
  initialEmail = '',
  initialOtp = '',
}) {
  const { verifyEmail, resendOtp } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [code, setCode] = useState(initialOtp || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialOtp) {
      setCode(initialOtp);
    }
    if (!isOpen) {
      setCode('');
      setErrorInfo(null);
    }
  }, [initialEmail, initialOtp, isOpen]);

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

  const handleEmailChange = (val) => {
    setEmail(val);
    if (errorInfo?.errors?.email) {
      setErrorInfo((prev) => {
        if (!prev?.errors) return prev;
        const newErrors = { ...prev.errors };
        delete newErrors.email;
        return { ...prev, errors: Object.keys(newErrors).length > 0 ? newErrors : null };
      });
    }
  };

  const handleCodeChange = (val) => {
    setCode(val);
    if (errorInfo?.errors?.code) {
      setErrorInfo((prev) => {
        if (!prev?.errors) return prev;
        const newErrors = { ...prev.errors };
        delete newErrors.code;
        return { ...prev, errors: Object.keys(newErrors).length > 0 ? newErrors : null };
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });
      onClose();
    } catch (err) {
      setErrorInfo(err);
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
      setErrorInfo(err);
    } finally {
      setResending(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác thực Email" maxWidth="max-w-md">
      <form onSubmit={handleVerify} className="space-y-4">
        {errorInfo?.message && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
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
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/30'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
          )}
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
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
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
            disabled={loading || !code.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Xác thực email</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
