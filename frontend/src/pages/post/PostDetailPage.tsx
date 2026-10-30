import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';
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
      return <div role="status" className="py-12 text-center text-sm text-[var(--text-secondary)]">Đang tải bài viết...</div>;
    }
    return (
      <div className="py-12 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Không tìm thấy bài viết
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Bài viết có thể đã bị xóa hoặc không còn khả dụng.
        </p>
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
          isNested ? 'ml-6 sm:ml-8 pl-3' : 'pt-4'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Avatar src={cmt.author.avatarUrl} alt={cmt.author.displayName} size="xs" />
            <Link
              to={`/user/${cmt.author.username}`}
              className="font-bold text-[var(--text-primary)] hover:text-[var(--color-orange)] transition-colors"
            >
              {cmt.author.displayName}
            </Link>
            <span className="text-[var(--text-muted)]">@{cmt.author.username}</span>
            {cmt.author.isAuthor && (
              <span className="text-xs font-bold text-[var(--color-orange)] bg-[var(--color-orange-soft)] px-1.5 py-0.5 rounded">
                Tác giả
              </span>
            )}
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">vừa xong</span>
          </div>

          {cmt.replies && cmt.replies.length > 0 && (
            <button
              aria-label={isCollapsed ? 'Mở chuỗi bình luận' : 'Thu gọn chuỗi bình luận'}
              aria-expanded={!isCollapsed}
              onClick={() => toggleThread(cmt.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 flex items-center gap-1 text-xs"
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
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pl-8">
              {cmt.content}
            </p>

            {/* Comment Reactions & Reply Button */}
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pl-8">
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
                className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors font-medium"
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
                  aria-label={`Trả lời @${cmt.author.username}`}
                  placeholder={`Trả lời @${cmt.author.username}...`}
                  className="flex-1 bg-[var(--bg-main)] border border-[var(--bg-elevated)] focus:border-[var(--color-orange)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
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
    <div className="post-reading-page space-y-5 text-left pb-8">
      {!POSTS_AVAILABLE && (
        <div role="status" className="feed-notice text-xs text-[var(--text-primary)]">
          Đang xem bài viết mẫu; thao tác chỉ được lưu trong phiên hiện tại.
        </div>
      )}
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại</span>
      </button>

      {/* Main Post Content Card */}
      <article className="post-reading-body space-y-5">
        {/* Community & Author Header */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <Link to={`/community/${post.communityName}`}>
              <Avatar src={post.communityAvatar} alt={post.communityDisplayName} size="md" shape="rounded" />
            </Link>
            <div>
              <Link
                to={`/community/${post.communityName}`}
                className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--color-orange-ink)] transition-colors block"
              >
                {post.communityDisplayName}
              </Link>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Link to={`/user/${post.author.username}`} className="hover:text-[var(--text-secondary)]">
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
                className="p-2 rounded-xl text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                title="Xóa bài viết"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--bg-elevated)] transition-colors"
              title="Báo cáo vi phạm"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="editorial-title text-2xl sm:text-[32px] text-[var(--text-primary)] leading-snug">
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
        <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-7 whitespace-pre-line space-y-4">
          {post.content}
        </div>

        {/* Code Snippet Box */}
        {post.codeSnippet && (
          <div data-ui="code-sample" className="bg-[var(--bg-main)] border border-[var(--bg-elevated)] rounded-xl p-4 font-code text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-2 mb-2 text-xs text-[var(--text-muted)]">
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
          <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--bg-elevated)] bg-[var(--bg-main)]">
            <img src={post.mediaUrl} alt={post.title} className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-3 text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleHeartClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-[background-color,border-color,color,opacity,transform] ${
                post.isHearted
                  ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange-border)] text-[var(--color-orange)] font-bold'
                  : 'bg-[var(--bg-elevated)] border-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--color-orange)]'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isHearted ? 'fill-[var(--color-orange)]' : ''}`} />
              <span className="tabular-nums">{post.heartCount} Thích</span>
            </button>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] text-[var(--text-secondary)]">
              <MessageSquare className="w-4 h-4" />
              <span className="tabular-nums">{post.commentCount} Bình luận</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveClick}
              className={`p-2.5 rounded-full border border-[var(--bg-elevated)] transition-colors ${
                post.isSaved
                  ? 'text-[var(--color-orange)] bg-[var(--color-orange-soft)] border-[var(--color-orange-border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title="Lưu bài viết"
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[var(--color-orange)]' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-full border border-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              title="Sao chép liên kết"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      {/* COMMENTS SECTION */}
      <section id="comments" className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-card)] p-4 sm:p-7 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-orange)]" />
          <span>Bình luận thảo luận ({postComments.length})</span>
        </h2>

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
                aria-label="Nội dung bình luận"
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? 'Bạn nghĩ gì về chủ đề này? Hãy chia sẻ ý kiến văn minh...'
                    : 'Đăng nhập để tham gia bình luận...'
                }
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--color-orange)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
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
