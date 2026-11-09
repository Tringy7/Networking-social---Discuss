import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import PostCard from '../../components/post/PostCardView';
import Button from '../../components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const SavedPostsPage: React.FC = () => {
  const { savedPosts, hydrateSaved } = usePostStore();
  const addToast = useToastStore((state) => state.addToast);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    hydrateSaved(0).then((more) => { if (active) { setHasMore(more); setPage(0); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải bài viết đã lưu.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hydrateSaved, retry]);
  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try { setHasMore(await hydrateSaved(page + 1)); setPage(page + 1); }
    catch (cause) { addToast(cause instanceof Error ? cause.message : 'Không thể tải thêm bài viết.', 'error'); }
    finally { setLoading(false); }
  };

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

      {error && <div role="alert" className="space-y-3"><p>{error}</p><Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div>}
      {loading && <p role="status">Đang tải bài viết đã lưu…</p>}
      <div className="space-y-4">
        {savedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {!loading && !error && savedPosts.length === 0 && (
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
      {hasMore && !error && <Button variant="secondary" isLoading={loading} disabled={loading} onClick={() => void loadMore()}>Xem thêm bài đã lưu</Button>}
    </div>
  );
};

export default SavedPostsPage;
