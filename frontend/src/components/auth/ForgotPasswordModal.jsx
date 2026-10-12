import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onOpenLogin }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res?.message || '');
      setSubmitted(true);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetState = () => {
    setSubmitted(false);
    setSuccessMsg('');
    setErrorInfo(null);
    setEmail('');
    onClose();
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={handleResetState} title="Khôi phục mật khẩu" maxWidth="max-w-md">
      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">{successMsg}</h4>
          </div>
          <button
            onClick={() => {
              handleResetState();
              onOpenLogin();
            }}
            className="btn-primary w-full"
          >
            Quay lại Đăng nhập
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Nhập địa chỉ email liên kết với tài khoản của bạn để nhận liên kết đặt lại mật khẩu.
          </p>

          {errorInfo?.message && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {errorInfo.message}
            </div>
          )}

          <div>
            <label className="form-label">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder=""
                className={`input-with-icon ${fieldErrors.email ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Gửi liên kết khôi phục</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
