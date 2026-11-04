import PostVotes from './PostVotes';
import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { Post } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';
import PostBody from './PostBody';
import { POST_INTERACTIONS_AVAILABLE } from '../../services';
import ReportModal from './ReportModal';
import { MessageSquare, Bookmark, Share2, Flag, MoreHorizontal, Pin } from 'lucide-react';

interface PostCardProps { post: Post; showCommunity?: boolean; }
export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const { toggleSave } = usePostStore();
  const addToast = useToastStore((state) => state.addToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!showMenu) return;
    const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowMenu(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [showMenu]);
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
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      addToast('Đã sao chép liên kết bài viết!', 'success');
    } catch { addToast('Không thể sao chép liên kết. Vui lòng thử lại.', 'error'); }
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
        <div ref={menuRef} className="relative">
          <button ref={menuButtonRef} className="icon-button" onClick={() => setShowMenu(!showMenu)} aria-expanded={showMenu} aria-label={`Tùy chọn bài viết ${post.title}`}><MoreHorizontal size={17} /></button>
          {showMenu && <div data-ui="popover" className="absolute right-0 top-full z-20 w-48 border p-2">
            <button className="side-link" onClick={(e) => { void handleShareClick(e); setShowMenu(false); }}><Share2 size={15} /> Sao chép liên kết</button>
            <button className="side-link" onClick={() => { setShowMenu(false); setIsReportOpen(true); }}><Flag size={15} /> Báo cáo bài viết</button>
          </div>}
        </div>
      </div>
      <div className="min-w-0">
        <h2 id={`post-title-${post.id}`} className="discussion-title"><Link to={`/post/${post.id}`}>{post.title}</Link></h2>
        <div className={`post-content-divider${expanded ? '' : ' max-h-[420px] overflow-hidden'}`}><PostBody post={post} /></div>
        {(post.content.length > 180 || (post.media?.length || 0) > 0) && <button type="button" className="discussion-expand" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}
        {!!post.tags?.length && <nav className="discussion-tags post-highlight-tags" aria-label="Thẻ bài viết">{post.tags.map((tag) => <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}&type=posts`}>#{tag}</Link>)}</nav>}
      </div>
      <div className="discussion-actions">
        <PostVotes post={post} />
        <Link to={`/post/${post.id}#comments`} className="discussion-action" aria-label={`${post.commentCount} bình luận`}><MessageSquare /><span>{post.commentCount}</span><span className="hidden sm:inline">bình luận</span></Link>
        <button type="button" className="discussion-action ml-auto" onClick={handleSaveClick} aria-pressed={post.isSaved} disabled={savePending || !POST_INTERACTIONS_AVAILABLE} title={!POST_INTERACTIONS_AVAILABLE ? "Chưa hỗ trợ lưu bài" : undefined} aria-label={post.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}><Bookmark fill={post.isSaved ? 'currentColor' : 'none'} /><span className="hidden sm:inline">{post.isSaved ? 'Đã lưu' : 'Lưu'}</span></button>
        <button type="button" className="discussion-action" onClick={handleShareClick} aria-label="Sao chép liên kết bài viết"><Share2 /><span className="hidden sm:inline">Chia sẻ</span></button>
      </div>
    </article>
    <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} contentType="POST" contentId={post.id} contentTitle={post.title} communityName={post.communityName} targetUsername={post.author.username} />
  </>;
}
