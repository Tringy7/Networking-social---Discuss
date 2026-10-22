import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
import { userService } from '../api/userService';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import RoleBadge from '../components/common/RoleBadge';
import PostCard from '../components/post/PostCard';
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
  ArrowLeft
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

  const { currentUser, currentRole, allUsers } = useAuth();
  const { communities, memberships } = useCommunity();
  const { posts } = usePost();

  const [publicUser, setPublicUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-slate-500">Đang tải hồ sơ người dùng...</p>
      </div>
    );
  }

  if (!isMe && fetchError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
        <h3 className="text-base font-bold text-slate-900">Không tìm thấy người dùng</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{fetchError}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}
      </div>
    );
  }

  const targetUser = isMe ? currentUser : publicUser;
  if (!targetUser) {
    if (isMe) {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
        Không tìm thấy thông tin người dùng này.
      </div>
    );
  }

  const profile = targetUser?.profile || {};
  const privacySettings = targetUser?.privacySettings || {};
  const statistics = targetUser?.statistics || null;

  const userDisplayName = profile.displayName || targetUser?.displayName || targetUser?.name || targetUser?.username || 'Người dùng';
  const rawAvatar = profile.avatar || profile.avatarObjectKey || targetUser?.avatar || '';
  const userAvatar = rawAvatar
    ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') ? rawAvatar : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366f1&color=fff`;

  const rawBanner = profile.banner || profile.bannerObjectKey || targetUser?.banner || '';
  const userBio = profile.bio || targetUser?.bio || '';
  const userLocation = profile.location || targetUser?.location || '';
  const userDob = profile.dateOfBirth || targetUser?.dateOfBirth || '';
  const userGender = profile.gender || targetUser?.gender || '';

  const targetUserId = targetUser.userId || targetUser.id;

  // Find all memberships for this user
  const userMemberships = memberships.filter(m => String(m.userId) === String(targetUserId) && !m.isBanned);
  const userCommunities = userMemberships.map(m => {
    const c = communities.find(comm => comm.id === m.communityId);
    return { ...c, role: m.role };
  }).filter(c => !!c.id);

  // Find posts authored by this user
  const userPosts = posts.filter(p => String(p.authorId) === String(targetUserId) || p.author?.username === targetUser?.username);

  const displayPostCount = statistics?.postCount !== undefined ? statistics.postCount : userPosts.length;
  const displayCommentCount = statistics?.commentCount !== undefined ? statistics.commentCount : null;
  const displayCommunityCount = statistics?.communityCount !== undefined ? statistics.communityCount : userCommunities.length;

  return (
    <div className="space-y-6">
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

      {/* Profile Card */}
      <div className="bg-[#1a1a1b] rounded-3xl border border-[#343536] shadow-sm overflow-hidden">
        {/* Banner */}
        <div 
          className="h-36 sm:h-44 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 relative bg-cover bg-center"
          style={rawBanner && (rawBanner.startsWith('http') || rawBanner.startsWith('/')) ? { backgroundImage: `url(${rawBanner})` } : undefined}
        />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <img
                src={userAvatar}
                alt={userDisplayName}
                className="w-24 h-24 rounded-3xl border-4 border-[#1a1a1b] shadow-xl object-cover bg-[#272729] shrink-0"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
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
                className="px-4 py-2 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs font-semibold rounded-full border border-[#343536] transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Settings className="w-3.5 h-3.5 text-[#818384]" />
                <span>Chỉnh sửa thông tin</span>
              </button>
            )}
          </div>

          {userBio ? (
            <p className="text-xs sm:text-sm text-[#d7dadc] leading-relaxed max-w-2xl mb-4">
              {userBio}
            </p>
          ) : (
            <p className="text-xs text-[#818384] italic mb-4">
              Chưa có tiểu sử cá nhân.
            </p>
          )}

          {/* Location & Gender metadata */}
          {(userLocation || (userDob && privacySettings.showDateOfBirth !== false) || userGender) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#818384] mb-4 pb-1">
              {userLocation && (privacySettings.showLocation !== false) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-[#d7dadc]">
                  📍 {userLocation}
                </span>
              )}
              {userGender && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-[#d7dadc]">
                  {userGender === 'MALE' ? 'Nam' : userGender === 'FEMALE' ? 'Nữ' : userGender}
                </span>
              )}
              {userDob && (isMe || privacySettings.showDateOfBirth === true) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272729] border border-[#343536] rounded-full text-[#d7dadc]">
                  🎂 {formatDate(userDob)}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#818384] pt-3 border-t border-[#343536]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#818384]" />
              Tham gia ngày {formatDate(targetUser.createdAt || targetUser.joinedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-400" />
              <strong className="text-[#d7dadc]">{displayPostCount}</strong> bài viết
            </span>
            {displayCommentCount !== null && (
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <strong className="text-[#d7dadc]">{displayCommentCount}</strong> bình luận
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              <strong className="text-[#d7dadc]">{displayCommunityCount}</strong> cộng đồng
            </span>
          </div>
        </div>
      </div>

      {/* Communities section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cộng đồng đã tham gia
            </h3>
            <p className="text-xs text-slate-500">
              {isMe ? 'Danh sách các cộng đồng bạn đang tham gia trên Discuss.' : `Danh sách các cộng đồng mà ${userDisplayName} đang tham gia.`}
            </p>
          </div>

          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {displayCommunityCount} cộng đồng
          </span>
        </div>

        {userCommunities.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa tham gia cộng đồng nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userCommunities.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCommunity(c.id)}
                className="p-3.5 bg-slate-50/80 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={c.avatar}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition truncate">
                      c/{c.slug}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
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
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Bài viết đã đăng ({userPosts.length})
        </h3>

          {userPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
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
  );
}
