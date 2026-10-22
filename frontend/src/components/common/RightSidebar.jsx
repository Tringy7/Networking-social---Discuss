import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { formatNumber } from '../../utils/formatters';
import { Flame, Hash, Shield } from 'lucide-react';

export default function RightSidebar({ onSelectCommunity, onSelectTag }) {
  const navigate = useNavigate();
  const { communities, joinCommunity, getUserCommunityRole } = useCommunity();
  const { posts, selectedTag } = usePost();

  const trendingCommunities = [...communities]
    .sort((a, b) => ((b.memberCount || 0) + (b.postCount || 0)) - ((a.memberCount || 0) + (a.postCount || 0)))
    .slice(0, 4);

  const popularTags = Array.from(
    new Set((posts || []).flatMap(p => p.tags || []))
  ).slice(0, 8);

  return (
    <aside className="hidden xl:block w-80 shrink-0 space-y-4 sticky top-16">
      {trendingCommunities.length > 0 && (
        <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-orange-950/60 text-orange-500 border border-orange-900/50">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#d7dadc] text-xs uppercase tracking-wider">
              Cộng đồng nổi bật
            </h3>
          </div>

          <div className="space-y-1">
            {trendingCommunities.map((c) => {
              const role = getUserCommunityRole(c.id);

              return (
                <Link
                  key={c.id}
                  to={`/c/${c.slug || c.id}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[#272729] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-[#343536] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#d7dadc] group-hover:text-orange-400 transition truncate">
                        c/{c.slug}
                      </h4>
                      <p className="text-[11px] text-[#818384] truncate">
                        {formatNumber(c.memberCount || 0)} thành viên
                      </p>
                    </div>
                  </div>

                  {!role && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        joinCommunity(c.id);
                      }}
                      className="px-3 py-1 text-[11px] font-bold bg-[#272729] hover:bg-[#343536] text-[#d7dadc] border border-[#343536] rounded-full transition shrink-0 cursor-pointer"
                    >
                      Gia nhập
                    </button>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {popularTags.length > 0 && (
        <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-[#272729] text-orange-400 border border-[#343536]">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#d7dadc] text-xs uppercase tracking-wider">
              Chủ đề thảo luận
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-[#272729] hover:bg-[#343536] text-[#818384] hover:text-[#d7dadc] border border-[#343536]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
