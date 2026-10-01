import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  CornerDownRight,
  Edit3,
  Trash2,
  ShieldAlert,
  Send,
  Flag,
  Pin,
  PinOff,
  Crown,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const PostDetailModal = ({ postId, onClose, onOpenReport }) => {
  const {
    posts,
    users,
    communities,
    comments,
    currentUser,
    votePost,
    getPostScore,
    getUserVote,
    getUserCommunityRole,
    togglePinPost,
    deletePost,
    addComment,
    updateComment,
    deleteComment,
  } = useApp();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const post = posts.find((p) => p.id === postId);
  if (!post || post.isDeleted) return null;

  const author = users.find((u) => u.id === post.authorId);
  const community = communities.find((c) => c.id === post.communityId);
  const score = getPostScore(post.id);
  const userVote = getUserVote(post.id);

  const authorRoleInComm = getUserCommunityRole(post.communityId, post.authorId);
  const viewerRole = currentUser ? getUserCommunityRole(post.communityId, currentUser.id) : null;
  const isGlobalAdmin = currentUser?.globalRole === 'ADMIN';
  const isAuthor = currentUser?.id === post.authorId;
  const canPin = viewerRole === 'MODERATOR' || viewerRole === 'OWNER' || isGlobalAdmin;
  const canDeletePost = isAuthor || viewerRole === 'MODERATOR' || viewerRole === 'OWNER' || isGlobalAdmin;

  // Build comment tree
  const postComments = comments.filter((c) => c.postId === postId);
  const topLevelComments = postComments.filter((c) => !c.parentId);

  const getChildComments = (parentId) => {
    return postComments.filter((c) => c.parentId === parentId);
  };

  const handleCreateTopLevelComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const res = addComment(postId, newCommentText, null);
    if (res.success) {
      setNewCommentText('');
    } else {
      alert(res.message);
    }
  };

  const handleSendReply = (parentId) => {
    if (!replyText.trim()) return;
    const res = addComment(postId, replyText, parentId);
    if (res.success) {
      setReplyText('');
      setReplyingToId(null);
    } else {
      alert(res.message);
    }
  };

  const handleSaveCommentEdit = (commentId) => {
    if (!editCommentText.trim()) return;
    const res = updateComment(commentId, editCommentText);
    if (res.success) {
      setEditingCommentId(null);
      setEditCommentText('');
    } else {
      alert(res.message);
    }
  };

  const formatDate = (dateStr) => {
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

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }) => {
    const commentAuthor = users.find((u) => u.id === comment.authorId);
    const commentAuthorRole = getUserCommunityRole(post.communityId, comment.authorId);
    const isCommentAuthor = currentUser?.id === comment.authorId;
    const isModOrAdmin = viewerRole === 'MODERATOR' || viewerRole === 'OWNER' || isGlobalAdmin;
    const canDeleteThisComment = isCommentAuthor || isModOrAdmin;
    const children = getChildComments(comment.id);

    return (
      <div className={`text-xs ${depth > 0 ? 'mt-3 pl-3 sm:pl-4 border-l-2 border-slate-200' : 'mt-4'}`}>
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
          {/* Author info */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <img
                src={commentAuthor?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={commentAuthor?.displayName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-semibold text-slate-800">u/{commentAuthor?.username}</span>

              {commentAuthorRole === 'OWNER' && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Owner</span>
                </span>
              )}
              {commentAuthorRole === 'MODERATOR' && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-sky-100 text-sky-800 rounded text-[9px] font-bold">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Mod</span>
                </span>
              )}
              {commentAuthorRole === 'MEMBER' && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-slate-200 text-slate-600 rounded text-[9px]">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>Member</span>
                </span>
              )}

              <span className="text-slate-300">•</span>
              <span className="text-slate-400 text-[10px]">{formatDate(comment.createdAt)}</span>
              {comment.updatedAt && <span className="text-slate-400 text-[9px] italic">(đã sửa)</span>}
            </div>

            {comment.isDeleted && (
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Đã xóa ({comment.deletedBy || 'MOD'})</span>
              </span>
            )}
          </div>

          {/* Comment Body */}
          {comment.isDeleted ? (
            <p className="text-slate-400 italic py-1">
              [Bình luận này đã bị xóa bởi {comment.deletedBy === 'AUTHOR' ? 'tác giả' : 'Ban điều hành'}]
            </p>
          ) : editingCommentId === comment.id ? (
            <div className="space-y-2 my-1">
              <textarea
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                rows={2}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:border-orange-500 focus:outline-hidden"
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-[11px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleSaveCommentEdit(comment.id)}
                  className="px-2.5 py-1 bg-orange-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed my-1">
              {comment.content}
            </p>
          )}

          {/* Comment actions (Reply, Edit, Delete, Mod delete) */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 mt-1">
              {currentUser && (
                <button
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    setReplyText('');
                  }}
                  className="hover:text-orange-600 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>Trả lời</span>
                </button>
              )}

              {isCommentAuthor && editingCommentId !== comment.id && (
                <button
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditCommentText(comment.content);
                  }}
                  className="hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              )}

              {canDeleteThisComment && (
                <button
                  onClick={() => {
                    const msg = isCommentAuthor
                      ? 'Xóa bình luận của bạn?'
                      : 'Xóa bình luận vi phạm này với quyền Quản trị / Điều hành?';
                    if (confirm(msg)) deleteComment(comment.id);
                  }}
                  className="hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  title={isCommentAuthor ? 'Xóa bình luận của bạn' : 'Xóa bình luận vi phạm'}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isCommentAuthor ? 'Xóa' : 'Xóa vi phạm'}</span>
                </button>
              )}
            </div>
          )}

          {/* Nested Reply Box */}
          {replyingToId === comment.id && (
            <div className="mt-2.5 pt-2 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Trả lời u/${commentAuthor?.username}...`}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-orange-500 focus:outline-hidden"
                  autoFocus
                />
                <button
                  onClick={() => handleSendReply(comment.id)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" /> Gửi
                </button>
                <button
                  onClick={() => setReplyingToId(null)}
                  className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recursive Child Comments */}
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map((child) => (
              <CommentNode key={child.id} comment={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            {community && (
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <span>{community.icon}</span>
                <span>{community.name}</span>
              </span>
            )}
            <span className="text-slate-300">•</span>
            <span>Chi tiết bài viết</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Post Header & Votes */}
          <div className="flex gap-3 sm:gap-4">
            {/* Vote Bar */}
            <div className="flex flex-col items-center shrink-0">
              <button
                onClick={() => votePost(post.id, 1)}
                className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                  userVote === 1 ? 'text-orange-600 scale-110 font-bold' : 'text-slate-400 hover:text-orange-600'
                }`}
              >
                <ArrowBigUp className="w-7 h-7 fill-current" />
              </button>
              <span className={`text-sm font-bold my-0.5 ${userVote === 1 ? 'text-orange-600' : userVote === -1 ? 'text-blue-600' : 'text-slate-700'}`}>
                {score}
              </span>
              <button
                onClick={() => votePost(post.id, -1)}
                className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                  userVote === -1 ? 'text-blue-600 scale-110 font-bold' : 'text-slate-400 hover:text-blue-600'
                }`}
              >
                <ArrowBigDown className="w-7 h-7 fill-current" />
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
                <img
                  src={author?.avatar}
                  alt={author?.displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-semibold text-slate-800">u/{author?.username}</span>
                {authorRoleInComm === 'OWNER' && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                    Owner
                  </span>
                )}
                {authorRoleInComm === 'MODERATOR' && (
                  <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[10px] font-bold">
                    Mod
                  </span>
                )}
                {authorRoleInComm === 'MEMBER' && (
                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                    Member
                  </span>
                )}
                <span className="text-slate-300">•</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.isPinned && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    📌 Đã ghim
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mb-3">
                {post.title}
              </h1>

              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                {post.content}
              </div>

              {/* Action buttons on post */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                {currentUser && !isAuthor && (
                  <button
                    onClick={() => {
                      if (onOpenReport) onOpenReport(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-red-600 transition cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Báo cáo bài viết</span>
                  </button>
                )}

                {canPin && (
                  <button
                    onClick={() => togglePinPost(post.id)}
                    className="flex items-center gap-1 hover:text-orange-600 transition cursor-pointer"
                  >
                    {post.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    <span>{post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}</span>
                  </button>
                )}

                {canDeletePost && (
                  <button
                    onClick={() => {
                      if (confirm('Xóa bài viết này?')) {
                        deletePost(post.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1 hover:text-red-600 transition ml-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bài viết</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-600" />
              <span>Bình luận ({postComments.filter((c) => !c.isDeleted).length})</span>
            </h3>

            {/* Write Top-Level Comment */}
            {currentUser ? (
              <form onSubmit={handleCreateTopLevelComment} className="mb-6 space-y-2">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={`Viết bình luận với tư cách u/${currentUser.username}...`}
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Đăng bình luận</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center mb-6">
                Vui lòng đăng nhập để viết hoặc trả lời bình luận.
              </div>
            )}

            {/* Threaded Comment Tree */}
            {topLevelComments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
              </div>
            ) : (
              <div className="space-y-4">
                {topLevelComments.map((comment) => (
                  <CommentNode key={comment.id} comment={comment} depth={0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
