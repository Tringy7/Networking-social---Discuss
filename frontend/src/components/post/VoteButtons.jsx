import React from 'react';
import { usePost } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../utils/formatters';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

export default function VoteButtons({ post, layout = 'vertical' }) {
  const { votePost, getUserVote } = usePost();
  const { isAuthenticated } = useAuth();

  const currentVote = getUserVote(post.id);

  const handleUpvote = (e) => {
    e.stopPropagation();
    votePost(post.id, 1);
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    votePost(post.id, -1);
  };

  const isVertical = layout === 'vertical';

  return (
    <div
      className={`flex items-center rounded-full bg-[#272729] border border-[#343536] p-0.5 shrink-0 ${
        isVertical ? 'flex-col gap-0.5' : 'flex-row gap-1 px-2 py-0.5'
      }`}
    >
      {/* Upvote button */}
      <button
        onClick={handleUpvote}
        title={isAuthenticated ? 'Upvote bài viết' : 'Đăng nhập để upvote'}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          currentVote === 1
            ? 'text-[#ff4500] bg-[#ff4500]/15 scale-105'
            : 'text-[#818384] hover:text-[#ff4500] hover:bg-[#343536]'
        }`}
      >
        <ArrowBigUp className={`w-5 h-5 ${currentVote === 1 ? 'fill-[#ff4500]' : ''}`} />
      </button>

      {/* Vote Score */}
      <span
        className={`font-bold text-xs select-none px-1 ${
          currentVote === 1
            ? 'text-[#ff4500]'
            : currentVote === -1
            ? 'text-[#7193ff]'
            : 'text-[#d7dadc]'
        }`}
      >
        {formatNumber(post.voteScore)}
      </span>

      {/* Downvote button */}
      <button
        onClick={handleDownvote}
        title={isAuthenticated ? 'Downvote bài viết' : 'Đăng nhập để downvote'}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          currentVote === -1
            ? 'text-[#7193ff] bg-[#7193ff]/15 scale-105'
            : 'text-[#818384] hover:text-[#7193ff] hover:bg-[#343536]'
        }`}
      >
        <ArrowBigDown className={`w-5 h-5 ${currentVote === -1 ? 'fill-[#7193ff]' : ''}`} />
      </button>
    </div>
  );
}
