import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import PostCard from '../../components/post/PostCardView';
import RightSidebar from '../../components/layout/RightSidebar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Flame, Clock, Sparkles, Image, Code2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'for-you';

  const { posts, openCreateModal, hydrate } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const shouldReduceMotion = useReducedMotion();
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
    <div className="flex gap-6 justify-center">
      {/* Main Feed Column */}
      <div className="flex-1 max-w-3xl min-w-0 space-y-4">
        <header className="flex items-end justify-between gap-3 px-1 pt-1">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Cộng đồng đang bàn luận</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Bảng tin</h1>
          </div>
          <span className="hidden sm:block pb-1 text-xs text-[var(--text-muted)]">Ý tưởng hay bắt đầu từ một cuộc thảo luận</span>
        </header>
        {/* Quick Post Composer Shortcut for Authenticated User */}
        {isAuthenticated && user ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline />
            <input
              type="text"
              readOnly
              onClick={() => openCreateModal()}
              placeholder="Bạn đang nghĩ gì? Chia sẻ thảo luận cùng cộng đồng..."
              className="flex-1 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors disabled:cursor-not-allowed"
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
                className="p-2 rounded-full hover:bg-[var(--bg-hover)] hover:text-[var(--color-code)] transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Đoạn mã code"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tham gia cộng đồng DISCUSS</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
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
          <div role="status" className="rounded-xl border border-[var(--color-orange-border)] bg-[var(--color-orange-soft)] px-4 py-3 text-xs text-[var(--text-primary)]">
            Đang dùng dữ liệu mẫu; thao tác chỉ được lưu trong phiên hiện tại.
          </div>
        )}

        {/* Feed Sorting Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setSearchParams({ tab: 'for-you' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'for-you'
                ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cho bạn</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'latest' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'latest'
                ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mới nhất</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'popular' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'popular'
                ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
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
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, delay: shouldReduceMotion ? 0 : idx * 0.04 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {visiblePosts.length === 0 && (
            <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 space-y-3">
              <Sparkles className="w-8 h-8 text-[var(--color-orange)] mx-auto" />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Chưa có bài viết nào
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
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
