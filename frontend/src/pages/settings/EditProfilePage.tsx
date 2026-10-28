import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { Camera, Check, Image as ImageIcon, ImagePlus, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

type CropKind = 'avatar' | 'banner';
interface CropOffset { x: number; y: number }

async function createCroppedImage(
  src: string,
  kind: CropKind,
  zoom: number,
  rotation: number,
  offset: CropOffset
): Promise<File> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
    image.src = src;
  });

  const width = kind === 'avatar' ? 512 : 1920;
  const height = kind === 'avatar' ? 512 : 640;
  const quarterTurn = Math.abs(rotation % 180) === 90;
  const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * zoom;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');

  context.translate(width / 2 + offset.x * width, height / 2 + offset.y * height);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2,
    image.naturalWidth * scale, image.naturalHeight * scale);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Không thể xuất ảnh đã chỉnh sửa.')), 'image/jpeg', 0.92);
  });
  return new File([blob], kind === 'avatar' ? 'avatar.jpg' : 'profile-banner.jpg', { type: 'image/jpeg' });
}

export const EditProfilePage: React.FC = () => {
  const { user, updateProfile, uploadAvatar, uploadBanner } = useAuthStore();
  const { addToast } = useToastStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const initializedForUserId = useRef<string | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [cropKind, setCropKind] = useState<CropKind | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });

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

  useEffect(() => {
    if (!cropPreviewUrl) return;
    return () => URL.revokeObjectURL(cropPreviewUrl);
  }, [cropPreviewUrl]);

  const handleAvatarChange = () => {
    setCropKind('avatar');
    setCropPreviewUrl('');
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
  };

  const handleBannerChange = () => {
    setCropKind('banner');
    setCropPreviewUrl('');
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
  };

  const handleMediaSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: CropKind
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('Ảnh không được vượt quá 10 MB.', 'error');
      return;
    }
    setCropPreviewUrl(URL.createObjectURL(file));
    setCropKind(kind);
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
  };

  const closeCropEditor = () => {
    setCropKind(null);
    setCropPreviewUrl('');
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
    dragPositionRef.current = null;
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = dragPositionRef.current;
    if (!previous) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const kind = cropKind;
    if (!kind) return;
    const width = bounds.width;
    const height = bounds.height;
    setCropOffset((offset) => ({
      x: offset.x + (event.clientX - previous.x) / width,
      y: offset.y + (event.clientY - previous.y) / height,
    }));
    dragPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleSaveCroppedImage = async () => {
    if (!cropPreviewUrl || !cropKind) return;
    setIsLoading(true);
    try {
      const file = await createCroppedImage(cropPreviewUrl, cropKind, cropZoom, cropRotation, cropOffset);
      if (cropKind === 'avatar') {
        await uploadAvatar(file);
        setAvatarUrl(useAuthStore.getState().user?.avatarUrl || '');
      } else {
        await uploadBanner(file);
        setBannerUrl(useAuthStore.getState().user?.bannerUrl || '');
      }
      addToast(`Đã cập nhật ${cropKind === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}.`, 'success');
      closeCropEditor();
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh.', 'error');
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
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleMediaSelected(event, 'avatar')}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleMediaSelected(event, 'banner')}
        />
        <label className="text-xs font-semibold text-[#9A9DA3] block">Ảnh bìa & Ảnh đại diện</label>
        
        <button
          type="button"
          onClick={handleBannerChange}
          disabled={isLoading}
          aria-label="Chọn ảnh bìa mới"
          className="group relative block h-32 w-full cursor-pointer overflow-hidden rounded-2xl border border-[#303235] bg-[#101112] text-left disabled:cursor-wait sm:h-40"
        >
          {bannerUrl && <img src={bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10" />
        </button>

        {/* Click the avatar itself to choose a replacement. */}
        <div className="flex items-center gap-4 -mt-10 sm:-mt-12 pl-4 relative z-10">
          <button
            type="button"
            onClick={handleAvatarChange}
            disabled={isLoading}
            aria-label="Chọn ảnh đại diện mới"
            className="group relative cursor-pointer rounded-full disabled:cursor-wait"
          >
            <Avatar src={avatarUrl} alt={displayName} size="xl" className="border-4 border-[#191A1C] shadow-xl" />
            <span className="absolute inset-1 flex items-center justify-center rounded-full bg-black/0 text-white transition-colors group-hover:bg-black/45 group-focus-visible:bg-black/45">
              <Camera className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </span>
          </button>
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
      <Modal
        isOpen={Boolean(cropKind)}
        onClose={() => { if (!isLoading) closeCropEditor(); }}
        title={cropKind === 'avatar' ? 'Chỉnh sửa ảnh đại diện' : 'Chỉnh sửa ảnh bìa'}
        description={cropKind === 'avatar'
          ? 'Chọn ảnh, căn chỉnh khung tròn rồi lưu để cập nhật ảnh đại diện.'
          : 'Chọn ảnh, kéo để căn khung ngang rồi lưu để cập nhật ảnh bìa.'}
        maxWidth={cropKind === 'avatar' ? 'lg' : '4xl'}
      >
        {cropKind && (
          <div className="space-y-5">
            {cropPreviewUrl ? <div
              className={`mx-auto ${cropKind === 'avatar' ? 'h-56 w-56 rounded-full' : 'aspect-[3/1] w-full rounded-xl'} touch-none cursor-grab overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)] active:cursor-grabbing`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragPositionRef.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerMove={handleCropPointerMove}
              onPointerUp={() => { dragPositionRef.current = null; }}
              onPointerCancel={() => { dragPositionRef.current = null; }}
              aria-label={cropKind === 'avatar' ? 'Kéo ảnh để căn chỉnh khung cắt' : 'Kéo ảnh để căn chỉnh khung ảnh bìa'}
            >
              <img
                src={cropPreviewUrl}
                alt={cropKind === 'avatar' ? 'Xem trước ảnh đại diện' : 'Xem trước ảnh bìa'}
                draggable={false}
                className="h-full w-full select-none object-cover"
                style={{
                  transform: `translate(${cropOffset.x * 100}%, ${cropOffset.y * 100}%) scale(${cropZoom}) rotate(${cropRotation}deg)`,
                }}
              />
            </div> : (
              <button
                type="button"
                onClick={() => (cropKind === 'avatar' ? avatarInputRef.current : bannerInputRef.current)?.click()}
                className={`mx-auto flex ${cropKind === 'avatar' ? 'min-h-56 w-full' : 'aspect-[3/1] w-full'} flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 text-center transition-colors hover:border-[var(--color-orange)]`}
              >
                <ImagePlus className="h-9 w-9 text-[var(--color-orange)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {cropKind === 'avatar' ? 'Chọn ảnh từ thiết bị' : 'Chọn ảnh bìa từ thiết bị'}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">JPG, PNG hoặc WebP · Tối đa 10 MB</span>
              </button>
            )}
            {cropPreviewUrl && <><p className="text-center text-xs text-[var(--text-secondary)]">
              {cropKind === 'avatar'
                ? 'Kéo ảnh để căn vị trí; phần nằm trong khung tròn sẽ được lưu.'
                : 'Kéo ảnh để căn vị trí; vùng ngang hiển thị trong khung sẽ được lưu.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCropZoom((zoom) => Math.max(1, Number((zoom - 0.1).toFixed(1))))}
                className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                aria-label="Thu nhỏ ảnh"
              ><ZoomOut className="h-4 w-4" /></button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropZoom}
                onChange={(event) => setCropZoom(Number(event.target.value))}
                className="w-36 accent-[var(--color-orange)]"
                aria-label="Phóng to ảnh"
              />
              <button
                type="button"
                onClick={() => setCropZoom((zoom) => Math.min(3, Number((zoom + 0.1).toFixed(1))))}
                className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                aria-label="Phóng to ảnh"
              ><ZoomIn className="h-4 w-4" /></button>
              <button
                type="button"
                onClick={() => setCropRotation((rotation) => (rotation - 90 + 360) % 360)}
                className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                aria-label={cropKind === 'avatar' ? 'Xoay ảnh sang trái' : 'Xoay ảnh bìa sang trái'}
              ><RotateCcw className="h-4 w-4" /></button>
              <button
                type="button"
                onClick={() => setCropRotation((rotation) => (rotation + 90) % 360)}
                className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                aria-label={cropKind === 'avatar' ? 'Xoay ảnh sang phải' : 'Xoay ảnh bìa sang phải'}
              ><RotateCw className="h-4 w-4" /></button>
              <button
                type="button"
                onClick={() => (cropKind === 'avatar' ? avatarInputRef.current : bannerInputRef.current)?.click()}
                className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >Chọn ảnh khác</button>
            </div></>}
            <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
              <Button type="button" variant="secondary" onClick={closeCropEditor} disabled={isLoading}>Hủy</Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleSaveCroppedImage()}
                disabled={!cropPreviewUrl || isLoading}
                leftIcon={cropKind === 'avatar' ? <Camera className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              >
                {isLoading ? 'Đang lưu...' : cropKind === 'avatar' ? 'Lưu ảnh' : 'Lưu ảnh bìa'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </form>
  );
};

export default EditProfilePage;
