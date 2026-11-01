import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

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
    if (isOpen) {
      setFormData({
        username: prefilledUsername || '',
        password: '',
      });
      setErrorInfo(null);
    } else {
      setFormData({
        username: '',
        password: '',
      });
      setErrorInfo(null);
    }
  }, [isOpen, prefilledUsername]);

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
      onClose();
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
      onClose();
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setSocialLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đăng nhập tài khoản Discuss" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {errorInfo?.message && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-2">
            <p>{errorInfo.message}</p>

            {errorInfo.code === 'AUTH_021' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenVerifyEmail) {
                    onOpenVerifyEmail(errorInfo.email || formData.username);
                  }
                }}
                className="mt-1 btn-danger w-full !py-1.5 text-xs"
              >
                <MailCheck className="w-3.5 h-3.5" />
                <span>Nhập mã OTP xác thực email ngay</span>
              </button>
            )}
          </div>
        )}

        <div>
          <label className="form-label">
            Tên đăng nhập (Username)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="discuss_login_username"
              id="discuss_login_username"
              autoComplete="off"
              required
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder=""
              className={`input-with-icon ${(fieldErrors.username || fieldErrors.email) ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
            />
          </div>
          {(fieldErrors.username || fieldErrors.email) && (
            <p className="text-xs text-rose-500 mt-1 font-medium">
              {fieldErrors.username || fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label !mb-0">
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
              name="discuss_login_password"
              id="discuss_login_password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder=""
              className={`input-with-icon ${fieldErrors.password ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.password}</p>
          )}
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Đăng nhập</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">hoặc</span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={socialLoading} />

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
