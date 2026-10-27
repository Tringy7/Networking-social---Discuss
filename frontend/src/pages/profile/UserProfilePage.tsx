import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { userService } from '../../services';
import { User } from '../../types';
import PostCard from '../../components/post/PostCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReportModal from '../../components/post/ReportModal';
import Modal from '../../components/ui/Modal';
import {
  Calendar,
  MapPin,
  Cake,
  Settings,
  Edit3,
  Share2,
  Flag,
  FileText,
  MessageSquare,
  Award,
  Camera,
  ImagePlus,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
} from 'lucide-react';

interface CropOffset {
  x: number;
  y: number;
}

async function createCroppedAvatar(
  src: string,
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

  const size = 512;
  const isQuarterTurn = Math.abs(rotation % 180) === 90;
  const rotatedWidth = isQuarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = isQuarterTurn ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(size / rotatedWidth, size / rotatedHeight) * zoom;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');

  context.translate(size / 2 + offset.x * size, size / 2 + offset.y * size);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Không thể xuất ảnh đã chỉnh sửa.')),
      'image/jpeg',
      0.92
    );
  });
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}

async function createCroppedBanner(
  src: string,
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

  const width = 1920;
  const height = 640;
  const isQuarterTurn = Math.abs(rotation % 180) === 90;
  const rotatedWidth = isQuarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = isQuarterTurn ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * zoom;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');

  context.translate(width / 2 + offset.x * width, height / 2 + offset.y * height);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Không thể xuất ảnh đã chỉnh sửa.')),
      'image/jpeg',
      0.92
    );
  });
  return new File([blob], 'profile-banner.jpg', { type: 'image/jpeg' });
}

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, uploadAvatar, uploadBanner } = useAuthStore();
  const { posts } = usePostStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [avatarOffset, setAvatarOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerRotation, setBannerRotation] = useState(0);
  const [bannerOffset, setBannerOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);

  const isMe = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    let active = true;
    setProfileLoading(true);
    const request = isMe && currentUser
      ? Promise.resolve(currentUser)
      : userService.getPublicProfile(username);
    request.then((profile) => {
      if (active) setProfileUser(profile);
    }).catch((error: unknown) => {
      if (active) {
        setProfileUser(null);
        addToast(error instanceof Error ? error.message : 'Không thể tải hồ sơ người dùng.', 'error');
      }
    }).finally(() => {
      if (active) setProfileLoading(false);
    });
    return () => {
      active = false;
    };
  }, [addToast, currentUser, isMe, username]);

  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!bannerPreviewUrl) return;
    return () => URL.revokeObjectURL(bannerPreviewUrl);
  }, [bannerPreviewUrl]);

  const closeAvatarEditor = () => {
    setIsAvatarEditorOpen(false);
    setAvatarPreviewUrl('');
    setAvatarZoom(1);
    setAvatarRotation(0);
    setAvatarOffset({ x: 0, y: 0 });
    dragPositionRef.current = null;
  };

  const handleAvatarFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarZoom(1);
    setAvatarRotation(0);
    setAvatarOffset({ x: 0, y: 0 });
  };

  const closeBannerEditor = () => {
    setIsBannerEditorOpen(false);
    setBannerPreviewUrl('');
    setBannerZoom(1);
    setBannerRotation(0);
    setBannerOffset({ x: 0, y: 0 });
    dragPositionRef.current = null;
  };

  const handleBannerFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setBannerPreviewUrl(URL.createObjectURL(file));
    setBannerZoom(1);
    setBannerRotation(0);
    setBannerOffset({ x: 0, y: 0 });
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreviewUrl) {
      addToast('Chọn ảnh đại diện trước khi lưu.', 'warning');
      return;
    }
    setIsSavingAvatar(true);
    try {
      const croppedAvatar = await createCroppedAvatar(
        avatarPreviewUrl,
        avatarZoom,
        avatarRotation,
        avatarOffset
      );
      await uploadAvatar(croppedAvatar);
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser) setProfileUser(updatedUser);
      addToast('Đã cập nhật ảnh đại diện.', 'success');
      closeAvatarEditor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện.', 'error');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerPreviewUrl) {
      addToast('Chọn ảnh bìa trước khi lưu.', 'warning');
      return;
    }
    setIsSavingBanner(true);
    try {
      const croppedBanner = await createCroppedBanner(
        bannerPreviewUrl,
        bannerZoom,
        bannerRotation,
        bannerOffset
      );
      await uploadBanner(croppedBanner);
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser) setProfileUser(updatedUser);
      addToast('Đã cập nhật ảnh bìa.', 'success');
      closeBannerEditor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh bìa.', 'error');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleAvatarCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleAvatarCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previousPosition = dragPositionRef.current;
    if (!previousPosition) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = (event.clientX - previousPosition.x) / bounds.width;
    const deltaY = (event.clientY - previousPosition.y) / bounds.height;
    dragPositionRef.current = { x: event.clientX, y: event.clientY };
    setAvatarOffset((offset) => ({
      x: Math.max(-0.5, Math.min(0.5, offset.x + deltaX)),
      y: Math.max(-0.5, Math.min(0.5, offset.y + deltaY)),
    }));
  };

  const handleBannerCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previousPosition = dragPositionRef.current;
    if (!previousPosition) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = (event.clientX - previousPosition.x) / bounds.width;
    const deltaY = (event.clientY - previousPosition.y) / bounds.height;
    dragPositionRef.current = { x: event.clientX, y: event.clientY };
    setBannerOffset((offset) => ({
      x: Math.max(-0.5, Math.min(0.5, offset.x + deltaX)),
      y: Math.max(-0.5, Math.min(0.5, offset.y + deltaY)),
    }));
  };

  if (profileLoading) {
    return <div className="py-24 text-center text-sm text-[#9A9DA3]">Đang tải hồ sơ...</div>;
  }
  if (!profileUser) {
    return <div className="py-24 text-center text-sm text-[#9A9DA3]">Không tìm thấy người dùng.</div>;
  }

  const userPosts = posts.filter((p) => p.author.username === profileUser.username);
  const joinedDate = new Date(profileUser.createdAt);
  const joinedLabel = Number.isNaN(joinedDate.getTime())
    ? 'Chưa có thông tin'
    : joinedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Đã sao chép liên kết trang cá nhân!', 'success');
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 text-left [zoom:0.9]">
      <section>
        <div className="relative h-28 w-full sm:h-36">
          {isMe && (
            <button
              type="button"
              onClick={() => setIsBannerEditorOpen(true)}
              className="group absolute inset-0 z-10 overflow-hidden rounded-xl bg-[var(--bg-surface)] text-left"
              aria-label="Chỉnh sửa ảnh bìa"
              title="Chỉnh sửa ảnh bìa"
            >
              {profileUser.bannerUrl ? (
                <img
                  src={profileUser.bannerUrl}
                  alt={`${profileUser.displayName} - ảnh bìa`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
                  Thêm ảnh bìa
                </span>
              )}
              <span className="absolute inset-0 flex items-end justify-end bg-black/0 p-3 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-sm backdrop-blur">
                  <ImageIcon className="h-4 w-4" />
                  <span className="sr-only">
                    {profileUser.bannerUrl ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}
                  </span>
                </span>
              </span>
            </button>
          )}
          {!isMe && (
            <div className="absolute inset-0 overflow-hidden rounded-xl bg-[var(--bg-surface)]">
              {profileUser.bannerUrl && (
                <img
                  src={profileUser.bannerUrl}
                  alt={`${profileUser.displayName} - ảnh bìa`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}
          {isMe ? (
            <button
              type="button"
              onClick={() => setIsAvatarEditorOpen(true)}
              className="group absolute bottom-0 left-5 z-20 h-24 w-24 translate-y-1/2 rounded-full border-4 border-[var(--bg-main)] bg-[var(--bg-main)] shadow-lg sm:left-7 sm:h-28 sm:w-28"
              aria-label="Chỉnh sửa ảnh đại diện"
              title="Chỉnh sửa ảnh đại diện"
            >
              <Avatar
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                size="2xl"
                className="h-full w-full"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="h-6 w-6" />
              </span>
            </button>
          ) : (
            <Avatar
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              size="2xl"
              className="absolute bottom-0 left-5 z-20 h-24 w-24 translate-y-1/2 border-4 border-[var(--bg-main)] bg-[var(--bg-main)] shadow-lg sm:left-7 sm:h-28 sm:w-28"
            />
          )}
        </div>

        <div className="-mt-12 px-4 pb-4 pt-12 sm:-mt-14 sm:px-7 sm:pb-5 sm:pt-14">
          <div className="flex min-h-12 items-center gap-2 sm:min-h-14 sm:gap-3">
            <span className="w-20 shrink-0 sm:w-28" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <h1 className="max-w-full truncate text-base font-black text-[var(--text-primary)] sm:text-xl">
                {profileUser.displayName}
              </h1>
              {profileUser.role === 'OWNER' && <Badge role="OWNER" />}
              {profileUser.role === 'MODERATOR' && <Badge role="MODERATOR" />}
              {profileUser.role === 'ADMIN' && <Badge role="ADMIN" />}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {isMe ? (
                <Link to="/settings/profile">
                  <Button variant="secondary" size="sm" className="px-2.5 sm:px-3" leftIcon={<Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}>
                    Chỉnh sửa
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/messages">
                    <Button variant="primary" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                      Nhắn tin
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReportOpen(true)}
                    className="text-[#EF4444]"
                    title="Báo cáo tài khoản"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </>
              )}

              <button
                onClick={handleShareProfile}
                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] sm:p-2.5"
                title="Chia sẻ hồ sơ"
                aria-label="Chia sẻ hồ sơ"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      <div className="grid grid-cols-1 items-start border-y border-[var(--border-color)] lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-4 py-4 sm:py-5 lg:pr-5">
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] text-sm font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'border-[var(--color-orange)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Bài viết</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'border-[var(--color-orange)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Bình luận</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {profileUser.privacy.showPostsOnProfile ? (
              userPosts.length > 0 ? (
                userPosts.map((p) => <PostCard key={p.id} post={p} />)
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
                  {profileUser.displayName} chưa đăng bài viết nào.
                </div>
              )
            ) : (
              <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
                Bài viết của người dùng này không được công khai.
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-2 py-12 text-center text-sm text-[var(--text-secondary)]">
            <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-orange)] opacity-70" />
            <p>Chưa có dữ liệu bình luận để hiển thị.</p>
          </div>
        )}
        </section>

        <aside className="border-t border-[var(--border-color)] py-4 sm:py-5 lg:border-l lg:border-t-0 lg:pl-5">
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Giới thiệu</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {profileUser.bio || 'Chưa có phần giới thiệu.'}
            </p>
            <div className="mt-4 space-y-3 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span>Tham gia {joinedLabel}</span>
              </div>
              {profileUser.privacy.showLocation && profileUser.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.privacy.showDateOfBirth && profileUser.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span>Sinh nhật {profileUser.dateOfBirth}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-secondary)]">
              <Award className="h-4 w-4 text-[var(--color-orange)]" />
              <span>{profileUser.karma} bài viết</span>
            </div>
          </section>
          {isMe && (
            <Link to="/settings/profile" className="block">
              <Button variant="secondary" size="sm" className="w-full" leftIcon={<Settings className="h-4 w-4" />}>
                Cài đặt hồ sơ
              </Button>
            </Link>
          )}
        </aside>
      </div>
      </section>

      <footer className="site-footer flex flex-col gap-2 pt-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 DISCUSS Community Network</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/explore" className="transition-colors hover:text-[var(--text-primary)]">Cộng đồng</Link>
          <Link to="/settings/privacy" className="transition-colors hover:text-[var(--text-primary)]">Quyền riêng tư</Link>
          <Link to="/settings" className="transition-colors hover:text-[var(--text-primary)]">Cài đặt</Link>
        </nav>
      </footer>

      <Modal
        isOpen={isAvatarEditorOpen}
        onClose={() => {
          if (!isSavingAvatar) closeAvatarEditor();
        }}
        title="Chỉnh sửa ảnh đại diện"
        description="Chọn ảnh, căn chỉnh khung tròn rồi lưu để cập nhật ảnh đại diện."
        maxWidth="lg"
      >
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarFileSelected}
        />
        <div className="space-y-5">
          {avatarPreviewUrl ? (
            <div
              className="mx-auto h-56 w-56 touch-none cursor-grab overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] active:cursor-grabbing"
              onPointerDown={handleAvatarCropPointerDown}
              onPointerMove={handleAvatarCropPointerMove}
              onPointerUp={() => { dragPositionRef.current = null; }}
              onPointerCancel={() => { dragPositionRef.current = null; }}
              aria-label="Kéo ảnh để căn chỉnh khung cắt"
            >
              <img
                src={avatarPreviewUrl}
                alt="Xem trước ảnh đại diện"
                className="h-full w-full select-none object-cover"
                draggable={false}
                style={{
                  transform: `translate(${avatarOffset.x * 100}%, ${avatarOffset.y * 100}%) scale(${avatarZoom}) rotate(${avatarRotation}deg)`,
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 text-center transition-colors hover:border-[var(--color-orange)]"
            >
              <ImagePlus className="h-9 w-9 text-[var(--color-orange)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Chọn ảnh từ thiết bị</span>
              <span className="text-xs text-[var(--text-secondary)]">JPG, PNG hoặc WebP · Tối đa 10 MB</span>
            </button>
          )}

          {avatarPreviewUrl && (
            <>
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Kéo ảnh để căn vị trí; phần nằm trong khung tròn sẽ được lưu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarZoom((zoom) => Math.max(1, Number((zoom - 0.1).toFixed(1))))}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Thu nhỏ ảnh"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={avatarZoom}
                  onChange={(event) => setAvatarZoom(Number(event.target.value))}
                  className="w-36 accent-[var(--color-orange)]"
                  aria-label="Phóng to ảnh"
                />
                <button
                  type="button"
                  onClick={() => setAvatarZoom((zoom) => Math.min(3, Number((zoom + 0.1).toFixed(1))))}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Phóng to ảnh"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarRotation((rotation) => (rotation - 90 + 360) % 360)}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Xoay ảnh sang trái"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarRotation((rotation) => (rotation + 90) % 360)}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Xoay ảnh sang phải"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Chọn ảnh khác
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
            <Button type="button" variant="secondary" onClick={closeAvatarEditor} disabled={isSavingAvatar}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSaveAvatar()}
              disabled={!avatarPreviewUrl || isSavingAvatar}
              leftIcon={<Camera className="h-4 w-4" />}
            >
              {isSavingAvatar ? 'Đang lưu...' : 'Lưu ảnh'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBannerEditorOpen}
        onClose={() => {
          if (!isSavingBanner) closeBannerEditor();
        }}
        title="Chỉnh sửa ảnh bìa"
        description="Chọn ảnh, kéo để căn khung ngang rồi lưu để cập nhật ảnh bìa."
        maxWidth="4xl"
      >
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleBannerFileSelected}
        />
        <div className="space-y-5">
          {bannerPreviewUrl ? (
            <div
              className="mx-auto aspect-[3/1] w-full touch-none cursor-grab overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] active:cursor-grabbing"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragPositionRef.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerMove={handleBannerCropPointerMove}
              onPointerUp={() => { dragPositionRef.current = null; }}
              onPointerCancel={() => { dragPositionRef.current = null; }}
              aria-label="Kéo ảnh để căn chỉnh khung ảnh bìa"
            >
              <img
                src={bannerPreviewUrl}
                alt="Xem trước ảnh bìa"
                className="h-full w-full select-none object-cover"
                draggable={false}
                style={{
                  transform: `translate(${bannerOffset.x * 100}%, ${bannerOffset.y * 100}%) scale(${bannerZoom}) rotate(${bannerRotation}deg)`,
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="flex aspect-[3/1] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 text-center transition-colors hover:border-[var(--color-orange)]"
            >
              <ImagePlus className="h-9 w-9 text-[var(--color-orange)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Chọn ảnh bìa từ thiết bị</span>
              <span className="text-xs text-[var(--text-secondary)]">JPG, PNG hoặc WebP · Tối đa 10 MB</span>
            </button>
          )}

          {bannerPreviewUrl && (
            <>
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Kéo ảnh để căn vị trí; vùng ngang hiển thị trong khung sẽ được lưu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setBannerZoom((zoom) => Math.max(1, Number((zoom - 0.1).toFixed(1))))}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Thu nhỏ ảnh bìa"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={bannerZoom}
                  onChange={(event) => setBannerZoom(Number(event.target.value))}
                  className="w-36 accent-[var(--color-orange)]"
                  aria-label="Phóng to ảnh bìa"
                />
                <button
                  type="button"
                  onClick={() => setBannerZoom((zoom) => Math.min(3, Number((zoom + 0.1).toFixed(1))))}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Phóng to ảnh bìa"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setBannerRotation((rotation) => (rotation - 90 + 360) % 360)}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Xoay ảnh bìa sang trái"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setBannerRotation((rotation) => (rotation + 90) % 360)}
                  className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Xoay ảnh bìa sang phải"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Chọn ảnh khác
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
            <Button type="button" variant="secondary" onClick={closeBannerEditor} disabled={isSavingBanner}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSaveBanner()}
              disabled={!bannerPreviewUrl || isSavingBanner}
              leftIcon={<ImageIcon className="h-4 w-4" />}
            >
              {isSavingBanner ? 'Đang lưu...' : 'Lưu ảnh bìa'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contentType="USER"
        contentId={profileUser.id}
        contentTitle={`Tài khoản @${profileUser.username}`}
        targetUsername={profileUser.username}
      />
    </div>
  );
};

export default UserProfilePage;
