import React, { useState, useEffect, useRef } from 'react';
import ImageCropperModal from '../components/common/ImageCropperModal';
import { useAuth } from '../context/AuthContext';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import { 
  User, 
  MapPin, 
  Calendar, 
  Loader2, 
  KeyRound, 
  Upload, 
  Camera, 
  ArrowLeft, 
  Check, 
  Shield, 
  Eye, 
  FileText 
} from 'lucide-react';

export default function EditProfilePage({
  onBack,
  onOpenChangePassword,
}) {
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

  // States cho modal crop ảnh
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState('avatar'); // 'avatar' | 'banner'

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
  }, [currentUser]);

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

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropTarget('avatar');
    setCropperOpen(true);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleBannerFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropTarget('banner');
    setCropperOpen(true);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleConfirmCrop = async (croppedFile) => {
    setErrorInfo(null);
    if (cropTarget === 'avatar') {
      setUploadingAvatar(true);
      try {
        const res = await uploadAvatar(croppedFile);
        const newUrl = res?.url || res?.objectKey;
        if (newUrl) {
          setFormData(prev => ({ ...prev, avatarObjectKey: newUrl }));
        }
        setCropperOpen(false);
        setCropFile(null);
      } catch (err) {
        setErrorInfo(err);
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      setUploadingBanner(true);
      try {
        const res = await uploadBanner(croppedFile);
        const newUrl = res?.url || res?.objectKey;
        if (newUrl) {
          setFormData(prev => ({ ...prev, bannerObjectKey: newUrl }));
        }
        setCropperOpen(false);
        setCropFile(null);
      } catch (err) {
        setErrorInfo(err);
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);
    try {
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
      if (onBack) onBack();
    } catch (err) {
      setErrorInfo(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = errorInfo?.errors || {};
  const errorMessage = errorInfo ? getFriendlyErrorMessage(errorInfo) : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại hồ sơ</span>
        </button>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          @{currentUser?.username}
        </span>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner Preview & Upload Area */}
        <div 
          className="h-44 sm:h-52 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative bg-cover bg-center flex items-end justify-end p-4"
          style={formData.bannerObjectKey ? { backgroundImage: `url(${formData.bannerObjectKey})` } : undefined}
        >
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4" />}
            <span>{uploadingBanner ? 'Đang tải lên...' : 'Thay đổi ảnh bìa (1500x500)'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {errorMessage && (
            <div className="p-4 text-xs sm:text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 -mt-16 sm:-mt-20 relative pb-6 border-b border-slate-100">
            <div className="relative group/avatar self-start">
              <img
                src={formData.avatarObjectKey || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/45 hover:bg-black/60 rounded-3xl flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-2"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Upload className="w-4 h-4 text-indigo-600" />}
                  <span>{uploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh đại diện mới'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Ảnh đại diện sẽ được cắt theo tỉ lệ vuông chuẩn 1:1 (256x256px).
              </p>
            </div>
          </div>

          {/* Group 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Thông tin tài khoản cơ bản</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tiểu sử (Bio)
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Giới thiệu đôi nét về bản thân hoặc lĩnh vực chuyên môn..."
                className={`w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none ${
                  fieldErrors.bio
                    ? 'border-rose-400 focus:ring-rose-400/30'
                    : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.bio && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.bio}</p>
              )}
            </div>
          </div>

          {/* Group 2: Thông tin cá nhân */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Thông tin chi tiết</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="MALE">Nam (MALE)</option>
                  <option value="FEMALE">Nữ (FEMALE)</option>
                  <option value="OTHER">Khác (OTHER)</option>
                </select>
              </div>

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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Group 3: Quyền riêng tư */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Cài đặt hiển thị & quyền riêng tư</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.showLocation}
                  onChange={(e) => handleInputChange('showLocation', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">Hiển thị địa điểm</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.showDateOfBirth}
                  onChange={(e) => handleInputChange('showDateOfBirth', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">Hiển thị ngày sinh</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.showPostsOnProfile}
                  onChange={(e) => handleInputChange('showPostsOnProfile', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">Hiển thị bài viết</span>
              </label>
            </div>
          </div>

          {/* Group 4: Bảo mật & Đổi mật khẩu */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Bảo mật tài khoản</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Thay đổi mật khẩu đăng nhập của bạn bất cứ lúc nào</p>
            </div>

            <button
              type="button"
              onClick={onOpenChangePassword}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Đổi mật khẩu</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer transition"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal cắt ảnh avatar hoặc banner */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => {
          if (!uploadingAvatar && !uploadingBanner) {
            setCropperOpen(false);
            setCropFile(null);
          }
        }}
        imageFile={cropFile}
        targetType={cropTarget}
        onConfirmCrop={handleConfirmCrop}
        loading={uploadingAvatar || uploadingBanner}
      />
    </div>
  );
}
