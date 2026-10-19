import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { permissions } from '../../utils/permissions';
import { formatTimeAgo } from '../../utils/formatters';
import RoleBadge from '../common/RoleBadge';
import { Reply, Edit3, Trash2, Send, CornerDownRight, Check, X } from 'lucide-react';

export default function CommentItem({
  comment,
  allComments,
  communityId,
  level = 0,
}) {
  const { allUsers, currentUser } = useAuth();
  const { getUserCommunityRole } = useCommunity();
  const { addComment, editComment, deleteComment } = usePost();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const author = allUsers.find(u => u.id === comment.authorId) || {
    name: 'Người dùng',
    username: comment.authorId,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  };

  const communityRole = getUserCommunityRole(communityId);
  const authorRoleInComm = getUserCommunityRole(communityId, comment.authorId);

  const canEdit = permissions.canEditComment(currentUser, comment);
  const canDelete = permissions.canDeleteComment(currentUser, comment, communityRole);
  const canReply = permissions.canComment(currentUser);

  // Find direct child replies
  const replies = allComments.filter(c => c.parentId === comment.id);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment({
      postId: comment.postId,
      parentId: comment.id,
      content: replyText.trim(),
    });
    setReplyText('');
    setIsReplying(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText.trim());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      await deleteComment(comment.id, comment.postId, communityId);
    }
  };

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-4 sm:ml-8 border-l-2 border-slate-100 pl-3' : ''}`}>
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100/90 text-xs">
        {/* Comment Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <span className="font-bold text-slate-800">{author.name}</span>
            <span className="text-[11px] text-slate-400">@{author.username}</span>
            {authorRoleInComm && <RoleBadge role={authorRoleInComm} size="xs" />}
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 text-[11px]">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          {/* Action options */}
          <div className="flex items-center gap-1.5 text-slate-400">
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="hover:text-indigo-600 p-1 rounded transition cursor-pointer"
                title="Chỉnh sửa bình luận"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="hover:text-rose-600 p-1 rounded transition cursor-pointer"
                title="Xóa bình luận"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment Content / Edit Form */}
        {isEditing ? (
          <div className="space-y-2 pt-1">
            <textarea
              rows={2}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-700 leading-relaxed text-xs sm:text-[13px] whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Reply trigger button */}
        {!isEditing && canReply && (
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            >
              <Reply className="w-3 h-3" />
              <span>Trả lời</span>
            </button>
          </div>
        )}
      </div>

      {/* Reply input form */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="ml-4 flex gap-2 items-center animate-in fade-in">
          <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            required
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Trả lời @${author.username}...`}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsReplying(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              communityId={communityId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
