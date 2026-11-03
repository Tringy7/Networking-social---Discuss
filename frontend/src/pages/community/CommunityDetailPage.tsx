import CommunityRulesContent from '../../components/community/CommunityRulesContent';
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
import EntityBanner from '../../components/ui/EntityBanner';
import EntityImageActions from '../../components/ui/EntityImageActions';
import CommunityMediaEditor from '../../components/community/CommunityMediaEditor';
import type { ProfileImageKind } from '../../components/profile/ImageCropEditor';
import { canEditCommunityMedia } from '../../utils/communityMedia';
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
  const { posts, loadCommunityPosts, openCreateModal } = usePostStore();
  const { isAuthenticated, activeRole, user } = useAuthStore();
  const { addToast } = useToastStore();

  const [postPage, setPostPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [tab, setTab] = useState<'latest' | 'popular'>('latest');
  const [isMembershipUpdating, setIsMembershipUpdating] = useState(false);
  const [isCommunityLoading, setIsCommunityLoading] = useState(true);
  const [communityLoadFailed, setCommunityLoadFailed] = useState(false);
  const [mediaKind, setMediaKind] = useState<ProfileImageKind | null>(null);

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

  React.useEffect(() => {
    if (!communityName || !isAuthenticated) return;
    let active = true;
    setPostPage(0); setPostsLoading(true);
    loadCommunityPosts(communityName).then((more) => { if (active) setHasMorePosts(more); })
      .catch((error: unknown) => { if (active) addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error'); })
      .finally(() => { if (active) setPostsLoading(false); });
    return () => { active = false; };
  }, [communityName, isAuthenticated, loadCommunityPosts, addToast]);

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
          {communityLoadFailed ? 'Chưa thể tải cộng đồng' : isCommunityLoading ? 'Đang mở cộng đồng' : 'Không tìm thấy cộng đồng'}
        </h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {communityLoadFailed
            ? 'Đã xảy ra sự cố khi kết nối. Hãy thử tải lại hoặc quay lại khám phá cộng đồng.'
            : isCommunityLoading
              ? `Đang tải c/${communityName}.`
              : `Không tìm thấy c/${communityName}.`}
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
  const canEditMedia = !isCommunityLoading && canEditCommunityMedia(community, user, isAuthenticated);

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
        <EntityBanner src={community.bannerUrl} alt={`Ảnh bìa ${community.displayName}`} variant="community">
          <EntityImageActions key={`${community.name}-banner`} src={community.bannerUrl} kind="banner"
            name={community.displayName} href={`/c/${community.name}`} handle={`c/${community.name}`} avatarUrl={community.avatarUrl}
            onEdit={canEditMedia ? () => setMediaKind('banner') : undefined} />
        </EntityBanner>
        <div className="community-identity">
          <div className="community-avatar-slot">
            <EntityImageActions key={`${community.name}-avatar`} src={community.avatarUrl} kind="avatar"
              name={community.displayName} href={`/c/${community.name}`} handle={`c/${community.name}`} avatarUrl={community.avatarUrl}
              onEdit={canEditMedia ? () => setMediaKind('avatar') : undefined}>
              <Avatar src={community.avatarUrl} alt={community.displayName} size="xl" className="community-avatar" />
            </EntityImageActions>
          </div>
          <div className="community-heading"><h1 className="editorial-title">{community.displayName || community.name}</h1><p className="community-handle">c/{community.name}</p></div>
          <div className="community-actions">
            <Button variant={isJoined ? 'secondary' : 'primary'} size="sm" isLoading={isMembershipUpdating} onClick={handleJoinToggle} aria-pressed={isJoined} leftIcon={isJoined ? <Check size={15} /> : <Plus size={15} />}>{isJoined ? 'Đã tham gia' : 'Tham gia cộng đồng'}</Button>
            <Button variant="outline" size="sm" onClick={() => openCreateModal(community.name)} leftIcon={<Plus size={15} />}>Đăng bài</Button>
            {(isManager || canEditMedia) && <Link className="icon-button" aria-label="Cài đặt cộng đồng" to={`/c/${community.name}/settings`}><Settings size={18} /></Link>}
          </div>
        </div>
        <div className="community-facts"><span><Users size={15} /> {community.memberCount.toLocaleString('vi-VN')} thành viên</span>{community.category && <span>{community.category}</span>}<span><Calendar size={15} /> {new Date(community.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span><button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); addToast('Đã sao chép liên kết cộng đồng!', 'success'); } catch { addToast('Không thể sao chép liên kết.', 'error'); } }}><Share2 size={15} /> Chia sẻ</button></div>
      </header>
      <div className="community-columns">
        <section className="min-w-0" aria-label="Bài viết cộng đồng">
          <EditorialTabs label="Sắp xếp bài viết cộng đồng" options={[{ id: 'latest', label: 'Mới nhất', icon: <Clock /> }, { id: 'popular', label: 'Sôi nổi', icon: <Flame /> }]} value={tab} onChange={setTab} trailing={`${sortedPosts.length} bài viết`} />
          {!POSTS_AVAILABLE && <p className="feed-notice">Bài viết mẫu · Tương tác được lưu trong phiên hiện tại.</p>}
          {postsLoading && <p role="status" className="feed-notice">Đang tải bài viết…</p>}
          <div className="discussion-list">{sortedPosts.map((post) => <PostCard key={post.id} post={post} showCommunity={false} />)}</div>
          {hasMorePosts && <Button disabled={postsLoading} variant="secondary" onClick={async () => {
            setPostsLoading(true);
            try { setHasMorePosts(await loadCommunityPosts(community.name, postPage + 1)); setPostPage(postPage + 1); }
            catch (error) { addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error'); }
            finally { setPostsLoading(false); }
          }}>Xem thêm bài viết</Button>}
          {!postsLoading && !sortedPosts.length && <div className="editorial-empty"><h2>Chia sẻ bài viết đầu tiên</h2><p>Chia sẻ câu hỏi hoặc góc nhìn đầu tiên cùng cộng đồng.</p><Button size="sm" className="mt-4" onClick={() => openCreateModal(community.name)}>Viết bài đầu tiên</Button></div>}
        </section>
        <aside className="community-context">
          <section className="context-section" aria-label="Giới thiệu cộng đồng">
            <div className="context-title"><h2>Giới thiệu</h2></div>
            <p className="entity-about-description">{community.description || 'Cộng đồng chưa có mô tả.'}</p>
          </section>
          <section className="context-section"><div className="context-title"><h2>Nội quy cộng đồng</h2><BookOpen size={16} /></div>
            <CommunityRulesContent markdown={community.rules} />
          </section>
          <section className="context-section"><div className="context-title"><h2>Ban quản trị</h2>{isManager && <Link to={`/c/${community.name}/settings?tab=members`}>Quản lý</Link>}</div>
            <Link to={`/u/${community.ownerUsername}`} className="context-community"><Avatar alt={community.ownerUsername} size="sm" /><div className="community-info"><span className="text-sm font-semibold">@{community.ownerUsername}</span><p>Chủ cộng đồng</p></div></Link>
            {isManager && <Link to={`/c/${community.name}/moderation`} className="side-link"><ShieldAlert size={16} />Hàng đợi kiểm duyệt</Link>}
          </section>
        </aside>
      </div>
      {mediaKind && canEditMedia && <CommunityMediaEditor key={`${community.name}-${mediaKind}`} communityName={community.name} kind={mediaKind} onClose={() => setMediaKind(null)} />}
    </div>
  );
};
export default CommunityDetailPage;
