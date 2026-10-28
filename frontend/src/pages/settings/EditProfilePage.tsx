import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Camera, Image, Check } from 'lucide-react';

export const EditProfilePage: React.FC = () => {
  const { user, updateProfile, uploadAvatar, uploadBanner } = useAuthStore();
  const { addToast } = useToastStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const initializedForUserId = useRef<string | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      initializedForUserId.current = null;
      setDisplayName('');
      setBio('');
      setLocation('');
      setDateOfBirth('');
      setGender('Nam');
      setAvatarUrl('');
      setBannerUrl('');
      return;
    }
    if (initializedForUserId.current === user.id) return;
    initializedForUserId.current = user.id;
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setDateOfBirth(user?.dateOfBirth || '');
    setGender(user?.gender || 'Nam');
    setAvatarUrl(user?.avatarUrl || '');
    setBannerUrl(user?.bannerUrl || '');
  }, [user]);

  const handleAvatarChange = () => {
    avatarInputRef.current?.click();
  };

  const handleBannerChange = () => {
    bannerInputRef.current?.click();
  };

  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    upload: (file: File) => Promise<void>,
    label: string
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsLoading(true);
    try {
      await upload(file);
      addToast(`Đã cập nhật ${label}.`, 'success');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : `Không thể cập nhật ${label}.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        dateOfBirth,
        gender,
      });
      addToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ cá nhân.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="pb-3 border-b border-[#303235]">
        <h2 className="text-lg font-bold text-[#F5F5F5]">Chỉnh sửa hồ sơ cá nhân</h2>
        <p className="text-xs text-[#9A9DA3]">Thông tin này sẽ hiển thị công khai trên trang cá nhân của bạn.</p>
      </div>

      {/* Media previews */}
      <div className="space-y-3">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleMediaUpload(event, uploadAvatar, 'ảnh đại diện')}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleMediaUpload(event, uploadBanner, 'ảnh bìa')}
        />
        <label className="text-xs font-semibold text-[#9A9DA3] block">Ảnh bìa & Ảnh đại diện</label>
        
        {/* Banner Preview with edit button */}
        <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-[#101112] border border-[#303235]">
          <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleBannerChange}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Image className="w-3.5 h-3.5" />
            <span>Đổi ảnh bìa</span>
          </button>
        </div>

        {/* Avatar Preview with edit button */}
        <div className="flex items-center gap-4 -mt-10 sm:-mt-12 pl-4 relative z-10">
          <div className="relative group">
            <Avatar src={avatarUrl} alt={displayName} size="xl" className="border-4 border-[#191A1C] shadow-xl" />
            <button
              type="button"
              onClick={handleAvatarChange}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div className="pt-8">
            <Button type="button" variant="secondary" size="sm" onClick={handleAvatarChange}>
              Tải ảnh đại diện mới
            </Button>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <Input
          label="Tên hiển thị (Display Name)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          required
        />

        {/* Bio with counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#9A9DA3]">Tiểu sử (Bio)</label>
            <span className="text-[11px] text-[#70747C]">{bio.length}/200</span>
          </div>
          <textarea
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Giới thiệu bản thân, chuyên môn và sở thích của bạn..."
            className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#70747C] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Địa điểm / Tỉnh thành"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="TP. Hồ Chí Minh, Việt Nam"
          />

          <Input
            label="Ngày sinh"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#9A9DA3]">Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-2.5 text-xs text-[#F5F5F5] outline-none cursor-pointer"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác / Không muốn tiết lộ</option>
            <option value="Không muốn tiết lộ">Không muốn tiết lộ</option>
          </select>
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#303235]">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => {
            setDisplayName(user?.displayName || '');
            setBio(user?.bio || '');
            addToast('Đã khôi phục các giá trị ban đầu', 'info');
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
};

export default EditProfilePage;
