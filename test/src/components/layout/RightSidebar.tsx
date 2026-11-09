import React from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { TrendingUp, Sparkles, MessageSquare, Heart } from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const { communities, joinCommunity } = useCommunityStore();
  const { posts } = usePostStore();

  const suggested = communities.filter((c) => c.currentUserRole === 'NONE').slice(0, 3);
  const trendingPosts = [...posts].sort((a, b) => b.heartCount - a.heartCount).slice(0, 4);

  return (
    <aside className="hidden xl:block w-80 space-y-4 shrink-0 text-left">
      {/* Trending discussions card */}
      <div className="bg-[#161922] border border-[#262C3A] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-[var(--color-orange)]" />
          <span>Thảo luận sôi nổi</span>
        </div>

        <div className="space-y-3">
          {trendingPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="block group p-2 -mx-2 rounded-xl hover:bg-[#1E232F] transition-colors"
            >
              <div className="text-[11px] text-[#70747C] flex items-center gap-1.5 mb-1">
                <span className="font-semibold text-[#9A9DA3] group-hover:text-[var(--color-orange)] transition-colors">
                  {post.communityDisplayName}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[var(--color-orange)] fill-[var(--color-orange)]" />
                  {post.heartCount}
                </span>
              </div>
              <h5 className="text-xs font-semibold text-[#F5F5F5] line-clamp-2 group-hover:text-white leading-snug">
                {post.title}
              </h5>
              <div className="text-[11px] text-[#70747C] flex items-center gap-1 mt-1">
                <MessageSquare className="w-3 h-3" />
                <span>{post.commentCount} bình luận</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested communities card */}
      {suggested.length > 0 && (
        <div className="bg-[#161922] border border-[#262C3A] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[var(--color-orange)]" />
              <span>Gợi ý cho bạn</span>
            </div>
            <Link to="/explore" className="text-xs text-[var(--color-orange)] hover:underline font-medium">
              Tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {suggested.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2.5">
                <Link to={`/c/${c.name}`} className="flex items-center gap-2.5 truncate flex-1">
                  <Avatar src={c.avatarUrl} alt={c.displayName} size="sm" shape="rounded" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[#F5F5F5] truncate hover:text-[var(--color-orange)] transition-colors">
                      {c.displayName}
                    </div>
                    <div className="text-[11px] text-[#70747C]">
                      {c.memberCount.toLocaleString('vi-VN')} thành viên
                    </div>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => joinCommunity(c.name)}
                  className="py-1 px-3 text-xs shrink-0"
                >
                  Tham gia
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Community Rules info */}
      <div className="px-3 text-[11px] text-[#70747C] space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/explore" className="hover:text-[#9A9DA3]">Cộng đồng</Link>
          <Link to="/settings/privacy" className="hover:text-[#9A9DA3]">Quyền riêng tư</Link>
          <Link to="/settings" className="hover:text-[#9A9DA3]">Cài đặt</Link>
          <Link to="/c/lap-trinh-viet-nam" className="hover:text-[#9A9DA3]">Nội quy</Link>
        </div>
        <p>© 2026 DISCUSS Community Network. Nền tảng chia sẻ tri thức công nghệ.</p>
      </div>
    </aside>
  );
};

export default RightSidebar;
