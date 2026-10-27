import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Comment } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ReportModal from '../../components/post/ReportModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  ArrowLeft,
  Send,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Code2,
} from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const { posts, comments, loadPost, loadComments, toggleHeart, toggleSave, deletePost, addComment, toggleCommentHeart } =
    usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});
  const [isPostLoading, setIsPostLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    setIsPostLoading(true);
    Promise.all([loadPost(postId), loadComments(postId)])
      .catch((error: unknown) => {
        if (active) {
          addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error');
        }
      })
      .finally(() => {
        if (active) setIsPostLoading(false);
      });
    return () => {
      active = false;
    };
  }, [addToast, loadComments, loadPost, postId]);

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    if (isPostLoading) {
      return <div className="py-24 text-center text-sm text-[#9A9DA3]">Đang tải bài viết...</div>;
    }
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#F5F5F5]">Không tìm thấy bài viết</h2>
        <p className="text-xs text-[#9A9DA3]">Bài viết có thể đã bị xóa hoặc không còn khả dụng.</p>
        <Link to="/">
          <Button variant="primary" size="sm">
            Về trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  const postComments = comments[post.id] || [];

  const handleHeartClick = async () => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để thích bài viết', 'warning');
      navigate('/login');
      return;
    }
    try {
      await toggleHeart(post.id);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật lượt thích.', 'error');
    }
  };

  const handleSaveClick = async () => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để lưu bài viết', 'warning');
      navigate('/login');
      return;
    }
    try {
      await toggleSave(post.id);
      addToast(post.isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu bài viết.', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Đã sao chép liên kết bài viết!', 'success');
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(post.id);
      addToast('Đã xóa bài viết thành công!', 'info');
      navigate('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa bài viết.', 'error');
    }
  };

  const handleAddTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để bình luận', 'warning');
      navigate('/login');
      return;
    }
    if (!commentInput.trim()) return;

    try {
      await addComment(post.id, commentInput.trim());
      setCommentInput('');
      addToast('Đã đăng bình luận!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể đăng bình luận.', 'error');
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để trả lời', 'warning');
      navigate('/login');
      return;
    }
    if (!replyInput.trim()) return;

    try {
      await addComment(post.id, replyInput.trim(), parentCommentId);
      setReplyInput('');
      setReplyingTo(null);
      addToast('Đã đăng câu trả lời!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể gửi câu trả lời.', 'error');
    }
  };

  const handleCommentHeart = async (commentId: string) => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để thích bình luận.', 'warning');
      navigate('/login');
      return;
    }
    try {
      await toggleCommentHeart(post.id, commentId);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật lượt thích.', 'error');
    }
  };

  const toggleThread = (commentId: string) => {
    setCollapsedThreads((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const renderComment = (cmt: Comment, isNested = false) => {
    const isCollapsed = collapsedThreads[cmt.id];

    return (
      <div
        key={cmt.id}
        className={`text-left space-y-2.5 ${
          isNested ? 'ml-6 sm:ml-8 pl-3 border-l-2 border-[#262C3A]' : 'pt-4 border-t border-[#262C3A]/60'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Avatar src={cmt.author.avatarUrl} alt={cmt.author.displayName} size="xs" />
            <Link
              to={`/u/${cmt.author.username}`}
              className="font-bold text-[#F5F5F5] hover:text-[var(--color-orange)] transition-colors"
            >
              {cmt.author.displayName}
            </Link>
            <span className="text-[#70747C]">@{cmt.author.username}</span>
            {cmt.author.isAuthor && (
              <span className="text-[10px] font-bold text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-1.5 py-0.5 rounded">
                Tác giả
              </span>
            )}
            <span className="text-[#70747C]">·</span>
            <span className="text-[#70747C]">vừa xong</span>
          </div>

          {cmt.replies && cmt.replies.length > 0 && (
            <button
              onClick={() => toggleThread(cmt.id)}
              className="text-[#70747C] hover:text-[#F5F5F5] p-1 flex items-center gap-1 text-[11px]"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Mở rộng ({cmt.replies.length})</span>
                </>
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed pl-8">
              {cmt.content}
            </p>

            {/* Comment Reactions & Reply Button */}
            <div className="flex items-center gap-4 text-xs text-[#70747C] pl-8">
              <button
                onClick={() => void handleCommentHeart(cmt.id)}
                className={`flex items-center gap-1 hover:text-[var(--color-orange)] transition-colors ${
                  cmt.isHearted ? 'text-[var(--color-orange)] font-bold' : ''
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${cmt.isHearted ? 'fill-[var(--color-orange)]' : ''}`} />
                <span className="tabular-nums">{cmt.heartCount}</span>
              </button>

              <button
                onClick={() => setReplyingTo(replyingTo === cmt.id ? null : cmt.id)}
                className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors font-medium"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Trả lời</span>
              </button>
            </div>

            {/* Inline reply composer */}
            {replyingTo === cmt.id && (
              <div className="pl-8 pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={`Trả lời @${cmt.author.username}...`}
                  className="flex-1 bg-[#101218] border border-[#262C3A] focus:border-[var(--color-orange)] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
                  autoFocus
                />
                <Button variant="primary" size="sm" onClick={() => handleAddReply(cmt.id)}>
                  Gửi
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  Hủy
                </Button>
              </div>
            )}

            {/* Nested replies recursive rendering */}
            {cmt.replies && cmt.replies.length > 0 && (
              <div className="space-y-3 pt-2">
                {cmt.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const isPostOwner = user?.id === post.author.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại</span>
      </button>

      {/* Main Post Content Card */}
      <article className="bg-[#161922] border border-[#262C3A] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        {/* Community & Author Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#262C3A] pb-4">
          <div className="flex items-center gap-3">
            <Link to={`/c/${post.communityName}`}>
              <Avatar src={post.communityAvatar} alt={post.communityDisplayName} size="md" shape="rounded" />
            </Link>
            <div>
              <Link
                to={`/c/${post.communityName}`}
                className="text-xs font-bold text-[#F5F5F5] hover:text-[var(--color-orange)] transition-colors block"
              >
                {post.communityDisplayName}
              </Link>
              <div className="text-[11px] text-[#70747C] flex items-center gap-1.5">
                <Link to={`/u/${post.author.username}`} className="hover:text-[#9A9DA3]">
                  @{post.author.username}
                </Link>
                {post.author.role === 'OWNER' && <Badge role="OWNER" size="sm" />}
                {post.author.role === 'MODERATOR' && <Badge role="MODERATOR" size="sm" />}
                <span>·</span>
                <span>hôm nay</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPostOwner && (
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                title="Xóa bài viết"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 rounded-xl text-[#70747C] hover:text-[#EF4444] hover:bg-[#1E232F] transition-colors"
              title="Báo cáo vi phạm"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-[#F5F5F5] leading-snug">
          {post.title}
        </h1>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-2.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Full Text Content */}
        <div className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line space-y-4">
          {post.content}
        </div>

        {/* Code Snippet Box */}
        {post.codeSnippet && (
          <div className="bg-[#101218] border border-[#262C3A] rounded-2xl p-4 font-mono text-xs overflow-x-auto shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262C3A] text-[11px] text-[#70747C] uppercase">
              <span className="flex items-center gap-1.5 text-[var(--color-orange)]">
                <Code2 className="w-4 h-4" />
                {post.codeSnippet.language} snippet
              </span>
              <span>UTF-8</span>
            </div>
            <pre className="text-emerald-400">
              <code>{post.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* Image Preview */}
        {post.mediaUrl && (
          <div className="rounded-2xl overflow-hidden border border-[#262C3A] bg-[#101218]">
            <img src={post.mediaUrl} alt={post.title} className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#262C3A] text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleHeartClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                post.isHearted
                  ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange-border)] text-[var(--color-orange)] font-bold'
                  : 'bg-[#1E232F] border-[#262C3A] text-[#9A9DA3] hover:text-[var(--color-orange)]'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isHearted ? 'fill-[var(--color-orange)]' : ''}`} />
              <span className="tabular-nums">{post.heartCount} Thích</span>
            </button>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E232F] border border-[#262C3A] text-[#9A9DA3]">
              <MessageSquare className="w-4 h-4" />
              <span className="tabular-nums">{post.commentCount} Bình luận</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveClick}
              className={`p-2.5 rounded-full border border-[#262C3A] transition-colors ${
                post.isSaved
                  ? 'text-[var(--color-orange)] bg-[var(--color-orange-soft)] border-[var(--color-orange-border)]'
                  : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#1E232F]'
              }`}
              title="Lưu bài viết"
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[var(--color-orange)]' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-full border border-[#262C3A] text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#1E232F] transition-colors"
              title="Sao chép liên kết"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      {/* COMMENTS SECTION */}
      <section id="comments" className="bg-[#161922] border border-[#262C3A] rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-orange)]" />
          <span>Bình luận thảo luận ({postComments.length})</span>
        </h3>

        {/* Comment Composer */}
        <form onSubmit={handleAddTopComment} className="space-y-3">
          <div className="flex gap-3">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.displayName || 'Guest'}
              size="sm"
            />
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? 'Bạn nghĩ gì về chủ đề này? Hãy chia sẻ ý kiến văn minh...'
                    : 'Đăng nhập để tham gia bình luận...'
                }
                className="w-full bg-[#101218] border border-[#262C3A] focus:border-[var(--color-orange)] rounded-2xl p-3 text-xs sm:text-sm text-[#F5F5F5] placeholder-[#70747C] outline-none transition-colors"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                  disabled={!commentInput.trim()}
                >
                  Gửi bình luận
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-4 pt-2">
          {postComments.map((cmt) => renderComment(cmt))}

          {postComments.length === 0 && (
            <div className="py-12 text-center text-xs text-[#70747C]">
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!
            </div>
          )}
        </div>
      </section>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contentType="POST"
        contentId={post.id}
        contentTitle={post.title}
        communityName={post.communityName}
        targetUsername={post.author.username}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletePost}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        confirmLabel="Xóa vĩnh viễn"
        variant="danger"
      />
    </div>
  );
};

export default PostDetailPage;
