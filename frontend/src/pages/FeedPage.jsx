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
        <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-900">Bộ lọc đang áp dụng:</span>
            {searchKeyword && (
              <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 font-medium flex items-center gap-1">
                Từ khóa: "{searchKeyword}"
                <button
                  onClick={() => setSearchKeyword('')}
                  className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 font-medium flex items-center gap-1">
                Tag: #{selectedTag}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {/* Sort Buttons Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSort(SORT_OPTIONS.HOT)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.HOT
                ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200/60'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Thịnh hành (Hot)</span>
          </button>

          <button
            onClick={() => setActiveSort(SORT_OPTIONS.NEW)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.NEW
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mới nhất (New)</span>
          </button>

          <button
            onClick={() => setActiveSort(SORT_OPTIONS.TOP)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSort === SORT_OPTIONS.TOP
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/60'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
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
            />
          ))
        )}
      </div>
    </div>
  );
}
