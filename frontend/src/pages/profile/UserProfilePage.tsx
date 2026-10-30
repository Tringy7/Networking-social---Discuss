import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { userService } from '../../services';
import { User } from '../../types';
import EditorialTabs from '../../components/ui/EditorialTabs';
import PostCard from '../../components/post/PostCardView';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReportModal from '../../components/post/ReportModal';
import Modal from '../../components/ui/Modal';
import ImageCropEditor from '../../components/profile/ImageCropEditor';
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
  Eye,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, authStatus, uploadAvatar, uploadBanner } = useAuthStore();
  const { posts } = usePostStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [imageActionsTarget, setImageActionsTarget] = useState<'avatar' | 'banner' | null>(null);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [previewKind, setPreviewKind] = useState<'avatar' | 'banner'>('avatar');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const isMe = currentUser?.username === username;

  useEffect(() => {
    // Wait for session restoration so a link to our own profile does not first
    // issue a public-profile request using the username from the URL.
    if (authStatus === 'INITIALIZING') return;
    if (!username) {
      setProfileUser(null);
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    // The URL contains a username for shareable profile links, but the signed-in
    // user's profile must come from the authenticated endpoint. This also keeps
    // the page fresh after profile edits in another tab/session.
    const request = isMe
      ? userService.getMe().then((response): User => ({
          id: response.id || currentUser?.id || response.username,
          username: response.username,
          displayName: response.profile?.displayName || response.username,
          email: response.email,
          avatarUrl: response.profile?.avatar || '',
          bannerUrl: response.profile?.banner || '',
          bio: response.profile?.bio || '',
          location: response.profile?.location || undefined,
          dateOfBirth: response.profile?.dateOfBirth || undefined,
          gender: response.profile?.gender || undefined,
          privacy: {
            showDateOfBirth: response.privacySettings?.showDateOfBirth ?? false,
            showLocation: response.privacySettings?.showLocation ?? false,
            showPostsOnProfile: response.privacySettings?.showPostsOnProfile ?? true,
          },
          role: response.role,
          status: response.status,
          createdAt: response.createdAt || new Date().toISOString(),
          karma: currentUser?.karma ?? 0,
        }))
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
  }, [addToast, authStatus, currentUser, isMe, username]);

  const closeAvatarEditor = () => setIsAvatarEditorOpen(false);
  const closeBannerEditor = () => setIsBannerEditorOpen(false);
  if (profileLoading) {
    return <div role="status" className="py-12 text-center text-sm text-[var(--text-secondary)]">Đang tải hồ sơ...</div>;
  }
  if (!profileUser) {
    return <div role="status" className="py-12 text-center text-sm text-[var(--text-secondary)]">Không tìm thấy người dùng.</div>;
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
    <div className="profile-page w-full pb-8 text-left">
      <section className="profile-editorial">
        <div className={`profile-cover relative w-full bg-[var(--bg-elevated)] ${profileUser.bannerUrl ? '' : 'has-no-cover'}`}>
          {isMe && (
            <button
              type="button"
              onClick={() => setImageActionsTarget((target) => target === 'banner' ? null : 'banner')}
              className="group absolute inset-0 z-10 overflow-hidden bg-[var(--bg-surface)] text-left"
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
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10" />
            </button>
          )}
          {!isMe && (
            <button type="button" onClick={() => setImageActionsTarget((target) => target === 'banner' ? null : 'banner')} aria-label="Tùy chọn ảnh bìa"
              className="absolute inset-0 overflow-hidden bg-[var(--bg-surface)] text-left">
              {profileUser.bannerUrl && (
                <img
                  src={profileUser.bannerUrl}
                  alt={`${profileUser.displayName} - ảnh bìa`}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          )}
          {imageActionsTarget === 'banner' && (
            <div data-ui="popover" className="absolute right-2 top-2 z-50 min-w-44 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-1.5 shadow-xl">
              {profileUser.bannerUrl && (
                <button type="button" onClick={() => { setPreviewKind('banner'); setImageActionsTarget(null); setIsAvatarPreviewOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  <Eye className="h-4 w-4" /> Xem ảnh bìa
                </button>
              )}
              {isMe && (
                <button type="button" onClick={() => { setImageActionsTarget(null); setIsBannerEditorOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  <Camera className="h-4 w-4" /> Chỉnh ảnh bìa
                </button>
              )}
            </div>
          )}
          <div className="profile-avatar-position absolute z-30">
            <button
              type="button"
              onClick={() => setImageActionsTarget((target) => target === 'avatar' ? null : 'avatar')}
              className="group relative h-full w-full rounded-full border-4 border-[var(--bg-surface)] bg-[var(--bg-surface)]"
              aria-label="Tùy chọn ảnh đại diện"
              aria-expanded={imageActionsTarget === 'avatar'}
            >
              <Avatar src={profileUser.avatarUrl} alt={profileUser.displayName} size="2xl" className="h-full w-full" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {isMe ? <Camera className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </span>
            </button>
            {imageActionsTarget === 'avatar' && (
              <div data-ui="popover" className="absolute left-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-1.5 shadow-xl sm:mt-1">
                {profileUser.avatarUrl && (
                  <button type="button" onClick={() => { setPreviewKind('avatar'); setImageActionsTarget(null); setIsAvatarPreviewOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                    <Eye className="h-4 w-4" /> Xem ảnh đại diện
                  </button>
                )}
                {isMe && imageActionsTarget === 'avatar' && (
                  <button type="button" onClick={() => { setImageActionsTarget(null); setIsAvatarEditorOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                    <Camera className="h-4 w-4" /> Chỉnh ảnh đại diện
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-identity">
          <div className="profile-name-row">
            <span className="profile-avatar-spacer" aria-hidden="true" />
            <div className="profile-name-wrap flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <h1 className="editorial-title profile-name text-[var(--text-primary)]">
                {profileUser.displayName}
              </h1>
              {profileUser.role === 'OWNER' && <Badge role="OWNER" />}
              {profileUser.role === 'MODERATOR' && <Badge role="MODERATOR" />}
              {profileUser.role === 'ADMIN' && <Badge role="ADMIN" />}
            </div>
            <div className="profile-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
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
                    className="text-[var(--color-danger)]"
                    title="Báo cáo tài khoản"
                    aria-label="Báo cáo tài khoản"
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

      <div className="profile-columns">
        <section className="profile-activity min-w-0">
        <EditorialTabs label="Hoạt động của người dùng" options={[{ id: 'posts', label: 'Bài viết', icon: <FileText /> }, { id: 'comments', label: 'Bình luận', icon: <MessageSquare /> }]} value={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div className="discussion-list">
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

        <aside className="profile-about">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Giới thiệu</h2>
              {isMe && (
                <Link
                  to="/settings/profile"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-orange)] hover:text-[var(--color-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange)]"
                  title="Cài đặt hồ sơ"
                  aria-label="Cài đặt hồ sơ"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {profileUser.bio || 'Chưa có phần giới thiệu.'}
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
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
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Award className="h-4 w-4 text-[var(--color-orange)]" />
              <span>{userPosts.length} bài viết</span>
            </div>
          </section>
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
        isOpen={isAvatarPreviewOpen}
        onClose={() => setIsAvatarPreviewOpen(false)}
        title={`${previewKind === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'} của ${profileUser.displayName}`}
        maxWidth="4xl"
      >
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar src={profileUser.avatarUrl} alt={profileUser.displayName} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{profileUser.displayName}</div>
              <div className="text-xs text-[var(--text-muted)]">{previewKind === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'}</div>
            </div>
          </div>
          <div className="flex min-h-48 items-center justify-center p-2 sm:p-4">
            <img src={previewKind === 'avatar' ? profileUser.avatarUrl : profileUser.bannerUrl}
              alt={`${previewKind === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'} của ${profileUser.displayName}`}
              className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          </div>
        </div>
      </Modal>

      <ImageCropEditor
        kind="avatar"
        isOpen={isAvatarEditorOpen}
        isSaving={isSavingAvatar}
        onClose={closeAvatarEditor}
        onSave={async (file) => {
          setIsSavingAvatar(true);
          try {
            await uploadAvatar(file);
            const updatedUser = useAuthStore.getState().user;
            if (updatedUser) setProfileUser(updatedUser);
            addToast('Đã cập nhật ảnh đại diện.', 'success');
          } catch (error) {
            addToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện.', 'error');
            throw error;
          } finally { setIsSavingAvatar(false); }
        }}
      />
      <ImageCropEditor
        kind="banner"
        isOpen={isBannerEditorOpen}
        isSaving={isSavingBanner}
        onClose={closeBannerEditor}
        onSave={async (file) => {
          setIsSavingBanner(true);
          try {
            await uploadBanner(file);
            const updatedUser = useAuthStore.getState().user;
            if (updatedUser) setProfileUser(updatedUser);
            addToast('Đã cập nhật ảnh bìa.', 'success');
          } catch (error) {
            addToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh bìa.', 'error');
            throw error;
          } finally { setIsSavingBanner(false); }
        }}
      />
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
