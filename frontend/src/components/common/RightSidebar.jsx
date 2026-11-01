import React from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { usePost } from '../../context/PostContext';
import { formatNumber } from '../../utils/formatters';
import { Flame, Hash, Shield } from 'lucide-react';

export default function RightSidebar({ onSelectCommunity, onSelectTag }) {
  const { communities, joinCommunity, getUserCommunityRole } = useCommunity();
  const { posts, selectedTag } = usePost();

  const trendingCommunities = [...communities]
    .sort((a, b) => ((b.memberCount || 0) + (b.postCount || 0)) - ((a.memberCount || 0) + (a.postCount || 0)))
    .slice(0, 4);

  const popularTags = Array.from(
    new Set((posts || []).flatMap(p => p.tags || []))
  ).slice(0, 8);

  return (
    <aside className="hidden xl:block w-80 shrink-0 space-y-5 sticky top-20">
      {trendingCommunities.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Cộng đồng nổi bật
            </h3>
          </div>

          <div className="space-y-2.5">
            {trendingCommunities.map((c) => {
              const role = getUserCommunityRole(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCommunity(c.id)}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition truncate">
                        c/{c.slug}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {formatNumber(c.memberCount || 0)} thành viên
                      </p>
                    </div>
                  </div>

                  {!role && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinCommunity(c.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Tham gia
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {popularTags.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
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
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-slate-50/80 rounded-3xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <Shield className="w-4 h-4 text-indigo-600" />
          Văn hóa cộng đồng Discuss
        </h4>
        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-500 leading-relaxed">
          <li>Chia sẻ kiến thức bổ ích và xây dựng.</li>
          <li>Tôn trọng sự đa dạng quan điểm kỹ thuật.</li>
          <li>Giữ không gian thảo luận văn minh, tôn trọng người khác.</li>
        </ul>
      </div>
    </aside>
  );
}
