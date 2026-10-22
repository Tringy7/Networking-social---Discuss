import React from 'react';
import PostCard from '../components/post/PostCard';
import { usePost } from '../context/PostContext';
import { useCommunity } from '../context/CommunityContext';
import { SORT_OPTIONS } from '../constants/roles';
import { Flame, Clock, Sparkles, Filter, X, MessageSquareDashed } from 'lucide-react';

export default function FeedPage({
  communityId = null,
  onOpenDetail,
  onOpenEdit,
  onOpenReport,
  onSelectCommunity,
  onSelectUser,
  onOpenCreatePost,
}) {
  const { posts, searchKeyword, setSearchKeyword, activeSort, setActiveSort, selectedTag, setSelectedTag } = usePost();
  const { communities } = useCommunity();

  // 1. Filter by community if specified
  let filtered = communityId
    ? posts.filter(p => p.communityId === communityId)
    : posts;

  // 2. Filter by search keyword (Module 7)
  if (searchKeyword.trim()) {
    const q = searchKeyword.toLowerCase().trim();
    filtered = filtered.filter(p => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchTag = p.tags && p.tags.some(t => t.toLowerCase().includes(q));
      const comm = communities.find(c => c.id === p.communityId);
      const matchComm = comm ? comm.slug.toLowerCase().includes(q) || comm.name.toLowerCase().includes(q) : false;
      return matchTitle || matchContent || matchTag || matchComm;
    });
  }

  // 3. Filter by selected tag
  if (selectedTag) {
    filtered = filtered.filter(p => p.tags && p.tags.includes(selectedTag));
  }

  // 4. Sort posts: Pinned posts always first, then by sort option
  filtered = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (activeSort === SORT_OPTIONS.NEW) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (activeSort === SORT_OPTIONS.TOP) {
      return b.voteScore - a.voteScore;
    }
    // HOT (default): combination of vote score and freshness
    return b.voteScore - a.voteScore;
  });

  return (
    <div className="space-y-4">
      {/* Active Filter Indicators */}
      {(searchKeyword || selectedTag) && (
        <div className="bg-[#1a1a1b] border border-[#343536] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#d7dadc]">Bộ lọc đang áp dụng:</span>
            {searchKeyword && (
              <span className="bg-[#272729] px-2.5 py-1 rounded-full border border-[#343536] text-[#d7dadc] font-medium flex items-center gap-1">
                Từ khóa: "{searchKeyword}"
                <button
                  onClick={() => setSearchKeyword('')}
                  className="hover:text-rose-400 font-bold ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="bg-[#272729] px-2.5 py-1 rounded-full border border-[#343536] text-orange-400 font-medium flex items-center gap-1">
                Tag: #{selectedTag}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-rose-400 font-bold ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setSearchKeyword('');
              setSelectedTag(null);
            }}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {/* Sort Buttons Bar */}
      <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] p-2 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSort(SORT_OPTIONS.HOT)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.HOT
                ? 'bg-[#272729] text-white font-bold border border-[#343536]'
                : 'text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Thịnh hành (Hot)</span>
          </button>

          <button
            onClick={() => setActiveSort(SORT_OPTIONS.NEW)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.NEW
                ? 'bg-[#272729] text-white font-bold border border-[#343536]'
                : 'text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Mới nhất (New)</span>
          </button>

          <button
            onClick={() => setActiveSort(SORT_OPTIONS.TOP)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.TOP
                ? 'bg-[#272729] text-white font-bold border border-[#343536]'
                : 'text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>Bình chọn cao (Top)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium pr-2 hidden sm:inline">
          {filtered.length} bài viết
        </span>
      </div>

      {/* Posts List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <MessageSquareDashed className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Chưa có bài thảo luận nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không tìm thấy bài viết nào phù hợp với điều kiện tìm kiếm hiện tại. Hãy thử tìm từ khóa khác hoặc tạo bài viết mới.
            </p>
            {onOpenCreatePost && (
              <button
                onClick={onOpenCreatePost}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                + Đăng bài ngay
              </button>
            )}
          </div>
        ) : (
          filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetail={onOpenDetail}
              onOpenEdit={onOpenEdit}
              onOpenReport={onOpenReport}
              onSelectCommunity={onSelectCommunity}
              onSelectUser={onSelectUser}
            />
          ))
        )}
      </div>
    </div>
  );
}
