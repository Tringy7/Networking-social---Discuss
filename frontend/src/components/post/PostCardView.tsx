import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Post } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import ReportModal from './ReportModal';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  MoreHorizontal,
  Pin,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  showCommunity?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, showCommunity = true }) => {
  const navigate = useNavigate();
  const { toggleHeart, toggleSave } = usePostStore();
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tương tác bài viết', 'warning');
      navigate('/login');
      return;
    }
    try {
      await toggleHeart(post.id);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật lượt thích.', 'error');
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để lưu bài viết', 'warning');
      navigate('/login');
      return;
    }
    try {
      await toggleSave(post.id);
      addToast(post.isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào mục Yêu thích', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể lưu bài viết.', 'error');
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`);
    addToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm!', 'success');
  };

  // Format date readable in Vietnamese
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <>
      <article
        onClick={() => navigate(`/post/${post.id}`)}
        className="group relative bg-[#161922] hover:bg-[#1C202B] border border-[#262C3A] hover:border-[#353D50] rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md text-left space-y-3"
      >
        {/* Header: Community info + Author info */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {post.pinned && (
              <span className="flex items-center gap-1 font-bold text-[var(--color-orange)] text-[11px] bg-[var(--color-orange-soft)] px-2 py-0.5 rounded-full">
                <Pin className="w-3 h-3" />
                <span>Ghim</span>
              </span>
            )}

            {showCommunity && (
              <Link
                to={`/c/${post.communityName}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 font-bold text-[#F1F3F7] hover:text-[var(--color-orange)] transition-colors"
              >
                <Avatar src={post.communityAvatar} alt={post.communityDisplayName} size="xs" shape="rounded" />
                <span>{post.communityDisplayName}</span>
              </Link>
            )}

            <span className="text-[#6C7482]">·</span>

            {/* Author */}
            <Link
              to={`/u/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[#959DAA] hover:text-[#F1F3F7] transition-colors flex items-center gap-1"
            >
              <span>bởi @{post.author.username}</span>
              {post.author.role === 'OWNER' && <Badge role="OWNER" size="sm" />}
              {post.author.role === 'MODERATOR' && <Badge role="MODERATOR" size="sm" />}
            </Link>

            <span className="text-[#70747C]">·</span>
            <span className="text-[#70747C]">{timeAgo(post.createdAt)}</span>
          </div>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-lg text-[#70747C] hover:text-[#F5F5F5] hover:bg-[#222426] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-40 bg-[#222426] border border-[#303235] rounded-xl shadow-xl p-1.5 z-20 space-y-0.5 text-xs"
              >
                <button
                  onClick={(e) => {
                    handleShareClick(e);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#292B2E] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ link</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsReportOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Báo cáo bài viết</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Title */}
        <h2 className="text-base sm:text-lg font-bold text-[#F5F5F5] group-hover:text-white leading-snug">
          {post.title}
        </h2>

        {/* Content Snippet */}
        <p className="text-xs sm:text-sm text-[#9A9DA3] line-clamp-3 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Code Snippet Box */}
        {post.codeSnippet && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-xs text-[var(--color-code)] overflow-x-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#303235] text-[10px] text-[#70747C] uppercase">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#FF5700]" />
                {post.codeSnippet.language}
              </span>
            </div>
            <pre className="text-[var(--text-secondary)]">
              <code>{post.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* Media Image Preview */}
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden border border-[#303235] max-h-96 bg-[var(--bg-elevated)]">
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tag)}&type=posts`);
                }}
                className="text-[11px] font-medium text-[var(--color-orange)] bg-[var(--color-orange-soft)] hover:bg-[var(--color-orange-border)] px-2 py-0.5 rounded-md transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions: Heart, Comments, Save, Share */}
        <div className="flex items-center justify-between pt-2 border-t border-[#262C3A]/60 text-xs">
          <div className="flex items-center gap-2">
            {/* Heart Reaction */}
            <button
              onClick={handleHeartClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                post.isHearted
                  ? 'bg-[var(--color-orange-soft)] border-[var(--color-orange-border)] text-[var(--color-orange)] font-bold'
                  : 'bg-[#1E232F] border-[#262C3A] text-[#959DAA] hover:text-[var(--color-orange)] hover:border-[var(--color-orange-border)]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                  post.isHearted ? 'fill-[var(--color-orange)] text-[var(--color-orange)]' : ''
                }`}
              />
              <span className="tabular-nums">{post.heartCount}</span>
            </button>

            {/* Comment Count */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${post.id}#comments`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E232F] border border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7] hover:border-[#353D50] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="tabular-nums">{post.commentCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Save */}
            <button
              onClick={handleSaveClick}
              className={`p-2 rounded-full transition-colors ${
                post.isSaved
                  ? 'text-[var(--color-orange)] bg-[var(--color-orange-soft)]'
                  : 'text-[#6C7482] hover:text-[#F1F3F7] hover:bg-[#1E232F]'
              }`}
              title={post.isSaved ? 'Bỏ lưu' : 'Lưu bài viết'}
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[var(--color-orange)]' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShareClick}
              className="p-2 rounded-full text-[#6C7482] hover:text-[#F1F3F7] hover:bg-[#1E232F] transition-colors"
              title="Sao chép link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

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
    </>
  );
};

export default PostCard;
