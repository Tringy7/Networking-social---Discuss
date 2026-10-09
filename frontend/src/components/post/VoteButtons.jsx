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
      className={`flex items-center rounded-xl bg-slate-50 border border-slate-200/80 p-1 shrink-0 ${
        isVertical ? 'flex-col gap-0.5' : 'flex-row gap-1 px-2 py-0.5'
      }`}
    >
      {/* Upvote button */}
      <button
        onClick={handleUpvote}
        title={isAuthenticated ? 'Upvote bài viết' : 'Đăng nhập để upvote'}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          currentVote === 1
            ? 'text-orange-600 bg-orange-100/80 scale-105'
            : 'text-slate-400 hover:text-orange-600 hover:bg-slate-200/60'
        }`}
      >
        <ArrowBigUp className={`w-5 h-5 ${currentVote === 1 ? 'fill-orange-600' : ''}`} />
      </button>

      {/* Vote Score */}
      <span
        className={`font-bold text-xs select-none px-1 ${
          currentVote === 1
            ? 'text-orange-600'
            : currentVote === -1
            ? 'text-indigo-600'
            : 'text-slate-700'
        }`}
      >
        {formatNumber(post.voteScore)}
      </span>

      {/* Downvote button */}
      <button
        onClick={handleDownvote}
        title={isAuthenticated ? 'Downvote bài viết' : 'Đăng nhập để downvote'}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          currentVote === -1
            ? 'text-indigo-600 bg-indigo-100/80 scale-105'
            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60'
        }`}
      >
        <ArrowBigDown className={`w-5 h-5 ${currentVote === -1 ? 'fill-indigo-600' : ''}`} />
      </button>
    </div>
  );
}
