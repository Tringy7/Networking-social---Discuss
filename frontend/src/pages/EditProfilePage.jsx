import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import { 
  User, 
  MapPin, 
  Calendar, 
  Loader2, 
  KeyRound, 
  ArrowLeft, 
  Check, 
  Shield, 
  Eye, 
  FileText,
  Mail 
} from 'lucide-react';

export default function EditProfilePage({
  onBack,
  onOpenChangePassword,
}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/user');
    }
  };
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    bio: '',
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
        username: currentUser.username || '',
        email: currentUser.email || '',
        displayName: p.displayName || currentUser.displayName || currentUser.name || currentUser.username || '',
        bio: p.bio || currentUser.bio || '',
        location: p.location || currentUser.location || '',
        dateOfBirth: p.dateOfBirth || currentUser.dateOfBirth || '',
        gender: p.gender || currentUser.gender || 'MALE',
        showDateOfBirth: priv.showDateOfBirth ?? false,
        showLocation: priv.showLocation ?? true,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);
    try {
      const payload = {};

      // Username giữ nguyên cố định không gửi sửa đổi
      if (formData.email?.trim()) payload.email = formData.email.trim();
      if (formData.displayName?.trim()) payload.displayName = formData.displayName.trim();
      if (formData.bio !== undefined) payload.bio = formData.bio;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.location !== undefined) payload.location = formData.location;
      
      payload.showDateOfBirth = Boolean(formData.showDateOfBirth);
      payload.showLocation = Boolean(formData.showLocation);

      await updateProfile(payload);
      handleBack();
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
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#818384] hover:text-[#d7dadc] cursor-pointer transition-colors bg-[#1a1a1b] px-4 py-2 rounded-full border border-[#343536] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại hồ sơ</span>
        </button>

        <span className="text-xs text-[#818384] font-mono hidden sm:inline">
          u/{currentUser?.username}
        </span>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] shadow-sm overflow-hidden text-[#d7dadc]">
        {/* Header Title */}
        <div className="p-6 bg-[#16181a] border-b border-[#343536]">
          <h2 className="text-base font-bold text-[#d7dadc]">Chỉnh sửa hồ sơ cá nhân</h2>
          <p className="text-xs text-[#818384] mt-0.5">Cập nhật thông tin hiển thị, giới thiệu và quyền riêng tư tài khoản</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {errorMessage && (
            <div className="p-4 text-xs sm:text-sm bg-rose-950/40 border border-rose-800 text-rose-300 rounded-2xl">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Group 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#d7dadc] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Thông tin tài khoản cơ bản</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email giới thiệu liên hệ
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email.lienhe@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#272729] border rounded-xl text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:ring-2 ${
                      fieldErrors.email
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-[#343536] focus:ring-orange-500/30 focus:border-orange-500'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên hiển thị (Display Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#272729] border rounded-xl text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:ring-2 ${
                      fieldErrors.displayName
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-[#343536] focus:ring-orange-500/30 focus:border-orange-500'
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.showLocation}
                  onChange={(e) => handleInputChange('showLocation', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">Hiển thị địa điểm trên hồ sơ</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.showDateOfBirth}
                  onChange={(e) => handleInputChange('showDateOfBirth', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">Hiển thị ngày sinh trên hồ sơ</span>
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
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-semibold rounded-full shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
