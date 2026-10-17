import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, MapPin, Calendar, AlignLeft, Loader2, Image, KeyRound, Upload, Camera } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose, onOpenChangePassword }) {
  const { currentUser, updateProfile, uploadAvatar, uploadBanner } = useAuth();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatarObjectKey: '',
    bannerObjectKey: '',
    location: '',
    dateOfBirth: '',
    gender: 'MALE',
    showDateOfBirth: false,
    showLocation: true,
    showPostsOnProfile: true,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const p = currentUser.profile || {};
      const priv = currentUser.privacySettings || {};
      setFormData({
        username: currentUser.username || '',
        displayName: p.displayName || currentUser.displayName || currentUser.name || currentUser.username || '',
        bio: p.bio || currentUser.bio || '',
        avatarObjectKey: p.avatarObjectKey || currentUser.avatar || '',
        bannerObjectKey: p.bannerObjectKey || currentUser.banner || '',
        location: p.location || currentUser.location || '',
        dateOfBirth: p.dateOfBirth || currentUser.dateOfBirth || '',
        gender: p.gender || currentUser.gender || 'MALE',
        showDateOfBirth: priv.showDateOfBirth ?? false,
        showLocation: priv.showLocation ?? true,
        showPostsOnProfile: priv.showPostsOnProfile ?? true,
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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setErrorInfo(null);
    try {
      const res = await uploadAvatar(file);
      const newUrl = res?.url || res?.objectKey;
      if (newUrl) {
        setFormData(prev => ({ ...prev, avatarObjectKey: newUrl }));
      }
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setErrorInfo(null);
    try {
      const res = await uploadBanner(file);
      const newUrl = res?.url || res?.objectKey;
      if (newUrl) {
        setFormData(prev => ({ ...prev, bannerObjectKey: newUrl }));
      }
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);
    try {
      // UpdateProfileRequestDTO chỉ chứa các trường được phép cập nhật
      const payload = {};

      if (formData.username?.trim()) payload.username = formData.username.trim();
      if (formData.displayName?.trim()) payload.displayName = formData.displayName.trim();
      if (formData.bio !== undefined) payload.bio = formData.bio;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.location !== undefined) payload.location = formData.location;
      
      payload.showDateOfBirth = Boolean(formData.showDateOfBirth);
      payload.showLocation = Boolean(formData.showLocation);
      payload.showPostsOnProfile = Boolean(formData.showPostsOnProfile);

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

        {/* Avatar upload & preview */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <img
                src={formData.avatarObjectKey || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-xs shrink-0"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition cursor-pointer"
                title="Tải ảnh mới"
              >
                {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-700 block">Ảnh đại diện (Avatar)</span>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{uploadingAvatar ? 'Đang tải lên...' : 'Tải file ảnh'}</span>
                </button>
              </div>

              <input
                type="text"
                value={formData.avatarObjectKey}
                onChange={(e) => handleInputChange('avatarObjectKey', e.target.value)}
                placeholder=""
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

          {/* Banner upload section */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700 block">Ảnh bìa cá nhân (Banner)</span>
              <p className="text-[11px] text-slate-400 truncate">Hỗ trợ file ảnh JPG, PNG, WEBP</p>
            </div>

            <input
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{uploadingBanner ? 'Đang tải lên...' : 'Tải ảnh bìa'}</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên tài khoản (Username) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold">@</span>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder=""
              className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 ${
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
              placeholder=""
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
                placeholder=""
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
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showPostsOnProfile}
                  onChange={(e) => handleInputChange('showPostsOnProfile', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Hiển thị bài viết trên trang cá nhân</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bảo mật & Đổi mật khẩu */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800">Bảo mật tài khoản</h4>
            <p className="text-[11px] text-slate-400">Thay đổi mật khẩu đăng nhập tài khoản của bạn</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenChangePassword) {
                onOpenChangePassword();
              }
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Đổi mật khẩu</span>
          </button>
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
