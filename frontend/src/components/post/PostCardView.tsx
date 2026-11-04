import { postPath } from '../../utils/postPath';
import PostVotes from './PostVotes';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Post } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';
import PostBody from './PostBody';
import { POST_INTERACTIONS_AVAILABLE } from '../../services';
import ReportModal from './ReportModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import PostActionsMenu from './PostActionsMenu';
import { MessageSquare, Bookmark, Share2, Pin } from 'lucide-react';

interface PostCardProps { post: Post; showCommunity?: boolean; }
export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const { toggleSave, openEditModal, deletePost } = usePostStore();
  const addToast = useToastStore((state) => state.addToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để lưu bài viết', 'warning');
      navigate('/login');
      return;
    }
    if (savePending) return;
    setSavePending(true);
    try {
      await toggleSave(post.id);
      addToast(post.isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào mục Yêu thích', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu bài viết.', 'error');
    } finally { setSavePending(false); }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${postPath(post)}`);
      addToast('Đã sao chép liên kết bài viết!', 'success');
    } catch { addToast('Không thể sao chép liên kết. Vui lòng thử lại.', 'error'); }
  };

  const handleDelete = async () => {
    if (deletePending) return;
    setDeletePending(true);
    try {
      await deletePost(post.id);
      setIsDeleteOpen(false);
      addToast('Đã xóa bài viết thành công!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa bài viết.', 'error');
    } finally { setDeletePending(false); }
  };

  const date = new Date(post.createdAt);
  const elapsedHours = Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000));
  const time = Number.isNaN(date.getTime()) ? '' : elapsedHours < 1 ? 'Vừa xong' : elapsedHours < 24 ? `${elapsedHours} giờ trước` : date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });

  return <>
    <article className="discussion-row" aria-labelledby={`post-title-${post.id}`}>
      <div className="discussion-byline">
        <Link to={`/c/${post.communityName}`} className="post-author-avatar" aria-label={`Cộng đồng c/${post.communityName}`}>
          <Avatar src={post.communityAvatar} alt={post.communityDisplayName || post.communityName} size="sm" />
        </Link>
        <div className="post-identity">
          <div className="post-community-line">
            <Link className="byline-community" to={`/c/${post.communityName}`}><span>c/{post.communityName}</span></Link>
            <span className="post-byline-time"><span aria-hidden="true">·</span> <time dateTime={post.createdAt} title={date.toLocaleString('vi-VN')}>{time}</time></span>
            {post.pinned && <span className="post-pinned"><Pin size={12} />Ghim</span>}
          </div>
          <div className="post-author-line">
            <Link to={`/u/${post.author.username}`}>u/{post.author.username}</Link>
            {(post.author.role === 'OWNER' || post.author.role === 'MODERATOR') && <span className="byline-role">{post.author.role === 'OWNER' ? 'Chủ cộng đồng' : 'Kiểm duyệt'}</span>}
          </div>
        </div>
        <PostActionsMenu post={post} onEdit={() => openEditModal(post)} onDelete={() => setIsDeleteOpen(true)}
          onReport={() => setIsReportOpen(true)} onShare={handleShareClick} />
      </div>
      <div className="min-w-0">
        <h2 id={`post-title-${post.id}`} className="discussion-title"><Link to={postPath(post)}>{post.title}</Link></h2>
        <div className={`post-content-divider${expanded ? '' : ' max-h-[420px] overflow-hidden'}`}><PostBody post={post} /></div>
        {(post.content.length > 180 || (post.media?.length || 0) > 0) && <button type="button" className="discussion-expand" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}
      </div>
      <div className="discussion-actions">
        <PostVotes post={post} />
        <Link to={`${postPath(post)}#comments`} className="discussion-action" aria-label={`${post.commentCount} bình luận`}><MessageSquare /><span>{post.commentCount}</span><span className="hidden sm:inline">bình luận</span></Link>
        <button type="button" className="discussion-action ml-auto" onClick={handleSaveClick} aria-pressed={post.isSaved} disabled={savePending || !POST_INTERACTIONS_AVAILABLE} title={!POST_INTERACTIONS_AVAILABLE ? "Chưa hỗ trợ lưu bài" : undefined} aria-label={post.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}><Bookmark fill={post.isSaved ? 'currentColor' : 'none'} /><span className="hidden sm:inline">{post.isSaved ? 'Đã lưu' : 'Lưu'}</span></button>
        <button type="button" className="discussion-action" onClick={handleShareClick} aria-label="Sao chép liên kết bài viết"><Share2 /><span className="hidden sm:inline">Chia sẻ</span></button>
      </div>
    </article>
    <ConfirmDialog isOpen={isDeleteOpen} onClose={() => { if (!deletePending) setIsDeleteOpen(false); }}
      onConfirm={handleDelete} title="Xóa bài viết"
      message="Bạn có chắc chắn muốn xóa bài viết này không? Bạn có thể xem lại và khôi phục trong Cài đặt → Thùng rác."
      confirmLabel="Xóa bài viết" variant="danger" isLoading={deletePending} />
    <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} contentType="POST" contentId={post.id} contentTitle={post.title} communityName={post.communityName} targetUsername={post.author.username} />
  </>;
}
