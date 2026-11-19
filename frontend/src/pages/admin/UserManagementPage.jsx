import { useCallback, useState } from 'react';
import { Eye, Image as ImageIcon, LockKeyhole, UserRound } from 'lucide-react';
import { adminService } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import {
  AdminAvatar,
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailDrawer,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminErrorState,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminPagination,
  AdminRoleBadge,
  AdminSearchInput,
  AdminStatusBadge,
  adminDate,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

function UserIdentity({ user }) {
  return (
    <div className="admin-identity">
      <AdminAvatar name={user.displayName || user.username} src={user.avatarUrl} />
      <span><strong>@{user.username}</strong></span>
    </div>
  );
}

function UserDetailContent({ userId }) {
  const detail = useAdminResource(useCallback(() => adminService.getUserDetail(userId), [userId]));

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const user = detail.data;
  const profile = user.profile || {};
  const statistics = user.statistics || {};

  return (
    <div className="admin-user-detail">
      <section className="admin-user-detail-section" aria-labelledby="admin-user-basic-title">
        <h2 id="admin-user-basic-title">Basic information</h2>
        <AdminFields items={[
          ['User ID', user.userId],
          ['Username', `@${user.username}`],
          ['Joined At', adminDate(user.joinedAt)],
        ]} />
      </section>

      <section className="admin-user-detail-section" aria-labelledby="admin-user-profile-title">
        <h2 id="admin-user-profile-title">Profile</h2>
        <div className="admin-user-profile-media">
          {profile.avatar
            ? <img className="admin-user-avatar-image" src={profile.avatar} alt={`${profile.displayName || user.username} avatar`} />
            : <div className="admin-user-avatar-placeholder"><UserRound size={24} aria-hidden="true" /><span>No avatar</span></div>}
          {profile.banner
            ? <img className="admin-user-banner-image" src={profile.banner} alt={`${profile.displayName || user.username} banner`} />
            : <div className="admin-user-banner-placeholder"><ImageIcon size={20} aria-hidden="true" /><span>No banner</span></div>}
        </div>
        <AdminFields items={[
          ['Display Name', profile.displayName],
          ['Bio', profile.bio || '—'],
          ['Date Of Birth', profile.dateOfBirth ? adminDate(profile.dateOfBirth) : '—'],
          ['Gender', profile.gender],
          ['Location', profile.location],
        ]} />
      </section>

      <section className="admin-user-detail-section" aria-labelledby="admin-user-statistics-title">
        <h2 id="admin-user-statistics-title">Statistics</h2>
        <div className="admin-user-stat-grid">
          <div><span>Post Count</span><strong>{adminNumber(statistics.postCount)}</strong></div>
          <div><span>Comment Count</span><strong>{adminNumber(statistics.commentCount)}</strong></div>
          <div><span>Community Count</span><strong>{adminNumber(statistics.communityCount)}</strong></div>
        </div>
      </section>
    </div>
  );
}

export default function UserManagementPage() {
  const query = useAdminQuery();
  const statusValue = query.params.get('status') || '';
  const roleValue = query.params.get('role') || '';
  const status = ['ACTIVE', 'SUSPENDED'].includes(statusValue) ? statusValue : '';
  const role = ['USER', 'ADMIN'].includes(roleValue) ? roleValue : '';
  const search = (query.params.get('search') || '').trim().slice(0, 200);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => search
      ? adminService.searchUsers({ search, page, size, status, role })
      : adminService.listUsers({ page, size, status, role }),
    [page, size, search, status, role],
  ));
  const users = result.data?.empty ? [] : result.data?.content || [];
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const currentUsername = useAuthStore(state => state.user?.username);

  const requestLock = user => setAction({
    title: 'Lock user account',
    label: 'Lock account',
    danger: true,
    description: `The account @${user.username} will be locked and its access suspended. Continue?`,
    preview: <UserIdentity user={user} />,
    execute: () => adminService.lockUser(user.id),
    success: `Account @${user.username} locked successfully.`,
  });

  const columns = [
    {
      key: 'avatar',
      label: 'Avatar',
      render: user => <AdminAvatar name={user.displayName || user.username} src={user.avatarUrl} />,
    },
    {
      key: 'username',
      label: 'Username',
      render: user => <button className="admin-name-button" type="button" onClick={() => setSelected(user)}><strong>@{user.username}</strong></button>,
    },
    {
      key: 'displayName',
      label: 'Display Name',
      render: user => user.displayName || '—',
      className: 'admin-wrap-cell',
    },
    {
      key: 'email',
      label: 'Email',
      render: user => user.email || '—',
      className: 'admin-wrap-cell',
    },
    {
      key: 'role',
      label: 'Role',
      render: user => <AdminRoleBadge role={user.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: user => <AdminStatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: user => adminDate(user.createdAt),
    },
    {
      key: 'action',
      label: 'Action',
      className: 'admin-actions-cell',
      render: user => <div className="admin-user-actions">
        <button className="admin-user-view" type="button" onClick={() => setSelected(user)} aria-label={`Xem ${user.username}`} title="View details"><Eye size={17} /></button>
        {user.status === 'ACTIVE' && <button className="admin-user-lock" type="button" disabled={user.username === currentUsername} onClick={() => requestLock(user)} title={user.username === currentUsername ? 'You cannot lock your own account.' : 'Lock account'}><LockKeyhole size={14} /><span>Lock</span></button>}
      </div>,
    },
  ];

  return (
    <div className="admin-page admin-user-management">
      <AdminPageHeader
        title="User Management"
        description="Review account details, roles, and current status."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar admin-user-filters">
        <AdminSearchInput
          value={search}
          onChange={value => query.update({ search: value }, true)}
          placeholder="Search username or email…"
          label="Search users"
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
              ['SUSPENDED', 'Suspended'],
            ]}
          />
          <AdminFilter
            label="Role"
            value={role}
            onChange={value => query.update({ role: value })}
            options={[
              ['', 'All roles'],
              ['USER', 'User'],
              ['ADMIN', 'Admin'],
            ]}
          />
        </div>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Loading users…'
            : result.error
              ? 'Could not load users'
              : `${adminNumber(result.data?.totalElements)} ${search ? 'matching users' : 'users'}`}
        </span>
        {(status || role || search) && <button type="button" onClick={query.reset}>Clear filters</button>}
      </div>

      <AdminDataTable
        rows={users}
        columns={columns}
        rowKey={user => user.id}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Admin user list"
        empty={<AdminEmptyState title="No users found" description={search ? 'No accounts match this search and the selected filters.' : 'Try changing the status or role filters.'} onReset={query.reset} />}
      />

      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />

      {selected && (
        <AdminDetailDrawer title="User details" onClose={() => setSelected(null)}>
          <UserIdentity user={selected} />
          <UserDetailContent userId={selected.id} />
        </AdminDetailDrawer>
      )}

      {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={result.reload} />}
    </div>
  );
}
