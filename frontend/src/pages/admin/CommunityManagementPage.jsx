import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, LockKeyhole, Unlock } from 'lucide-react';
import EntityBanner from '../../components/ui/EntityBanner';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminCommunityDetail, listAdminCommunities, lockAdminCommunity, searchAdminCommunities, unlockAdminCommunity } from '../../services/adminCommunityService.js';
import {
  AdminAvatar,
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailLink,
  AdminDetailPage,
  AdminErrorState,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminStatusBadge,
  adminDate,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

export function CommunityDetailPage() {
  const { communityId } = useParams();
  return <AdminDetailPage title="Hồ sơ cộng đồng" backTo="/admin/communities" backLabel="Về danh sách cộng đồng">
    <CommunityDetailContent key={communityId} communityId={communityId} />
  </AdminDetailPage>;
}

function CommunityDetailContent({ communityId }) {
  const detail = useAdminResource(useCallback(() => getAdminCommunityDetail(communityId), [communityId]));

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const community = detail.data;
  const owner = community.owner || {};

  return (
    <div className="admin-community-detail">
      <header className="admin-record-hero">
        <EntityBanner variant="community" src={community.bannerUrl} alt="" />
        <div className="admin-record-identity">
          <AdminAvatar name={community.name} src={community.avatarUrl} square />
          <div><h2>c/{community.name}</h2><p>{community.categoryName}</p></div>
          <AdminStatusBadge status={community.status} />
        </div>
      </header>
      <section className="admin-community-detail-section" aria-labelledby="admin-community-information-title">
        <h2 id="admin-community-information-title">Thông tin cộng đồng</h2>
        <AdminFields items={[
          ['ID cộng đồng', community.id],
          ['Mô tả', community.description || '—'],
          ['Nội quy', community.rules || '—'],
          ['ID danh mục', community.categoryId],
          ['Quyền hiển thị', community.visibility === 'PUBLIC' ? 'Công khai' : community.visibility === 'PRIVATE' ? 'Riêng tư' : '—'],
          ['Thành viên', adminNumber(community.memberCount)],
          ['Ngày tạo', adminDate(community.createdAt)],
        ]} />
      </section>

      <section className="admin-community-detail-section" aria-labelledby="admin-community-owner-title">
        <h2 id="admin-community-owner-title">Chủ cộng đồng</h2>
        <div className="admin-community-owner-profile">
          <AdminAvatar name={owner.displayName || owner.username || 'Chủ cộng đồng'} src={owner.avatarUrl} />
          <AdminFields items={[
            ['ID người dùng', owner.userId],
            ['Tên người dùng', owner.username ? `@${owner.username}` : '—'],
            ['Tên hiển thị', owner.displayName],
          ]} />
        </div>
      </section>
    </div>
  );
}

export default function CommunityManagementPage() {
  const query = useAdminQuery();
  const statusValue = query.params.get('status') || '';
  const visibilityValue = query.params.get('visibility') || '';
  const status = ['ACTIVE', 'BANED'].includes(statusValue) ? statusValue : '';
  const visibility = ['PUBLIC', 'PRIVATE'].includes(visibilityValue) ? visibilityValue : '';
  const search = (query.params.get('search') || '').trim().slice(0, 200);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => search
      ? searchAdminCommunities({ search, page, size, status, visibility })
      : listAdminCommunities({ page, size, status, visibility }),
    [page, size, search, status, visibility],
  ));
  const communities = result.data?.empty ? [] : result.data?.content || [];
  const [action, setAction] = useState(null);

  const requestLock = community => setAction({
    title: 'Khóa cộng đồng',
    label: 'Khóa cộng đồng',
    danger: true,
    description: `The community c/${community.name} will be locked and its status changed to BANED. Continue?`,
    execute: () => lockAdminCommunity(community.id),
    success: `Community c/${community.name} locked successfully.`,
  });
  const requestUnlock = community => setAction({
    title: 'Mở lại cộng đồng',
    label: 'Mở lại cộng đồng',
    description: `The community c/${community.name} will be unlocked and its status changed to ACTIVE. Continue?`,
    execute: () => unlockAdminCommunity(community.id),
    success: `Community c/${community.name} unlocked successfully.`,
  });

  const columns = [
    {
      key: 'avatar',
      label: 'Ảnh đại diện',
      render: community => <AdminAvatar name={community.name || 'Community'} src={community.avatarUrl} square />,
    },
    {
      key: 'name',
      label: 'Tên cộng đồng',
      render: community => <AdminDetailLink className="admin-name-button" to={`/admin/communities/${community.id}`}><strong>c/{community.name}</strong></AdminDetailLink>,
      className: 'admin-title-cell',
    },
    {
      key: 'description',
      label: 'Mô tả',
      render: community => <span className="admin-community-description">{community.description || '—'}</span>,
      className: 'admin-wrap-cell',
    },
    {
      key: 'category',
      label: 'Danh mục',
      render: community => community.categoryName || '—',
    },
    {
      key: 'visibility',
      label: 'Quyền hiển thị',
      render: community => community.visibility === 'PRIVATE' ? 'Riêng tư' : community.visibility === 'PUBLIC' ? 'Công khai' : '—',
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: community => <AdminStatusBadge status={community.status} />,
    },
    {
      key: 'members',
      label: 'Thành viên',
      numeric: true,
      render: community => adminNumber(community.memberCount),
    },
    {
      key: 'owner',
      label: 'Chủ cộng đồng',
      render: community => community.owner?.displayName || community.owner?.username || '—',
      className: 'admin-wrap-cell',
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      numeric: true,
      render: community => adminDate(community.createdAt),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'admin-actions-cell',
      render: community => <div className="admin-community-actions">
        <AdminDetailLink className="admin-community-view" to={`/admin/communities/${community.id}`} aria-label={`Xem hồ sơ c/${community.name}`} title="Xem hồ sơ"><Eye size={17} aria-hidden="true" /></AdminDetailLink>
        {community.status === 'ACTIVE' && <button className="admin-community-lock" type="button" onClick={() => requestLock(community)} title="Khóa cộng đồng"><LockKeyhole size={14} /><span>Khóa</span></button>}
        {community.status === 'BANED' && <button className="admin-community-unlock" type="button" onClick={() => requestUnlock(community)} title="Mở lại cộng đồng"><Unlock size={14} /><span>Mở lại</span></button>}
      </div>,
    },
  ];

  return (
    <div className="admin-page admin-community-management">
      <AdminPageHeader
        title="Quản lý cộng đồng"
        description="Tra cứu cộng đồng, quyền hiển thị và trạng thái."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar admin-community-filters">
        <AdminSearchInput
          value={search}
          onChange={value => query.update({ search: value }, true)}
          placeholder="Tìm theo tên cộng đồng…"
          label="Tìm cộng đồng"
          maxLength={200}
        />
        <div className="admin-filter-bar">
          <AdminFilter
            label="Trạng thái"
            value={status}
            onChange={value => query.update({ status: value })}
            options={[
              ['', 'Tất cả trạng thái'],
              ['ACTIVE', 'Đang hoạt động'],
              ['BANED', 'Đã cấm'],
            ]}
          />
          <AdminFilter
            label="Quyền hiển thị"
            value={visibility}
            onChange={value => query.update({ visibility: value })}
            options={[
              ['', 'Tất cả quyền hiển thị'],
              ['PUBLIC', 'Công khai'],
              ['PRIVATE', 'Riêng tư'],
            ]}
          />
        </div>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải cộng đồng…'
            : result.error
              ? 'Không thể tải cộng đồng'
              : `${adminNumber(result.data?.totalElements)} ${search ? 'cộng đồng phù hợp' : 'cộng đồng'}`}
        </span>
        {(search || status || visibility) && <button type="button" onClick={query.reset}>Clear filters</button>}
      </div>

      <AdminDataTable
        rows={communities}
        columns={columns}
        rowKey={community => community.id}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Danh sách cộng đồng"
        empty={<AdminEmptyState title="Không tìm thấy cộng đồng" description={search ? 'Không có cộng đồng khớp từ khóa và bộ lọc.' : 'Thử chọn trạng thái hoặc quyền hiển thị khác.'} onReset={query.reset} />}
      />

      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />

      {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={result.reload} />}
    </div>
  );
}
