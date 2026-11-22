import { useCallback } from 'react';
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
  const showJoinRequests = params.get('tab') === 'join-requests';
  const reportType = params.get('type') === 'COMMENT' ? 'COMMENT' : 'POST';
  const { user, isAuthenticated } = useAuthStore();
  const community = useAdminResource(useCallback(() => communityService.getByName(communityName), [communityName]));
  const path = `/c/${encodeURIComponent(communityName)}`;

  if (community.loading) return <p className="utility-page py-8" role="status">Đang tải cộng đồng…</p>;
  const isOwner = Boolean(community.data && isCommunityOwner(community.data, user, isAuthenticated));
  const canReviewRequests = isAuthenticated && (isOwner || community.data?.currentUserRole === 'MODERATOR');

  if (!showJoinRequests && community.data?.name === communityName && isOwner) {
    return <Navigate to={`${path}/settings?tab=reports&type=${reportType}`} replace />;
  }

  return <section className="utility-page space-y-4 py-8">
    <Link to={path} className="text-sm hover:underline">Quay lại cộng đồng</Link>
    <h1 className="text-2xl font-semibold">{showJoinRequests ? 'Yêu cầu tham gia' : 'Báo cáo cộng đồng'}</h1>
    {canReviewRequests && <nav className="flex gap-4 text-sm" aria-label="Kiểm duyệt cộng đồng">
      <Link to={`${path}/moderation?tab=join-requests`} aria-current={showJoinRequests ? 'page' : undefined}>Yêu cầu tham gia</Link>
      <Link to={`${path}/moderation`} aria-current={!showJoinRequests ? 'page' : undefined}>Báo cáo</Link>
    </nav>}
    {community.error || !community.data ? <div role="alert" className="space-y-2">
      <p>{community.error || 'Không tìm thấy cộng đồng.'}</p>
      <Button size="sm" variant="secondary" onClick={community.reload}>Thử lại</Button>
    </div> : showJoinRequests ? (
      canReviewRequests ? <CommunityJoinRequestsPanel key={communityName} name={communityName} />
        : <p role="alert">Chỉ chủ cộng đồng và người điều hành mới có quyền xem yêu cầu tham gia.</p>
    ) : <CommunityReportsPanel key={`${communityName}:${reportType}`} name={communityName} canReview={false} />}
  </section>;
}
