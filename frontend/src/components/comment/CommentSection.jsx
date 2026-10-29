import React, { useState } from 'react';
import CommentItem from './CommentItem';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';

export default function CommentSection({ postId, communityId }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { getPostComments, addComment } = usePost();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const postComments = getPostComments(postId);
  // Root comments have parentId === null
  const rootComments = postComments.filter(c => !c.parentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment({
        postId,
        parentId: null,
        content: commentText.trim(),
      });
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Bình luận ({postComments.length})</span>
        </h3>
      </div>

      {/* Write comment input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-2.5 items-start">
          <img
            src={currentUser?.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-1"
          />
          <div className="flex-1 space-y-2">
            <textarea
              rows={2}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Chia sẻ quan điểm hoặc đặt câu hỏi của bạn..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi bình luận</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Vui lòng đăng nhập để tham gia thảo luận và gửi bình luận.</span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có bình luận nào. Hãy là người đầu tiên nêu ý kiến!
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={postComments}
              communityId={communityId}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  );
}
