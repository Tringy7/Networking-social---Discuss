import React, { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';
import EditorialTabs from '../../components/ui/EditorialTabs';
import PostCard from '../../components/post/PostCardView';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import {
  Users,
  Settings,
  Plus,
  ShieldAlert,
  Flame,
  Clock,
  Check,
  BookOpen,
  Share2,
  Calendar,
} from 'lucide-react';

export const CommunityDetailPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { communities, joinCommunity, leaveCommunity, hydrateCommunity } = useCommunityStore();
  const { posts, openCreateModal } = usePostStore();
  const { isAuthenticated, activeRole } = useAuthStore();
  const { addToast } = useToastStore();

  const [tab, setTab] = useState<'latest' | 'popular'>('latest');
  const [isMembershipUpdating, setIsMembershipUpdating] = useState(false);
  const [isCommunityLoading, setIsCommunityLoading] = useState(true);
  const [communityLoadFailed, setCommunityLoadFailed] = useState(false);

  React.useEffect(() => {
    if (!communityName) return;
    let active = true;
    setIsCommunityLoading(true);
    setCommunityLoadFailed(false);
    hydrateCommunity(communityName)
      .catch((error: unknown) => {
        if (!active) return;
        setCommunityLoadFailed(true);
        addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error');
      })
      .finally(() => {
        if (active) setIsCommunityLoading(false);
      });
    return () => { active = false; };
  }, [addToast, communityName, hydrateCommunity]);

  const community = communities.find((c) => c.name === communityName);

  // Auto-open composer if ?action=create is in URL
  React.useEffect(() => {
    if (searchParams.get('action') === 'create' && community) {
      openCreateModal(community.name);
    }
  }, [searchParams, community, openCreateModal]);

  if (!community) {
    return (
      <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center" aria-live="polite">
        <div className="text-sm font-medium text-[var(--text-muted)]">DISCUSS · Cộng đồng</div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {communityLoadFailed ? 'Cộng đồng chưa tải được' : isCommunityLoading ? 'Đang mở cộng đồng' : 'Không tìm thấy cộng đồng'}
        </h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {communityLoadFailed
            ? 'Đã xảy ra sự cố khi kết nối. Hãy thử tải lại hoặc quay lại khám phá cộng đồng.'
            : isCommunityLoading
              ? `Đang tải community/${communityName}.`
              : `Không tìm thấy community/${communityName}.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {communityLoadFailed && (
            <Button variant="secondary" size="sm" onClick={() => {
              if (!communityName) return;
              setIsCommunityLoading(true);
              setCommunityLoadFailed(false);
              hydrateCommunity(communityName)
                .catch((error: unknown) => {
                  setCommunityLoadFailed(true);
                  addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error');
                })
                .finally(() => setIsCommunityLoading(false));
            }}>
              Thử lại
            </Button>
          )}
          <Link to="/explore">
          <Button variant="primary" size="sm">
            Khám phá cộng đồng khác
          </Button>
          </Link>
        </div>
      </section>
    );
  }

  const isJoined =
    community.currentUserRole === 'MEMBER' ||
    community.currentUserRole === 'MODERATOR' ||
    community.currentUserRole === 'OWNER';

  const isManager =
    community.currentUserRole === 'OWNER' ||
    community.currentUserRole === 'MODERATOR' ||
    activeRole === 'ADMIN';

  const communityPosts = posts.filter((p) => p.communityName === community.name);
  const sortedPosts = [...communityPosts].sort((a, b) => {
    if (tab === 'popular') return b.heartCount - a.heartCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleJoinToggle = async () => {
    if (isMembershipUpdating) return;
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tham gia cộng đồng', 'warning');
      navigate('/login');
      return;
    }
    setIsMembershipUpdating(true);
    try {
      if (isJoined) {
        await leaveCommunity(community.name);
        addToast(`Đã rời khỏi ${community.displayName}`, 'info');
      } else {
        await joinCommunity(community.name);
        addToast(`Đã tham gia ${community.displayName}!`, 'success');
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật thành viên cộng đồng.', 'error');
    } finally {
      setIsMembershipUpdating(false);
    }
  };

  return (
    <div className="community-page">
      <header className="community-masthead">
        {community.bannerUrl && <div className="community-cover"><img src={community.bannerUrl} alt={`Ảnh bìa ${community.displayName}`} /></div>}
        <div className="community-identity">
          <Avatar src={community.avatarUrl} alt={community.displayName} size="xl" shape="rounded" />
          <div className="min-w-0 flex-1"><p className="community-category">{community.category} · c/{community.name}</p><h1 className="editorial-title">{community.displayName}</h1></div>
          <div className="community-actions">
            <Button variant={isJoined ? 'secondary' : 'primary'} size="sm" isLoading={isMembershipUpdating} onClick={handleJoinToggle} leftIcon={isJoined ? <Check size={15} /> : <Plus size={15} />}>{isJoined ? 'Đã tham gia' : 'Tham gia'}</Button>
            <Button variant="outline" size="sm" onClick={() => openCreateModal(community.name)} leftIcon={<Plus size={15} />}>Đăng bài</Button>
            {isManager && <Link className="icon-button" aria-label="Cài đặt cộng đồng" to={`/community/${community.name}/settings`}><Settings size={18} /></Link>}
          </div>
        </div>
        <p className="community-description">{community.description}</p>
        <div className="community-facts"><span><Users size={15} /> {community.memberCount.toLocaleString('vi-VN')} thành viên</span><span><Calendar size={15} /> {new Date(community.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span><button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); addToast('Đã sao chép liên kết cộng đồng!', 'success'); } catch { addToast('Không thể sao chép liên kết.', 'error'); } }}><Share2 size={15} /> Chia sẻ</button></div>
      </header>
      <div className="community-columns">
        <section className="min-w-0" aria-label="Bài viết cộng đồng">
          <EditorialTabs label="Sắp xếp bài viết cộng đồng" options={[{ id: 'latest', label: 'Mới nhất', icon: <Clock /> }, { id: 'popular', label: 'Sôi nổi', icon: <Flame /> }]} value={tab} onChange={setTab} trailing={`${sortedPosts.length} bài viết`} />
          {!POSTS_AVAILABLE && <p className="feed-notice">Bài viết mẫu · Tương tác được lưu trong phiên hiện tại.</p>}
          <div className="discussion-list">{sortedPosts.map((post) => <PostCard key={post.id} post={post} showCommunity={false} />)}</div>
          {!sortedPosts.length && <div className="editorial-empty"><h2>Mở đầu cuộc trò chuyện.</h2><p>Chia sẻ câu hỏi hoặc góc nhìn đầu tiên cùng cộng đồng.</p><Button size="sm" className="mt-4" onClick={() => openCreateModal(community.name)}>Viết bài đầu tiên</Button></div>}
        </section>
        <aside className="community-context">
          <section className="context-section"><div className="context-title"><h2>Nội quy cộng đồng</h2><BookOpen size={16} /></div>
            {community.rules?.length ? <ol className="community-rules">{community.rules.map((rule) => <li key={rule.id}><h3>{rule.title}</h3><p>{rule.description}</p></li>)}</ol> : <p className="text-sm text-[var(--text-secondary)]">Tôn trọng góc nhìn khác biệt và tuân thủ tiêu chuẩn cộng đồng DISCUSS.</p>}
          </section>
          <section className="context-section"><div className="context-title"><h2>Người giữ cuộc trò chuyện</h2>{isManager && <Link to={`/community/${community.name}/members`}>Quản lý</Link>}</div>
            <Link to={`/user/${community.ownerUsername}`} className="context-community"><Avatar alt={community.ownerUsername} size="sm" /><div className="community-info"><span className="text-sm font-semibold">@{community.ownerUsername}</span><p>Chủ cộng đồng</p></div></Link>
            {isManager && <Link to={`/community/${community.name}/moderation`} className="side-link"><ShieldAlert size={16} />Hàng đợi kiểm duyệt</Link>}
          </section>
        </aside>
      </div>
    </div>
  );
};
export default CommunityDetailPage;
