import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import PostCard from '../../components/post/PostCardView';
import Button from '../../components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';

export const SavedPostsPage: React.FC = () => {
  const { savedPosts, hydrateSaved } = usePostStore();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    hydrateSaved().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải bài viết đã lưu.', 'error');
    });
  }, [addToast, hydrateSaved]);

  return (
    <div className="utility-page space-y-5 text-left pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
          <Bookmark className="w-6 h-6 text-[var(--color-orange)] fill-[var(--color-orange)]" />
          <span>Bài viết đã lưu</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Danh sách các chủ đề và tài liệu bạn đã đánh dấu để xem lại sau
        </p>
      </div>

      {!POSTS_AVAILABLE && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          Danh sách bài viết mẫu; trạng thái lưu chỉ tồn tại trong phiên hiện tại.
        </div>
      )}

      <div className="space-y-4">
        {savedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {savedPosts.length === 0 && (
          <div className="py-20 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-panel)] p-8 space-y-4">
            <Bookmark className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Chưa có bài viết nào được lưu
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Khi lướt bảng tin hoặc các cộng đồng, hãy bấm vào biểu tượng đánh dấu để lưu bài viết hữu ích vào đây.
            </p>
            <Link to="/explore">
              <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                Khám phá cộng đồng ngay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPostsPage;
