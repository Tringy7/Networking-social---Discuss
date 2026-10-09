import React, { useState } from 'react';
import VoteButtons from './VoteButtons';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { permissions } from '../../utils/permissions';
import { formatTimeAgo, formatNumber } from '../../utils/formatters';
import { 
  Pin, 
  MessageSquare, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Flag, 
  PinOff,
  Share2
} from 'lucide-react';

export default function PostCard({
  post,
  onOpenDetail,
  onOpenEdit,
  onOpenReport,
  onSelectCommunity,
}) {
  const { allUsers, currentUser } = useAuth();
  const { communities, getUserCommunityRole } = useCommunity();
  const { deletePost, togglePinPost } = usePost();
  const [showMenu, setShowMenu] = useState(false);

  const author = allUsers.find(u => u.id === post.authorId) || {
    name: 'Người dùng Discuss',
    username: 'discuss_user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  };

  const community = communities.find(c => c.id === post.communityId) || {
    name: 'Cộng đồng',
    slug: 'general',
  };

  const communityRole = getUserCommunityRole(post.communityId);

  const canEdit = permissions.canEditPost(currentUser, post);
  const canDelete = permissions.canDeletePost(currentUser, post, communityRole);
  const canPin = permissions.canPinPost(currentUser, communityRole);
  const canReport = permissions.canReportPost(currentUser);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      await deletePost(post.id);
    }
  };

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    await togglePinPost(post.id);
  };

  return (
    <div
      onClick={() => onOpenDetail(post)}
      className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden relative group hover:shadow-md ${
        post.isPinned 
          ? 'border-indigo-300/80 bg-gradient-to-b from-indigo-50/20 to-white shadow-xs' 
          : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Pinned banner indicator */}
      {post.isPinned && (
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-4 py-1.5 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
          <Pin className="w-3.5 h-3.5 rotate-45 text-indigo-600" />
          <span>Bài viết được ghim bởi Ban điều hành</span>
        </div>
      )}

      <div className="p-4 sm:p-5 flex gap-3 sm:gap-4 items-start">
        {/* Left Vote Column */}
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons post={post} layout="vertical" />
        </div>

        {/* Main Post Content */}
        <div className="flex-1 min-w-0">
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {/* Community Link */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCommunity(post.communityId);
                }}
                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>c/{community.slug}</span>
              </button>
              <span className="text-slate-300">•</span>
              
              {/* Author */}
              <div className="flex items-center gap-1.5">
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-medium text-slate-700">u/{author.username}</span>
              </div>
              <span className="text-slate-300">•</span>
              
              {/* Time */}
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>

            {/* Menu Options Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-7 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in">
                  {canPin && (
                    <button
                      onClick={handleTogglePin}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      {post.isPinned ? (
                        <>
                          <PinOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Bỏ ghim bài viết</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Ghim lên đầu trang</span>
                        </>
                      )}
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenEdit(post);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chỉnh sửa bài viết</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Xóa bài viết</span>
                    </button>
                  )}

                  {canReport && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenReport(post);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Báo cáo bài viết</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-3">
            {post.content}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer Bar */}
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 hover:text-indigo-600 transition">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>{formatNumber(post.commentsCount || 0)} bình luận</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard?.writeText(window.location.href);
                alert('Đã sao chép liên kết bài viết!');
              }}
              className="flex items-center gap-1 hover:text-slate-700 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
