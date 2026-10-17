import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, MapPin, Calendar, AlignLeft, Loader2, Image } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarObjectKey: '',
    bannerObjectKey: '',
    location: '',
    dateOfBirth: '',
    gender: 'MALE',
    showDateOfBirth: false,
    showLocation: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const p = currentUser.profile || {};
      const priv = currentUser.privacySettings || {};
      setFormData({
        displayName: p.displayName || currentUser.name || currentUser.username || '',
        bio: p.bio || currentUser.bio || '',
        avatarObjectKey: p.avatarObjectKey || currentUser.avatar || '',
        bannerObjectKey: p.bannerObjectKey || currentUser.banner || '',
        location: p.location || currentUser.location || '',
        dateOfBirth: p.dateOfBirth || currentUser.dateOfBirth || '',
        gender: p.gender || currentUser.gender || 'MALE',
        showDateOfBirth: priv.showDateOfBirth ?? false,
        showLocation: priv.showLocation ?? true,
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
      // Chuẩn hóa payload theo schema backend
      const payload = {
        name: formData.displayName, // tương thích
        bio: formData.bio,
        avatar: formData.avatarObjectKey,
        profile: {
          displayName: formData.displayName,
          bio: formData.bio,
          avatarObjectKey: formData.avatarObjectKey,
          bannerObjectKey: formData.bannerObjectKey,
          location: formData.location,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        },
        privacySettings: {
          showDateOfBirth: formData.showDateOfBirth,
          showLocation: formData.showLocation,
        },
      };
      await updateProfile(payload);
      onClose();
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa thông tin cá nhân" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorInfo?.message && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            <p>{errorInfo.message}</p>
          </div>
        )}

        {/* Avatar preview */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <img
            src={formData.avatarObjectKey || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
            alt="Avatar Preview"
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-xs shrink-0"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
            }}
          />
          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-700 block mb-1">Ảnh đại diện (URL hoặc Object Key)</span>
            <input
              type="text"
              value={formData.avatarObjectKey}
              onChange={(e) => handleInputChange('avatarObjectKey', e.target.value)}
              placeholder="profiles/15/avatar/... hoặc URL ảnh"
              className={`w-full text-xs px-3 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.avatarObjectKey
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/20'
              }`}
            />
            {fieldErrors.avatarObjectKey && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.avatarObjectKey}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên hiển thị (Display Name) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Hữu Trí"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.displayName
                  ? 'border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
              }`}
            />
          </div>
          {fieldErrors.displayName && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.displayName}</p>
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
              placeholder="Backend Developer | Java & Spring Boot..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa điểm (Location)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ví dụ: Thành phố Hồ Chí Minh"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Giới tính (Gender)
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="MALE">Nam (MALE)</option>
              <option value="FEMALE">Nữ (FEMALE)</option>
              <option value="OTHER">Khác (OTHER)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ngày sinh (Date of Birth)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cài đặt quyền riêng tư
            </label>
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showLocation}
                  onChange={(e) => handleInputChange('showLocation', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Hiển thị địa điểm công khai</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showDateOfBirth}
                  onChange={(e) => handleInputChange('showDateOfBirth', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Hiển thị ngày sinh công khai</span>
              </label>
            </div>
          </div>
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
