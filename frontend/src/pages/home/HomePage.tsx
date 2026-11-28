import PageHeader from '../../components/ui/PageHeader';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import PostCard from '../../components/post/PostCardView';
import RightSidebar from '../../components/layout/RightSidebar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EditorialTabs from '../../components/ui/EditorialTabs';
import { Flame, Clock, MessageSquare, ArrowUpRight, ImagePlus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';

const tabs = [
  { id: 'for-you', label: 'Cho bạn', icon: MessageSquare },
  { id: 'latest', label: 'Mới nhất', icon: Clock },
  { id: 'popular', label: 'Sôi nổi', icon: Flame },
];
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'for-you';
  const { posts, feedIds, hasMore, loading, loadMore, hydrate } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const reduced = useReducedMotion();
  const quiet = reduced || intensity !== 'full';
  const [displayCount, setDisplayCount] = useState(6);
  useEffect(() => {
    if (!isAuthenticated) return;
    hydrate(currentTab).catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error'));
  }, [addToast, currentTab, hydrate, isAuthenticated]);
  const sorted = posts.filter((post) => feedIds.includes(post.id)).sort((a, b) => {
    if (currentTab === 'popular') return b.voteScore - a.voteScore;
    if (currentTab === 'for-you' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return <div className="feed-layout">
    <div className="feed-column">
      <PageHeader title="Bảng tin" variant="compact" actions={<Link to="/explore" className="feed-discover">Khám phá cộng đồng <ArrowUpRight size={15} /></Link>} />
      {isAuthenticated && user ? <div className="composer-strip">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
        <button className="composer-prompt" onClick={() => navigate('/posts/create')}>Bạn đang nghĩ gì? Chia sẻ với cộng đồng nhé.</button>
        <button className="icon-button composer-media" onClick={() => navigate('/posts/create')} aria-label="Tạo bài viết"><ImagePlus size={20} /></button>
      </div> : <div className="guest-strip">
        <p><strong>Chào mừng đến với DISCUSS!</strong> Tìm cộng đồng của bạn và cùng trò chuyện.</p>
        <Link to="/login"><Button variant="primary" size="sm" rightIcon={<ArrowUpRight size={15} />}>Tham gia ngay</Button></Link>
      </div>}
      <EditorialTabs label="Sắp xếp bảng tin" value={currentTab}
        options={tabs.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon aria-hidden="true" /> }))}
        onChange={(id) => { setSearchParams({ tab: id }); setDisplayCount(6); }} />
      {!POSTS_AVAILABLE && <p role="status" className="feed-notice">Bài viết mẫu · Tương tác được lưu trong phiên hiện tại.</p>}
      {loading && <p role="status" className="feed-notice">Đang tải bài viết…</p>}
      <div className="discussion-list discussion-cards">
        {sorted.slice(0, displayCount).map((post) => <motion.div key={post.id}
          initial={quiet ? false : { opacity: 0.8 }} animate={{ opacity: 1 }}
          transition={{ duration: quiet ? 0 : 0.12 }}>
          <PostCard post={post} />
        </motion.div>)}
      </div>
      {!loading && sorted.length === 0 && <section className="editorial-empty">
        <h2>Chưa có bài viết để hiển thị</h2>
        <Link className="text-sm font-semibold text-[var(--color-orange-ink)]" to="/explore">Khám phá cộng đồng</Link>
      </section>}
      {(displayCount < sorted.length || hasMore) && <Button variant="secondary" className="mt-5 w-full" disabled={loading} onClick={async () => {
        if (displayCount >= sorted.length) {
          try { await loadMore(); } catch (error) { addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error'); }
        }
        setDisplayCount((count) => count + 20);
      }}>Đọc thêm thảo luận</Button>}
    </div>
    <RightSidebar />
  </div>;
}
