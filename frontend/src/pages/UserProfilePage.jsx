import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
import { userService } from '../api/userService';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import RoleBadge from '../components/common/RoleBadge';
import PostCard from '../components/post/PostCard';
import ImageCropperModal from '../components/common/ImageCropperModal';
import UserProfileRightSidebar from '../components/user/UserProfileRightSidebar';
import { formatDate, formatNumber } from '../utils/formatters';
import { 
  User, 
  Settings, 
  Award, 
  Calendar, 
  FileText, 
  Users, 
  ShieldCheck, 
  Sparkles,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Camera,
  Upload
} from 'lucide-react';

export default function UserProfilePage({
  userId: propUserId = null,
  onOpenEditProfile,
  onOpenPostDetail,
  onOpenEditPost,
  onOpenReportPost,
  onSelectCommunity,
  onBack,
}) {
  const params = useParams();
  const navigate = useNavigate();
  const userId = propUserId || params.userId || null;

  const { currentUser, currentRole, allUsers, uploadAvatar, uploadBanner } = useAuth();
  const { communities, memberships } = useCommunity();
  const { posts } = usePost();

  const [publicUser, setPublicUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Upload Avatar & Banner States
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState('avatar'); // 'avatar' | 'banner'
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const isMe = !userId || (currentUser && (String(currentUser.id) === String(userId) || currentUser.username === String(userId)));

  useEffect(() => {
    if (isMe) {
      setPublicUser(null);
      setFetchError(null);
      return;
    }

    let isMounted = true;
    const fetchPublicProfile = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await userService.getUserById(userId);
        if (isMounted) {
          setPublicUser(data);
        }
      } catch (err) {
        if (isMounted) {
          const localMatch = allUsers.find(u => String(u.id) === String(userId) || u.username === String(userId));
          if (localMatch) {
            setPublicUser({
              userId: localMatch.id,
              username: localMatch.username,
              joinedAt: localMatch.joinedAt || localMatch.createdAt,
              profile: {
                displayName: localMatch.name || localMatch.displayName || localMatch.username,
                bio: localMatch.bio || '',
                avatarObjectKey: localMatch.avatar || '',
                bannerObjectKey: localMatch.banner || '',
                gender: localMatch.gender || 'MALE',
                location: localMatch.location || '',
              },
              statistics: {
                postCount: posts.filter(p => p.authorId === localMatch.id).length,
                commentCount: 0,
                communityCount: memberships.filter(m => m.userId === localMatch.id).length,
              }
            });
          } else {
            setFetchError(getFriendlyErrorMessage(err, 'Không tìm thấy người dùng'));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPublicProfile();
    return () => {
      isMounted = false;
    };
  }, [userId, isMe, allUsers, posts, memberships]);

  const targetUser = isMe ? currentUser : publicUser;
  const targetUserId = targetUser?.userId || targetUser?.id;

  // Find all memberships for this user
  const userMemberships = memberships.filter(m => String(m.userId) === String(targetUserId) && !m.isBanned);
  const userCommunities = userMemberships.map(m => {
    const c = communities.find(comm => comm.id === m.communityId);
    return { ...c, role: m.role };
  }).filter(c => !!c.id);

  // Find posts authored by this user
  const userPosts = posts.filter(p => String(p.authorId) === String(targetUserId) || p.author?.username === targetUser?.username);

  const displayPostCount = targetUser?.statistics?.postCount !== undefined ? targetUser.statistics.postCount : userPosts.length;
  const displayCommentCount = targetUser?.statistics?.commentCount !== undefined ? targetUser.statistics.commentCount : null;
  const displayCommunityCount = targetUser?.statistics?.communityCount !== undefined ? targetUser.statistics.communityCount : userCommunities.length;



  // Handlers for Avatar & Banner upload
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
    if (cropTarget === 'avatar') {
      setUploadingAvatar(true);
      try {
        await uploadAvatar(croppedFile);
        setCropperOpen(false);
        setCropFile(null);
      } catch (err) {
        // Handled in context
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      setUploadingBanner(true);
      try {
        await uploadBanner(croppedFile);
        setCropperOpen(false);
        setCropFile(null);
      } catch (err) {
        // Handled in context
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-sm text-[#818384]">Đang tải hồ sơ người dùng...</p>
      </div>
    );
  }

  if (!isMe && fetchError) {
    return (
      <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-950/40 text-rose-400 border border-rose-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
        <h3 className="text-base font-bold text-[#d7dadc]">Không tìm thấy người dùng</h3>
        <p className="text-xs text-[#818384] max-w-sm mx-auto">{fetchError}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs font-semibold rounded-full border border-[#343536] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}
      </div>
    );
  }

  if (!targetUser) {
    if (isMe) {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] p-12 text-center text-xs text-[#818384]">
        Không tìm thấy thông tin người dùng này.
      </div>
    );
  }

  const profile = targetUser?.profile || {};
  const privacySettings = targetUser?.privacySettings || {};

  const userDisplayName = profile.displayName || targetUser?.displayName || targetUser?.name || targetUser?.username || 'Người dùng';
  const rawAvatar = profile.avatar || profile.avatarObjectKey || targetUser?.avatar || '';
  const userAvatar = rawAvatar
    ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') ? rawAvatar : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366f1&color=fff`;

  const rawBanner = profile.banner || profile.bannerObjectKey || targetUser?.banner || '';

  return (
    <div className="flex gap-6 items-start w-full">
      {/* Hidden file inputs for direct upload */}
      {isMe && (
        <>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerFileSelect}
            accept="image/*"
            className="hidden"
          />
        </>
      )}

      {/* Main Center Column (Banner, Avatar, Username, Communities, Posts) */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Top back button if viewing someone else */}
        {!isMe && onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#818384] hover:text-[#d7dadc] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
        )}

        {/* Profile Header Card */}
        <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] shadow-sm overflow-hidden">
          {/* Banner with click to change trigger */}
          <div 
            onClick={isMe ? () => bannerInputRef.current?.click() : undefined}
            className={`h-40 sm:h-52 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 relative bg-cover bg-center flex items-end justify-end p-4 group/banner ${
              isMe ? 'cursor-pointer' : ''
            }`}
            style={rawBanner && (rawBanner.startsWith('http') || rawBanner.startsWith('/')) ? { backgroundImage: `url(${rawBanner})` } : undefined}
            title={isMe ? 'Nhấp để thay đổi ảnh bìa' : undefined}
          >
            {isMe && (
              <div className="px-3.5 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full text-xs font-semibold transition cursor-pointer inline-flex items-center gap-2 shadow-lg border border-white/10 opacity-75 group-hover/banner:opacity-100 group-hover/banner:scale-105">
                {uploadingBanner ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                ) : (
                  <Camera className="w-4 h-4 text-orange-400" />
                )}
                <span>{uploadingBanner ? 'Đang tải lên...' : 'Đổi ảnh bìa'}</span>
              </div>
            )}
          </div>

          <div className="px-6 pb-5 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-1">
              <div className="flex items-end gap-4">
                {/* Avatar with click & hover change trigger */}
                <div className="relative group/avatar self-start">
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-24 h-24 rounded-3xl border-4 border-[#1a1a1b] shadow-xl object-cover bg-[#272729] shrink-0"
                  />

                  {isMe && (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 bg-black/60 hover:bg-black/75 rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                      title="Nhấn để thay đổi ảnh đại diện"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-white mb-0.5" />
                          <span className="text-[10px] font-bold">Đổi ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold text-[#d7dadc]">{userDisplayName}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#818384] font-mono">
                    <span>u/{targetUser?.username}</span>
                    {isMe && targetUser?.email && (
                      <>
                        <span className="text-[#343536]">•</span>
                        <span>{targetUser.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isMe && (
                <button
                  onClick={onOpenEditProfile}
                  className="xl:hidden px-4 py-2 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs font-semibold rounded-full border border-[#343536] transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Settings className="w-3.5 h-3.5 text-[#818384]" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Communities section */}
        <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#d7dadc]">
                Cộng đồng đã tham gia
              </h3>
              <p className="text-xs text-[#818384]">
                {isMe ? 'Danh sách các cộng đồng bạn đang tham gia trên Discuss.' : `Danh sách các cộng đồng mà ${userDisplayName} đang tham gia.`}
              </p>
            </div>

            <span className="text-xs font-bold text-orange-400 bg-[#272729] border border-[#343536] px-3 py-1 rounded-full">
              {displayCommunityCount} cộng đồng
            </span>
          </div>

          {userCommunities.length === 0 ? (
            <p className="text-xs text-[#818384] italic">Chưa tham gia cộng đồng nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userCommunities.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCommunity(c.id)}
                  className="p-3.5 bg-[#272729] hover:bg-[#343536] rounded-2xl border border-[#343536] transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-[#343536] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#d7dadc] group-hover:text-orange-400 transition truncate">
                        c/{c.slug}
                      </h4>
                      <p className="text-[11px] text-[#818384] truncate">
                        {c.name}
                      </p>
                    </div>
                  </div>

                  <RoleBadge role={c.role} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Authored Posts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#818384] uppercase tracking-wider">
            Bài viết đã đăng ({userPosts.length})
          </h3>

          {userPosts.length === 0 ? (
            <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-8 text-center text-xs text-[#818384]">
              {isMe ? 'Bạn chưa đăng bài viết nào.' : 'Người dùng này chưa có bài viết nào.'}
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenDetail={onOpenPostDetail}
                onOpenEdit={onOpenEditPost}
                onOpenReport={onOpenReportPost}
                onSelectCommunity={onSelectCommunity}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar: Dedicated User Details (Reddit style) */}
      <UserProfileRightSidebar
        targetUser={targetUser}
        isMe={isMe}
        onOpenEditProfile={onOpenEditProfile}
        userPostsCount={userPosts.length}
        userCommunitiesCount={userCommunities.length}
      />

      {/* Image Cropper Modal for Avatar & Banner */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropFile(null);
        }}
        imageFile={cropFile}
        targetType={cropTarget}
        onConfirmCrop={handleConfirmCrop}
        loading={uploadingAvatar || uploadingBanner}
      />
    </div>
  );
}
