import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

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

  useEffect(() => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrorInfo(null);
  }, [isOpen]);

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
      const res = await register(formData);
      onClose();
      if (onOpenVerifyEmail) {
        onOpenVerifyEmail(res.data.email);
      }
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
    <Modal isOpen={isOpen} onClose={onClose} title="Đăng ký tài khoản Discuss" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
        {errorInfo?.message && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            <p>{errorInfo.message}</p>
          </div>
        )}

        <div>
          <label className="form-label">
            Tên tài khoản (Username) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="discuss_register_username"
              id="discuss_register_username"
              autoComplete="off"
              required
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder=""
              className={`input-with-icon ${fieldErrors.username ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
            />
          </div>
          {fieldErrors.username && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.username}</p>
          )}
        </div>

        <div>
          <label className="form-label">
            Địa chỉ Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="discuss_register_email"
              id="discuss_register_email"
              autoComplete="off"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder=""
              className={`input-with-icon ${fieldErrors.email ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="form-label">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="discuss_register_password"
              id="discuss_register_password"
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

        <div>
          <label className="form-label">
            Xác nhận mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="discuss_register_confirm_password"
              id="discuss_register_confirm_password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder=""
              className={`input-with-icon ${fieldErrors.confirmPassword ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Đăng ký tài khoản</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">hoặc</span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" disabled={socialLoading} />

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
