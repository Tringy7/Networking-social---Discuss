import { useCallback } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { communityService } from '../../services';
import useAdminResource from '../../hooks/useAdminResource';
import CommunityReportsPanel from '../../components/community/CommunityReportsPanel';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { isCommunityOwner } from '../../utils/communityMedia';

export default function CommunityModerationPage() {
  const { communityName = '' } = useParams();
  const [params] = useSearchParams();
  const reportType = params.get('type') === 'COMMENT' ? 'COMMENT' : 'POST';
  const { user, isAuthenticated } = useAuthStore();
  const community = useAdminResource(useCallback(() => communityService.getByName(communityName), [communityName]));
  const path = `/c/${encodeURIComponent(communityName)}`;

  if (community.loading) return <p className="utility-page py-8" role="status">Đang tải cộng đồng…</p>;
  if (community.data?.name === communityName && isCommunityOwner(community.data, user, isAuthenticated)) {
    return <Navigate to={`${path}/settings?tab=reports&type=${reportType}`} replace />;
  }

  return <section className="utility-page space-y-4 py-8">
    <Link to={path} className="text-sm hover:underline">Quay lại cộng đồng</Link>
    <h1 className="text-2xl font-semibold">Báo cáo cộng đồng</h1>
    {community.error || !community.data ? <div role="alert" className="space-y-2">
      <p>{community.error || 'Không tìm thấy cộng đồng.'}</p>
      <Button size="sm" variant="secondary" onClick={community.reload}>Thử lại</Button>
    </div> : <CommunityReportsPanel key={`${communityName}:${reportType}`} name={communityName} canReview={false} />}
  </section>;
}
