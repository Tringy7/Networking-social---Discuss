import { useCallback } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { communityService } from '../../services';
import useAdminResource from '../../hooks/useAdminResource';
import CommunityJoinRequestsPanel from '../../components/community/CommunityJoinRequestsPanel';
import CommunityReportsPanel from '../../components/community/CommunityReportsPanel';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { isCommunityOwner } from '../../utils/communityMedia';

export default function CommunityModerationPage() {
  const { communityName = '' } = useParams();
  const [params] = useSearchParams();
  const showReports = params.get('tab') === 'reports'
    || (params.get('tab') !== 'join-requests' && params.has('type'));
  const reportType = params.get('type') === 'COMMENT' ? 'COMMENT' : 'POST';
  const { user, isAuthenticated } = useAuthStore();
  const community = useAdminResource(useCallback(() => communityService.getByName(communityName), [communityName]));
  const path = `/c/${encodeURIComponent(communityName)}`;

  if (community.loading) return <p className="utility-page py-8" role="status">Đang tải cộng đồng…</p>;
  const isOwner = Boolean(community.data && isCommunityOwner(community.data, user, isAuthenticated));
  const role = community.data?.currentUserRole;
  const isManager = isAuthenticated && (role === 'OWNER' || role === 'MODERATOR');
  const canReviewRequests = isManager && community.data?.visibility === 'PRIVATE';

  if (showReports && community.data?.name === communityName && isOwner) {
    return <Navigate to={`${path}/settings?tab=reports&type=${reportType}`} replace />;
  }

  return <section className="utility-page space-y-4 py-8">
    <Link to={path} className="inline-flex items-center gap-2 text-sm hover:underline"><ArrowLeft size={16} aria-hidden="true" />Quay lại cộng đồng</Link>
    {community.error || !community.data ? <div role="alert" className="space-y-2">
      <p>{community.error || 'Không tìm thấy cộng đồng.'}</p>
      <Button size="sm" variant="secondary" onClick={community.reload}>Thử lại</Button>
    </div> : showReports ? (
      <><h1 className="text-2xl font-semibold">Báo cáo cộng đồng</h1>
        <CommunityReportsPanel key={`${communityName}:${reportType}`} name={communityName} canReview={false} /></>
    ) : canReviewRequests ? (
      <>
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldAlert size={23} className="text-[var(--color-orange-ink)]" aria-hidden="true" />Hàng đợi kiểm duyệt
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Duyệt yêu cầu tham gia c/{community.data.name}</p>
        </header>
        <CommunityJoinRequestsPanel key={`${communityName}:${user?.id}`} name={community.data.name} />
      </>
    ) : <p role="alert">Hàng đợi chỉ dành cho chủ cộng đồng và người điều hành của cộng đồng riêng tư.</p>}
  </section>;
}
