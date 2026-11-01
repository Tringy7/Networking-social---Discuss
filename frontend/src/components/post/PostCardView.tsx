import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Post } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import Avatar from '../ui/Avatar';
import ReportModal from './ReportModal';
import { Heart, MessageSquare, Bookmark, Share2, Flag, MoreHorizontal, Pin } from 'lucide-react';

interface PostCardProps { post: Post; showCommunity?: boolean; }
export default function PostCard({ post, showCommunity = true }: PostCardProps) {
  const navigate = useNavigate();
  const { toggleHeart, toggleSave } = usePostStore();
  const addToast = useToastStore((state) => state.addToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const reduced = useReducedMotion();
  const quiet = reduced || intensity !== 'full';
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [heartPending, setHeartPending] = useState(false);
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
  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tương tác bài viết', 'warning');
      navigate('/login');
      return;
    }
    if (heartPending) return;
    setHeartPending(true);
    try {
      await toggleHeart(post.id);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật lượt thích.', 'error');
    } finally { setHeartPending(false); }
  };

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
  const preview = expanded || post.content.length <= 180 ? post.content : `${post.content.slice(0, 180).trimEnd()}…`;
  return <>
    <article className="discussion-row" aria-labelledby={`post-title-${post.id}`}>
      <div className="discussion-byline">
        <Link to={`/user/${post.author.username}`} className="post-author-avatar" aria-label={`Hồ sơ ${post.author.displayName || post.author.username}`}>
          <Avatar src={post.author.avatarUrl} alt={post.author.displayName || post.author.username} size="md" />
        </Link>
        <div className="post-identity">
          <div className="post-community-line">
            {showCommunity ? <Link className="byline-community" to={`/community/${post.communityName}`}><Avatar src={post.communityAvatar} alt={post.communityDisplayName} size="xs" shape="rounded" /><span>{post.communityDisplayName}</span></Link> : <Link className="post-author-name" to={`/user/${post.author.username}`}>{post.author.displayName || post.author.username}</Link>}
            {post.pinned && <span className="post-pinned"><Pin size={12} />Ghim</span>}
          </div>
          <div className="post-author-line">
            <Link to={`/user/${post.author.username}`}>{showCommunity ? (post.author.displayName || post.author.username) : `@${post.author.username}`}</Link><span aria-hidden="true">·</span><time dateTime={post.createdAt} title={date.toLocaleString('vi-VN')}>{time}</time>
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
      <div className={`discussion-body ${post.mediaUrl ? 'has-media' : ''}`}>
        <div className="min-w-0">
          <h2 id={`post-title-${post.id}`} className="discussion-title"><Link to={`/post/${post.id}`}>{post.title}</Link></h2>
          <motion.p id={`post-excerpt-${post.id}`} key={expanded ? 'full' : 'preview'} initial={quiet ? false : { opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: quiet ? 0 : 0.15 }} className={`discussion-excerpt ${expanded ? '' : 'line-clamp-3'}`}>{preview}</motion.p>
          {post.content.length > 180 && <button type="button" className="discussion-expand" aria-expanded={expanded} aria-controls={`post-excerpt-${post.id}`} onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}
          {post.tags && post.tags.length > 0 && <div className="discussion-tags">{post.tags.map((tag) => <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}&type=posts`}>#{tag}</Link>)}</div>}
        </div>
        {post.mediaUrl && <Link to={`/post/${post.id}`} className="discussion-media" aria-label={`Xem ảnh: ${post.title}`}><img src={post.mediaUrl} alt={post.title} loading="lazy" /></Link>}
      </div>
      {post.codeSnippet && <details className="discussion-code"><summary>{post.codeSnippet.language} · Xem đoạn mã</summary><pre className="font-code"><code>{post.codeSnippet.code}</code></pre></details>}
      <div className="discussion-actions">
        <motion.button type="button" className="discussion-action" onClick={handleHeartClick} aria-pressed={post.isHearted} disabled={heartPending}
          aria-label={`${post.isHearted ? 'Bỏ thích' : 'Thích'} bài viết, ${post.heartCount} lượt thích`} whileTap={quiet ? undefined : { scale: 0.9 }}>
          <motion.span animate={quiet ? undefined : { scale: post.isHearted ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.25 }}><Heart className="heart-icon" /></motion.span><span className="hidden sm:inline">Thích</span><span className="tabular-nums">{post.heartCount}</span>
        </motion.button>
        <Link to={`/post/${post.id}#comments`} className="discussion-action" aria-label={`${post.commentCount} bình luận`}><MessageSquare /><span>{post.commentCount}</span><span className="hidden sm:inline">bình luận</span></Link>
        <button type="button" className="discussion-action ml-auto" onClick={handleSaveClick} aria-pressed={post.isSaved} disabled={savePending} aria-label={post.isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}><Bookmark fill={post.isSaved ? 'currentColor' : 'none'} /><span className="hidden sm:inline">{post.isSaved ? 'Đã lưu' : 'Lưu'}</span></button>
        <button type="button" className="discussion-action" onClick={handleShareClick} aria-label="Sao chép liên kết bài viết"><Share2 /><span className="hidden sm:inline">Chia sẻ</span></button>
      </div>
    </article>
    <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} contentType="POST" contentId={post.id} contentTitle={post.title} communityName={post.communityName} targetUsername={post.author.username} />
  </>;
}
