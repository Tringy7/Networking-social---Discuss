import React, { useState } from 'react';
import { Post } from '../types';
import { useApp } from '../context/AppContext';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Pin,
  PinOff,
  Flag,
  Trash2,
  Edit3,
  Check,
  X,
  Crown,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onOpenDetail?: () => void;
  onOpenReport?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onOpenDetail, onOpenReport }) => {
  const {
    currentUser,
    users,
    communities,
    comments,
    votePost,
    getPostScore,
    getUserVote,
    getUserCommunityRole,
    togglePinPost,
    deletePost,
    updatePost,
    setSelectedCommunityId,
    setActivePostId,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);

  const author = users.find((u) => u.id === post.authorId);
  const community = communities.find((c) => c.id === post.communityId);
  const postComments = comments.filter((c) => c.postId === post.id && !c.isDeleted);
  const score = getPostScore(post.id);
  const userVote = getUserVote(post.id);

  // Community role of the author in this community
  const authorRoleInComm = getUserCommunityRole(post.communityId, post.authorId);

  // Current viewer privileges
  const viewerRole = currentUser ? getUserCommunityRole(post.communityId, currentUser.id) : null;
  const isGlobalAdmin = currentUser?.globalRole === 'ADMIN';
  const isAuthor = currentUser?.id === post.authorId;
  const canPin = viewerRole === 'MODERATOR' || viewerRole === 'OWNER' || isGlobalAdmin;
  const canDelete = isAuthor || viewerRole === 'MODERATOR' || viewerRole === 'OWNER' || isGlobalAdmin;

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Tiêu đề và nội dung không được để trống.');
      return;
    }
    const res = updatePost(post.id, editTitle, editContent);
    if (res.success) {
      setIsEditing(false);
    } else {
      alert(res.message);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = isAuthor
      ? 'Bạn có chắc chắn muốn xóa bài viết của mình?'
      : 'Bạn đang xóa bài viết này với tư cách Quản trị/Điều hành viên. Tiếp tục?';
    if (confirm(confirmMsg)) {
      deletePost(post.id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = togglePinPost(post.id);
    if (!res.success) alert(res.message);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      id={`post-card-${post.id}`}
      className={`bg-white rounded-2xl border transition hover:border-slate-300 shadow-xs flex overflow-hidden ${
        post.isPinned ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200/80'
      }`}
    >
      {/* Left: Reddit-style Vote Bar (Function #27) */}
      <div className="w-11 sm:w-12 bg-slate-50/60 p-2 flex flex-col items-center justify-start border-r border-slate-100 shrink-0">
        <button
          id={`upvote-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            votePost(post.id, 1);
          }}
          aria-label="Upvote bài viết"
          className={`p-1 rounded hover:bg-slate-200/80 transition cursor-pointer ${
            userVote === 1 ? 'text-orange-600 font-bold scale-110' : 'text-slate-400 hover:text-orange-600'
          }`}
        >
          <ArrowBigUp className="w-6 h-6 fill-current" />
        </button>

        <span
          id={`score-display-${post.id}`}
          className={`text-xs font-bold my-0.5 ${
            userVote === 1
              ? 'text-orange-600 font-extrabold'
              : userVote === -1
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-700'
          }`}
        >
          {score}
        </span>

        <button
          id={`downvote-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            votePost(post.id, -1);
          }}
          aria-label="Downvote bài viết"
          className={`p-1 rounded hover:bg-slate-200/80 transition cursor-pointer ${
            userVote === -1 ? 'text-blue-600 font-bold scale-110' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <ArrowBigDown className="w-6 h-6 fill-current" />
        </button>
      </div>

      {/* Right: Main Content */}
      <div className="flex-1 p-3.5 sm:p-4 min-w-0">
        {/* Post Meta Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Community link */}
            {community && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCommunityId(community.id);
                }}
                className="font-bold text-slate-900 hover:text-orange-600 flex items-center gap-1 transition"
              >
                <span>{community.icon}</span>
                <span>{community.name}</span>
              </button>
            )}

            <span className="text-slate-300">•</span>

            {/* Author info & Community role badge */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Đăng bởi</span>
              <span className="font-semibold text-slate-700">u/{author?.username || 'user'}</span>

              {/* Author's role in this community badge */}
              {authorRoleInComm === 'OWNER' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Owner</span>
                </span>
              )}
              {authorRoleInComm === 'MODERATOR' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Mod</span>
                </span>
              )}
              {authorRoleInComm === 'MEMBER' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>Member</span>
                </span>
              )}

              <span className="text-slate-300">•</span>
              <span className="text-slate-400">{formatDate(post.createdAt)}</span>
              {post.updatedAt && <span className="text-slate-400 text-[10px] italic">(đã chỉnh sửa)</span>}
            </div>
          </div>

          {/* Pinned indicator */}
          {post.isPinned && (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-full">
              <Pin className="w-3 h-3" />
              <span>Đã ghim</span>
            </div>
          )}
        </div>

        {/* Content or Edit Form */}
        {isEditing ? (
          <div className="space-y-2.5 my-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-lg p-2 focus:border-orange-500 focus:outline-hidden"
              placeholder="Tiêu đề bài viết"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full text-sm text-slate-800 border border-slate-300 rounded-lg p-2 focus:border-orange-500 focus:outline-hidden"
              placeholder="Nội dung bài viết"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Lưu thay đổi
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              if (onOpenDetail) onOpenDetail();
              else setActivePostId(post.id);
            }}
            className="cursor-pointer group"
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-orange-600 transition mb-1.5 leading-snug">
              {post.title}
            </h2>
            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line mb-3">
              {post.content}
            </p>
          </div>
        )}

        {/* Post Actions Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* View Comments button (Function #15, #22) */}
            <button
              id={`open-post-detail-btn-${post.id}`}
              onClick={() => {
                if (onOpenDetail) onOpenDetail();
                else setActivePostId(post.id);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{postComments.length} bình luận</span>
            </button>

            {/* Report Post button (Function #20) */}
            {currentUser && !isAuthor && (
              <button
                id={`report-post-btn-${post.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenReport) onOpenReport();
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition cursor-pointer"
                title="Báo cáo bài viết"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Báo cáo</span>
              </button>
            )}
          </div>

          {/* Author or Moderator controls */}
          <div className="flex items-center gap-1">
            {/* Pin / Unpin */}
            {canPin && (
              <button
                id={`pin-post-btn-${post.id}`}
                onClick={handleTogglePin}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  post.isPinned
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={post.isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu'}
              >
                {post.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">
                  {post.isPinned ? 'Bỏ ghim' : 'Ghim'}
                </span>
              </button>
            )}

            {/* Edit (Author only) */}
            {isAuthor && !isEditing && (
              <button
                id={`edit-post-btn-${post.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa bài viết"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Sửa</span>
              </button>
            )}

            {/* Delete (Author or Mod/Owner/Admin) */}
            {canDelete && (
              <button
                id={`delete-post-btn-${post.id}`}
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition flex items-center gap-1 cursor-pointer"
                title={isAuthor ? 'Xóa bài viết của bạn' : 'Xóa bài viết vi phạm'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Xóa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
