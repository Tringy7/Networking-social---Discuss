import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import PostCard from '../../components/post/PostCardView';
import RightSidebar from '../../components/layout/RightSidebar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Flame, Clock, Sparkles, Image, Code2, Link2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'for-you';

  const { posts, openCreateModal, hydrate } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [displayCount, setDisplayCount] = useState(6);

  useEffect(() => {
    if (!isAuthenticated || currentTab === 'for-you') return;
    hydrate(currentTab).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error');
    });
  }, [addToast, currentTab, hydrate, isAuthenticated]);

  // Sorting based on tab
  const sortedPosts = [...posts].sort((a, b) => {
    if (currentTab === 'popular') {
      return b.heartCount - a.heartCount;
    }
    if (currentTab === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // For you: pinned first, then newest
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const visiblePosts = sortedPosts.slice(0, displayCount);

  return (
    <div className="flex gap-4 justify-center">
      {/* Main Feed Column */}
      <div className="flex-1 max-w-3xl min-w-0 space-y-4">
        {/* Quick Post Composer Shortcut for Authenticated User */}
        {isAuthenticated && user ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline />
            <input
              type="text"
              readOnly
              onClick={() => openCreateModal()}
              placeholder="Bạn đang nghĩ gì? Chia sẻ thảo luận cùng cộng đồng..."
              className="flex-1 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <button
                onClick={() => openCreateModal()}
                className="p-2 rounded-full hover:bg-[var(--bg-hover)] hover:text-[var(--color-orange)] transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Đăng ảnh"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                onClick={() => openCreateModal()}
                className="p-2 rounded-full hover:bg-[var(--bg-hover)] hover:text-[#22C55E] transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Đoạn mã code"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[var(--color-orange-soft)] via-[var(--color-orange-soft)]/50 to-transparent border border-[var(--color-orange-border)] rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5]">Tham gia cộng đồng DISCUSS</h3>
              <p className="text-xs text-[#9A9DA3] mt-0.5">
                Đăng nhập để bình luận, thả tim và tạo bài viết chuyên môn của riêng bạn.
              </p>
            </div>
            <Link to="/login">
              <Button variant="primary" size="sm">
                Đăng nhập
              </Button>
            </Link>
          </div>
        )}

        {!POSTS_AVAILABLE && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Đang dùng dữ liệu mẫu; thao tác chỉ được lưu trong phiên hiện tại.
          </div>
        )}

        {/* Feed Sorting Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161922] border border-[#262C3A] rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setSearchParams({ tab: 'for-you' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'for-you'
                ? 'bg-[var(--color-orange)] text-white shadow-sm font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#1E232F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cho bạn</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'latest' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'latest'
                ? 'bg-[var(--color-orange)] text-white shadow-sm font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#1E232F]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mới nhất</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'popular' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'popular'
                ? 'bg-[var(--color-orange)] text-white shadow-sm font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#1E232F]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Phổ biến</span>
          </button>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {visiblePosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {visiblePosts.length === 0 && (
            <div className="py-16 text-center bg-[#161922] border border-[#262C3A] rounded-2xl p-8 space-y-3">
              <Sparkles className="w-8 h-8 text-[var(--color-orange)] mx-auto" />
              <h4 className="text-base font-bold text-[#F5F5F5]">
                Chưa có bài viết nào
              </h4>
              <p className="text-xs text-[#9A9DA3]">
                Hãy là người đầu tiên mở đầu chủ đề thảo luận!
              </p>
            </div>
          )}

          {/* Load More Button */}
          {visiblePosts.length < sortedPosts.length && (
            <div className="pt-2 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDisplayCount((prev) => prev + 5)}
                className="w-full"
              >
                Xem thêm bài viết thảo luận
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Column */}
      <RightSidebar />
    </div>
  );
};

export default HomePage;
