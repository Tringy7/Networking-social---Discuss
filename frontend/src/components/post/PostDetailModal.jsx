import React from 'react';
import Modal from '../common/Modal';
import VoteButtons from './VoteButtons';
import CommentSection from '../comment/CommentSection';
import RoleBadge from '../common/RoleBadge';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { permissions } from '../../utils/permissions';
import { formatTimeAgo, formatDate } from '../../utils/formatters';
import { Pin, Edit3, Trash2, Flag, PinOff, Calendar } from 'lucide-react';

export default function PostDetailModal({
  isOpen,
  onClose,
  post,
  onOpenEdit,
  onOpenReport,
  onSelectCommunity,
}) {
  const { allUsers, currentUser } = useAuth();
  const { communities, getUserCommunityRole } = useCommunity();
  const { deletePost, togglePinPost } = usePost();

  if (!post) return null;

  const author = allUsers.find(u => u.id === post.authorId) || {
    name: 'Người dùng Discuss',
    username: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  };

  const community = communities.find(c => c.id === post.communityId) || {
    name: 'Cộng đồng',
    slug: 'general',
  };

  const communityRole = getUserCommunityRole(post.communityId);
  const authorRoleInComm = getUserCommunityRole(post.communityId, post.authorId);

  const canEdit = permissions.canEditPost(currentUser, post);
  const canDelete = permissions.canDeletePost(currentUser, post, communityRole);
  const canPin = permissions.canPinPost(currentUser, communityRole);
  const canReport = permissions.canReportPost(currentUser);

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      await deletePost(post.id);
      onClose();
    }
  };

  const handleTogglePin = async () => {
    await togglePinPost(post.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`c/${community.slug}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Pinned banner if active */}
        {post.isPinned && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-xs font-bold text-indigo-700">
            <Pin className="w-4 h-4 rotate-45 text-indigo-600" />
            <span>Bài viết này đang được ghim ở đầu cộng đồng</span>
          </div>
        )}

        {/* Post Header with Author Info and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{author.name}</span>
                <span className="text-xs text-slate-400 font-mono">@{author.username}</span>
                {authorRoleInComm && <RoleBadge role={authorRoleInComm} size="xs" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {canPin && (
              <button
                onClick={handleTogglePin}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                title={post.isPinned ? 'Bỏ ghim' : 'Ghim bài'}
              >
                {post.isPinned ? <PinOff className="w-4 h-4 text-indigo-600" /> : <Pin className="w-4 h-4" />}
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit(post);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                title="Chỉnh sửa bài viết"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Xóa bài viết"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {canReport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReport(post);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                title="Báo cáo vi phạm"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Post Title & Tags */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-3">
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Full Post Content */}
        <div className="text-slate-800 leading-relaxed text-sm sm:text-base whitespace-pre-wrap font-sans bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
          {post.content}
        </div>

        {/* Vote bar */}
        <div className="flex items-center gap-3">
          <VoteButtons post={post} layout="horizontal" />
          <span className="text-xs text-slate-400">
            {post.upvotes} Upvotes • {post.downvotes} Downvotes
          </span>
        </div>

        {/* Comments section */}
        <CommentSection postId={post.id} communityId={post.communityId} />
      </div>
    </Modal>
  );
}
