import { useCallback, useState } from 'react';
import { Eye } from 'lucide-react';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { listAdminCommunities, searchAdminCommunities } from '../../services/adminCommunityService.js';
import {
  AdminAvatar,
  AdminDataTable,
  AdminDetailDrawer,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminStatusBadge,
  adminDate,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

function CommunityIdentity({ community }) {
  return (
    <div className="admin-identity">
      <AdminAvatar name={community.name || 'Community'} src={community.avatarUrl} square />
      <span><strong>c/{community.name}</strong></span>
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
  const [selected, setSelected] = useState(null);

  const columns = [
    {
      key: 'avatar',
      label: 'Community Avatar',
      render: community => <AdminAvatar name={community.name || 'Community'} src={community.avatarUrl} square />,
    },
    {
      key: 'name',
      label: 'Community Name',
      render: community => <button className="admin-name-button" type="button" onClick={() => setSelected(community)}><strong>c/{community.name}</strong></button>,
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
      render: community => <button className="admin-community-view" type="button" onClick={() => setSelected(community)} aria-label={`View c/${community.name}`} title="View details"><Eye size={17} /></button>,
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

      {selected && (
        <AdminDetailDrawer title="Community details" onClose={() => setSelected(null)}>
          <CommunityIdentity community={selected} />
          <AdminFields items={[
            ['Community Name', `c/${selected.name}`],
            ['Description', selected.description || '—'],
            ['Category', selected.categoryName],
            ['Visibility', selected.visibility === 'PRIVATE' ? 'Private' : selected.visibility === 'PUBLIC' ? 'Public' : '—'],
            ['Status', <AdminStatusBadge status={selected.status} />],
            ['Member Count', adminNumber(selected.memberCount)],
            ['Owner', selected.owner?.displayName || selected.owner?.username || '—'],
            ['Created At', adminDate(selected.createdAt)],
          ]} />
        </AdminDetailDrawer>
      )}
    </div>
  );
}
