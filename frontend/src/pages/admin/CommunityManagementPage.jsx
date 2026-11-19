import { useCallback, useState } from 'react';
import { Eye, Image as ImageIcon, LockKeyhole, UserRound } from 'lucide-react';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminCommunityDetail, listAdminCommunities, lockAdminCommunity, searchAdminCommunities } from '../../services/adminCommunityService.js';
import {
  AdminAvatar,
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailDrawer,
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

function CommunityDetailContent({ communityId }) {
  const detail = useAdminResource(useCallback(() => getAdminCommunityDetail(communityId), [communityId]));

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const community = detail.data;
  const owner = community.owner || {};

  return (
    <div className="admin-community-detail">
      <section className="admin-community-detail-section" aria-labelledby="admin-community-information-title">
        <h2 id="admin-community-information-title">Community information</h2>
        <div className="admin-community-detail-media">
          {community.avatarUrl
            ? <img className="admin-community-detail-avatar" src={community.avatarUrl} alt={`c/${community.name} avatar`} />
            : <div className="admin-community-detail-avatar-placeholder"><UserRound size={24} aria-hidden="true" /><span>No avatar</span></div>}
          {community.bannerUrl
            ? <img className="admin-community-detail-banner" src={community.bannerUrl} alt={`c/${community.name} banner`} />
            : <div className="admin-community-detail-banner-placeholder"><ImageIcon size={20} aria-hidden="true" /><span>No banner</span></div>}
        </div>
        <AdminFields items={[
          ['Community ID', community.id],
          ['Community Name', `c/${community.name}`],
          ['Description', community.description || '—'],
          ['Rules', community.rules || '—'],
          ['Category ID', community.categoryId],
          ['Category Name', community.categoryName],
          ['Visibility', community.visibility === 'PUBLIC' ? 'Public' : community.visibility === 'PRIVATE' ? 'Private' : '—'],
          ['Status', <AdminStatusBadge status={community.status} />],
          ['Member Count', adminNumber(community.memberCount)],
          ['Created At', adminDate(community.createdAt)],
        ]} />
      </section>

      <section className="admin-community-detail-section" aria-labelledby="admin-community-owner-title">
        <h2 id="admin-community-owner-title">Owner</h2>
        <div className="admin-community-owner-profile">
          {owner.avatarUrl
            ? <img className="admin-community-owner-avatar" src={owner.avatarUrl} alt={`${owner.displayName || owner.username || 'Owner'} avatar`} />
            : <div className="admin-community-owner-avatar-placeholder"><UserRound size={21} aria-hidden="true" /><span>No avatar</span></div>}
          <AdminFields items={[
            ['User ID', owner.userId],
            ['Username', owner.username ? `@${owner.username}` : '—'],
            ['Display Name', owner.displayName],
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
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState(null);

  const requestLock = community => setAction({
    title: 'Lock community',
    label: 'Lock community',
    danger: true,
    description: `The community c/${community.name} will be locked and its status changed to BANED. Continue?`,
    execute: () => lockAdminCommunity(community.id),
    success: `Community c/${community.name} locked successfully.`,
  });

  const columns = [
    {
      key: 'avatar',
      label: 'Community Avatar',
      render: community => <AdminAvatar name={community.name || 'Community'} src={community.avatarUrl} square />,
    },
    {
      key: 'name',
      label: 'Community Name',
      render: community => <button className="admin-name-button" type="button" onClick={() => setSelectedId(community.id)}><strong>c/{community.name}</strong></button>,
      className: 'admin-title-cell',
    },
    {
      key: 'description',
      label: 'Description',
      render: community => <span className="admin-community-description">{community.description || '—'}</span>,
      className: 'admin-wrap-cell',
    },
    {
      key: 'category',
      label: 'Category',
      render: community => community.categoryName || '—',
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: community => community.visibility === 'PRIVATE' ? 'Private' : community.visibility === 'PUBLIC' ? 'Public' : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: community => <AdminStatusBadge status={community.status} />,
    },
    {
      key: 'members',
      label: 'Member Count',
      numeric: true,
      render: community => adminNumber(community.memberCount),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: community => community.owner?.displayName || community.owner?.username || '—',
      className: 'admin-wrap-cell',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      numeric: true,
      render: community => adminDate(community.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'admin-actions-cell',
      render: community => <div className="admin-community-actions">
        <button className="admin-community-view" type="button" onClick={() => setSelectedId(community.id)} aria-label={`View c/${community.name}`} title="View details"><Eye size={17} /></button>
        {community.status === 'ACTIVE' && <button className="admin-community-lock" type="button" onClick={() => requestLock(community)} title="Lock community"><LockKeyhole size={14} /><span>Lock</span></button>}
      </div>,
    },
  ];

  return (
    <div className="admin-page admin-community-management">
      <AdminPageHeader
        title="Community Management"
        description="Review community profiles, visibility, and activity."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar admin-community-filters">
        <AdminSearchInput
          value={search}
          onChange={value => query.update({ search: value }, true)}
          placeholder="Search community name…"
          label="Search communities"
          maxLength={200}
        />
        <div className="admin-filter-bar">
          <AdminFilter
            label="Status"
            value={status}
            onChange={value => query.update({ status: value })}
            options={[
              ['', 'All statuses'],
              ['ACTIVE', 'Active'],
              ['BANED', 'Baned'],
            ]}
          />
          <AdminFilter
            label="Visibility"
            value={visibility}
            onChange={value => query.update({ visibility: value })}
            options={[
              ['', 'All visibility'],
              ['PUBLIC', 'Public'],
              ['PRIVATE', 'Private'],
            ]}
          />
        </div>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Loading communities…'
            : result.error
              ? 'Could not load communities'
              : `${adminNumber(result.data?.totalElements)} ${search ? 'matching communities' : 'communities'}`}
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
        caption="Admin community list"
        empty={<AdminEmptyState title="No communities found" description={search ? 'No communities match this search and the selected filters.' : 'Try changing the status or visibility filters.'} onReset={query.reset} />}
      />

      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />

      {selectedId != null && (
        <AdminDetailDrawer title="Community details" onClose={() => setSelectedId(null)}>
          <CommunityDetailContent communityId={selectedId} />
        </AdminDetailDrawer>
      )}

      {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={result.reload} />}
    </div>
  );
}
