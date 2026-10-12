import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Image, AlignLeft, Loader2 } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        avatar: currentUser.avatar || '',
      });
      setErrorInfo(null);
    }
  }, [currentUser, isOpen]);

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
      await updateProfile(formData);
      onClose();
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa thông tin cá nhân">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorInfo?.message && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            <p>{errorInfo.message}</p>
          </div>
        )}

        {/* Avatar preview */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <img
            src={formData.avatar || currentUser?.avatar}
            alt="Avatar Preview"
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-xs shrink-0"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
            }}
          />
          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-700 block mb-1">Ảnh đại diện (URL)</span>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={`w-full text-xs px-3 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.avatar
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/20'
              }`}
            />
            {fieldErrors.avatar && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.avatar}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Họ và tên
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Tiểu sử (Bio)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Chia sẻ đôi nét về bạn, sở thích hoặc kinh nghiệm làm việc..."
              className={`w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none ${
                fieldErrors.bio
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.bio && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.bio}</p>
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
