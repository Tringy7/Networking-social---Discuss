import React, { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { POSTS_AVAILABLE } from '../../services';
import PostCard from '../../components/post/PostCardView';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  Users,
  Settings,
  Plus,
  ShieldAlert,
  Flame,
  Clock,
  Check,
  Shield,
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
  const { user, isAuthenticated, activeRole } = useAuthStore();
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
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      {/* BANNER & HEADER */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
        {/* Banner Image */}
        <div className="h-44 sm:h-56 w-full relative bg-[var(--bg-main)]">
          <img
            src={community.bannerUrl}
            alt={community.displayName}
            className="w-full h-full object-cover"
          />
          {/* Smooth fade into community card surface for both Light and Dark mode */}
        </div>

        {/* Profile Header Bar */}
        <div className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar
                src={community.avatarUrl}
                alt={community.displayName}
                size="2xl"
                shape="rounded"
                className="border-4 border-[var(--bg-surface)] bg-[var(--bg-surface)]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {community.displayName}
                  </h1>
                  <span className="text-xs font-semibold text-[var(--color-orange)] bg-[var(--color-orange-soft)] border border-[var(--color-orange-border)] px-2.5 py-0.5 rounded-full">
                    {community.category}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">community/{community.name}</div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isJoined ? 'secondary' : 'primary'}
                size="md"
                onClick={handleJoinToggle}
                isLoading={isMembershipUpdating}
                leftIcon={isJoined ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : undefined}
              >
                {isJoined ? 'Đã tham gia' : 'Tham gia'}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => openCreateModal(community.name)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Đăng bài
              </Button>

              {isManager && (
                <Link to={`/community/${community.name}/settings`}>
                  <Button variant="secondary" size="md" leftIcon={<Settings className="w-4 h-4" />}>
                    Cài đặt
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            {community.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Users className="w-4 h-4 text-[var(--color-orange)]" />
              <span className="tabular-nums">{community.memberCount.toLocaleString('vi-VN')}</span> thành viên
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Tạo từ 2022
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                addToast('Đã sao chép liên kết cộng đồng!', 'success');
              }}
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT (FEED + SIDEBAR INFO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Posts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {!POSTS_AVAILABLE && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              Bài viết và tương tác đang dùng dữ liệu mẫu trong phiên hiện tại.
            </div>
          )}
          {/* Feed Filter Bar */}
          <div className="flex items-center justify-between gap-2 p-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-sm font-medium">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTab('latest')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'latest'
                    ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mới nhất</span>
              </button>
              <button
                onClick={() => setTab('popular')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'popular'
                    ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Nổi bật</span>
              </button>
            </div>

            <span className="text-[11px] text-[var(--text-muted)] pr-3">
              {sortedPosts.length} bài viết
            </span>
          </div>

          {/* Posts list */}
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} showCommunity={false} />
            ))}

            {sortedPosts.length === 0 && (
              <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 space-y-3">
                <BookOpen className="w-8 h-8 text-[var(--color-orange)] mx-auto opacity-70" />
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  Chưa có bài viết nào trong cộng đồng này
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Hãy viết bài chia sẻ đầu tiên để bắt đầu thảo luận!
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openCreateModal(community.name)}
                >
                  Tạo bài viết ngay
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: About, Rules & Moderators */}
        <div className="space-y-5">
          {/* Rules Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 text-left space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--color-orange)]" />
              <span>Nội quy cộng đồng</span>
            </h3>

            {community.rules && community.rules.length > 0 ? (
              <ol className="space-y-3 text-sm">
                {community.rules.map((rule, index) => (
                  <li key={rule.id} className="pb-1">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {index + 1}. {rule.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{rule.description}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Tuân thủ tiêu chuẩn cộng đồng chung của DISCUSS.</p>
            )}
          </div>

          {/* Moderators Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--color-info)]" />
                <span>Ban quản trị & Mod</span>
              </h3>
              {isManager && (
                <Link
                  to={`/community/${community.name}/members`}
                  className="text-xs text-[var(--color-orange)] hover:underline"
                >
                  Quản lý
                </Link>
              )}
            </div>

            <div className="space-y-2.5">
              <Link
                to={`/user/${community.ownerUsername}`}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Avatar alt={community.ownerUsername} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    @{community.ownerUsername}
                  </div>
                  <Badge role="OWNER" size="sm" />
                </div>
              </Link>
            </div>

            {isManager && (
              <div className="pt-2">
                <Link to={`/community/${community.name}/moderation`} className="block">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-[var(--color-info)]" />}
                  >
                    Xem hàng đợi kiểm duyệt
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetailPage;
