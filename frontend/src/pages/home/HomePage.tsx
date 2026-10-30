import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import PostCard from '../../components/post/PostCardView';
import RightSidebar from '../../components/layout/RightSidebar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Flame, Clock, MessageSquare, ArrowUpRight, Plus } from 'lucide-react';
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
  const currentTab = searchParams.get('tab') || 'for-you';
  const { posts, openCreateModal, hydrate } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const reduced = useReducedMotion();
  const quiet = reduced || intensity !== 'full';
  const [displayCount, setDisplayCount] = useState(6);
  useEffect(() => {
    if (!isAuthenticated || currentTab === 'for-you') return;
    hydrate(currentTab).catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error'));
  }, [addToast, currentTab, hydrate, isAuthenticated]);
  const sorted = [...posts].sort((a, b) => {
    if (currentTab === 'popular') return b.heartCount - a.heartCount;
    if (currentTab === 'for-you' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return <div className="feed-layout">
    <div className="feed-column">
      <header className="feed-heading">
        <div><h1 className="editorial-title">Những góc nhìn mới.</h1><p>Cuộc trò chuyện hay bắt đầu từ sự tò mò.</p></div>
        <span className="feed-edition">Bảng tin DISCUSS</span>
      </header>
      {isAuthenticated && user ? <div className="composer-strip">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
        <button className="composer-prompt" onClick={() => openCreateModal()}>Bạn muốn chia sẻ điều gì?</button>
        <button className="icon-button" onClick={() => openCreateModal()} aria-label="Tạo bài viết"><Plus size={19} /></button>
      </div> : <div className="guest-strip">
        <p><strong>Có chỗ cho góc nhìn của bạn.</strong> Đăng nhập để cùng thảo luận.</p>
        <Link to="/login"><Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={15} />}>Tham gia</Button></Link>
      </div>}
      <nav className="feed-tabs" aria-label="Sắp xếp bảng tin">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={currentTab === id}
          className={`feed-tab ${currentTab === id ? 'is-selected' : ''}`}
          onClick={() => { setSearchParams({ tab: id }); setDisplayCount(6); }}>
          <Icon aria-hidden="true" /><span>{label}</span>
          {currentTab === id && <motion.span className="tab-indicator" layoutId="feed-tab" transition={quiet ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 35 }} />}
        </button>)}
        <span className="feed-count">{sorted.length} bài viết</span>
      </nav>
      {!POSTS_AVAILABLE && <p role="status" className="feed-notice">Bài viết mẫu · Tương tác được lưu trong phiên hiện tại.</p>}
      <div className="discussion-list">
        {sorted.slice(0, displayCount).map((post, index) => <motion.div key={post.id}
          initial={quiet ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: quiet ? 0 : 0.2, delay: quiet ? 0 : Math.min(index, 5) * 0.035 }}>
          <PostCard post={post} />
        </motion.div>)}
      </div>
      {sorted.length === 0 && <section className="editorial-empty"><h2>Cuộc trò chuyện tiếp theo?</h2><p>Hãy là người đầu tiên mở đầu một chủ đề.</p></section>}
      {displayCount < sorted.length && <Button variant="secondary" className="mt-5 w-full" onClick={() => setDisplayCount((count) => count + 5)}>Đọc thêm thảo luận</Button>}
    </div>
    <RightSidebar />
  </div>;
}
