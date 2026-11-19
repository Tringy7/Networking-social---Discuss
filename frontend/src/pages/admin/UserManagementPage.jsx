import { useCallback, useState } from 'react';
import { Eye } from 'lucide-react';
import { adminService } from '../../services';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import {
  AdminAvatar,
  AdminDataTable,
  AdminDetailDrawer,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminPageHeader,
  AdminPagination,
  AdminRoleBadge,
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

export default function UserManagementPage() {
  const query = useAdminQuery();
  const statusValue = query.params.get('status') || '';
  const roleValue = query.params.get('role') || '';
  const status = ['ACTIVE', 'SUSPENDED'].includes(statusValue) ? statusValue : '';
  const role = ['USER', 'ADMIN'].includes(roleValue) ? roleValue : '';
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => adminService.listUsers({ page, size, status, role }),
    [page, size, status, role],
  ));
  const users = result.data?.empty ? [] : result.data?.content || [];
  const [selected, setSelected] = useState(null);

  const columns = [
    {
      key: 'avatar',
      label: 'Avatar',
      render: user => <AdminAvatar name={user.displayName || user.username} src={user.avatarUrl} />,
    },
    {
      key: 'username',
      label: 'Username',
      render: user => <strong className="admin-user-username">@{user.username}</strong>,
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
      render: user => <button className="admin-user-view" type="button" onClick={() => setSelected(user)} aria-label={`Xem ${user.username}`} title="Xem chi tiết"><Eye size={17} /></button>,
    },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="User Management"
        description="Review account details, roles, and current status."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar admin-user-filters">
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
              : `${adminNumber(result.data?.totalElements)} users`}
        </span>
        {(status || role) && <button type="button" onClick={query.reset}>Clear filters</button>}
      </div>

      <AdminDataTable
        rows={users}
        columns={columns}
        rowKey={user => user.id}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Admin user list"
        empty={<AdminEmptyState title="No users found" description="Try changing the status or role filters." onReset={query.reset} />}
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
          <AdminFields items={[
            ['Username', `@${selected.username}`],
            ['Display Name', selected.displayName],
            ['Email', selected.email],
            ['Role', <AdminRoleBadge role={selected.role} />],
            ['Status', <AdminStatusBadge status={selected.status} />],
            ['Created At', adminDate(selected.createdAt)],
            ['User ID', selected.id],
          ]} />
        </AdminDetailDrawer>
      )}
    </div>
  );
}
