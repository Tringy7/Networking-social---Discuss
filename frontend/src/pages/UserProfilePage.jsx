import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
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
  Sparkles 
} from 'lucide-react';

export default function UserProfilePage({
  onOpenEditProfile,
  onOpenPostDetail,
  onOpenEditPost,
  onOpenReportPost,
  onSelectCommunity,
}) {
  const { currentUser, currentRole } = useAuth();
  const { communities, memberships } = useCommunity();
  const { posts } = usePost();

  if (!currentUser) return null;

  // Find all memberships for this user
  const userMemberships = memberships.filter(m => m.userId === currentUser.id && !m.isBanned);
  const userCommunities = userMemberships.map(m => {
    const c = communities.find(comm => comm.id === m.communityId);
    return { ...c, role: m.role };
  }).filter(c => !!c.id);

  // Find posts authored by this user
  const userPosts = posts.filter(p => p.authorId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg object-cover bg-white shrink-0"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                  <RoleBadge role={currentRole} type="system" size="md" />
                </div>
                <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
              </div>
            </div>

            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl mb-4">
            {currentUser.bio || 'Chưa có tiểu sử cá nhân.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Tham gia ngày {formatDate(currentUser.joinedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <strong className="text-slate-800">{formatNumber(currentUser.reputation || 0)}</strong> điểm uy tín
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <strong className="text-slate-800">{userPosts.length}</strong> bài viết
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cộng đồng đã tham gia
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách các cộng đồng bạn đang tham gia trên Discuss.
            </p>
          </div>

          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {userCommunities.length} cộng đồng
          </span>
        </div>

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
      </div>

      {/* Authored Posts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Bài viết đã đăng ({userPosts.length})
        </h3>

        {userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Bạn chưa đăng bài viết nào.
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
