import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        oldPassword: '',
        password: '',
        confirmPassword: '',
      });
      setErrorInfo(null);
      setIsSuccess(false);
    }
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

    if (formData.password !== formData.confirmPassword) {
      setErrorInfo({
        message: 'Mật khẩu xác nhận không khớp',
        errors: { confirmPassword: 'Mật khẩu xác nhận không khớp' },
      });
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        oldPassword: formData.oldPassword,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" maxWidth="max-w-md">
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">Đổi mật khẩu thành công!</h4>
          <p className="text-xs text-slate-500">Mật khẩu mới của bạn đã được cập nhật.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {errorInfo?.message && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              <p>{errorInfo.message}</p>
            </div>
          )}

          <div>
            <label className="form-label">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                name="discuss_old_password"
                id="discuss_old_password"
                autoComplete="current-password"
                value={formData.oldPassword}
                onChange={(e) => handleInputChange('oldPassword', e.target.value)}
                placeholder="Nhập mật khẩu cũ..."
                className={`input-with-icon ${fieldErrors.oldPassword ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.oldPassword && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.oldPassword}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                name="discuss_new_password"
                id="discuss_new_password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Nhập mật khẩu mới..."
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
                name="discuss_confirm_password"
                id="discuss_confirm_password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className={`input-with-icon ${fieldErrors.confirmPassword ? '!border-rose-400 focus:!ring-rose-400/30' : ''}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
