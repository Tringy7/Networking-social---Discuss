import { useCallback, useState } from 'react';
import { Eye, LockKeyhole, Unlock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EntityBanner from '../../components/ui/EntityBanner';
import { adminService } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import {
  AdminAvatar,
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailLink,
  AdminDetailPage,
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

export function UserDetailPage() {
  const { userId } = useParams();
  return <AdminDetailPage title="Hồ sơ người dùng" backTo="/admin/users" backLabel="Về danh sách người dùng">
    <UserDetailContent key={userId} userId={userId} />
  </AdminDetailPage>;
}

function UserDetailContent({ userId }) {
  const detail = useAdminResource(useCallback(() => adminService.getUserDetail(userId), [userId]));

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const user = detail.data;
  const profile = user.profile || {};
  const statistics = user.statistics || {};
  const displayName = profile.displayName || user.username;

  return (
    <div className="admin-user-detail">
      <header className="admin-record-hero">
        <EntityBanner variant="user" src={profile.banner} alt="" />
        <div className="admin-record-identity">
          <AdminAvatar name={displayName} src={profile.avatar} />
          <div><h2>{displayName}</h2><p>@{user.username}</p></div>
        </div>
      </header>
      <section className="admin-user-detail-section" aria-labelledby="admin-user-basic-title">
        <h2 id="admin-user-basic-title">Thông tin tài khoản</h2>
        <AdminFields items={[
          ['ID người dùng', user.userId],
          ['Ngày tham gia', adminDate(user.joinedAt)],
        ]} />
      </section>

      <section className="admin-user-detail-section" aria-labelledby="admin-user-profile-title">
        <h2 id="admin-user-profile-title">Giới thiệu</h2>
        <AdminFields items={[
          ['Tiểu sử', profile.bio || '—'],
          ['Ngày sinh', profile.dateOfBirth ? adminDate(profile.dateOfBirth) : '—'],
          ['Giới tính', profile.gender],
          ['Địa điểm', profile.location],
        ]} />
      </section>

      <section className="admin-user-detail-section" aria-labelledby="admin-user-statistics-title">
        <h2 id="admin-user-statistics-title">Hoạt động</h2>
        <div className="admin-user-stat-grid">
          <div><span>Bài viết</span><strong>{adminNumber(statistics.postCount)}</strong></div>
          <div><span>Bình luận</span><strong>{adminNumber(statistics.commentCount)}</strong></div>
          <div><span>Cộng đồng</span><strong>{adminNumber(statistics.communityCount)}</strong></div>
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
  const [action, setAction] = useState(null);
  const currentUsername = useAuthStore(state => state.user?.username);

  const requestLock = user => setAction({
    title: 'Khóa tài khoản',
    label: 'Khóa tài khoản',
    danger: true,
    description: `The account @${user.username} will be locked and its access suspended. Continue?`,
    preview: <UserIdentity user={user} />,
    execute: () => adminService.lockUser(user.id),
    success: `Account @${user.username} locked successfully.`,
  });
  const requestUnlock = user => setAction({
    title: 'Mở khóa tài khoản',
    label: 'Mở khóa tài khoản',
    description: `The account @${user.username} will be unlocked and access restored. Continue?`,
    preview: <UserIdentity user={user} />,
    execute: () => adminService.unlockUser(user.id),
    success: `Account @${user.username} unlocked successfully.`,
  });

  const columns = [
    {
      key: 'avatar',
      label: 'Ảnh đại diện',
      render: user => <AdminAvatar name={user.displayName || user.username} src={user.avatarUrl} />,
    },
    {
      key: 'username',
      label: 'Tên người dùng',
      render: user => <AdminDetailLink className="admin-name-button" to={`/admin/users/${user.id}`}><strong>@{user.username}</strong></AdminDetailLink>,
    },
    {
      key: 'displayName',
      label: 'Tên hiển thị',
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
      label: 'Vai trò',
      render: user => <AdminRoleBadge role={user.role} />,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: user => <AdminStatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: user => adminDate(user.createdAt),
    },
    {
      key: 'action',
      label: 'Thao tác',
      className: 'admin-actions-cell',
      render: user => <div className="admin-user-actions">
        <AdminDetailLink className="admin-user-view" to={`/admin/users/${user.id}`} aria-label={`Xem hồ sơ ${user.username}`} title="Xem hồ sơ"><Eye size={17} aria-hidden="true" /></AdminDetailLink>
        {user.status === 'ACTIVE' && <button className="admin-user-lock" type="button" disabled={user.username === currentUsername} onClick={() => requestLock(user)} title={user.username === currentUsername ? 'Bạn không thể khóa tài khoản của mình.' : 'Khóa tài khoản'}><LockKeyhole size={14} /><span>Khóa</span></button>}
        {user.status === 'SUSPENDED' && <button className="admin-user-unlock" type="button" onClick={() => requestUnlock(user)} title="Mở khóa tài khoản"><Unlock size={14} /><span>Mở khóa</span></button>}
      </div>,
    },
  ];

  return (
    <div className="admin-page admin-user-management">
      <AdminPageHeader
        title="Quản lý người dùng"
        description="Tra cứu tài khoản, vai trò và trạng thái."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar admin-user-filters">
        <AdminSearchInput
          value={search}
          onChange={value => query.update({ search: value }, true)}
          placeholder="Tìm theo tên người dùng hoặc email…"
          label="Tìm người dùng"
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
              ['SUSPENDED', 'Đã khóa'],
            ]}
          />
          <AdminFilter
            label="Vai trò"
            value={role}
            onChange={value => query.update({ role: value })}
            options={[
              ['', 'Tất cả vai trò'],
              ['USER', 'Người dùng'],
              ['ADMIN', 'Quản trị viên'],
            ]}
          />
        </div>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải người dùng…'
            : result.error
              ? 'Không thể tải người dùng'
              : `${adminNumber(result.data?.totalElements)} ${search ? 'người dùng phù hợp' : 'người dùng'}`}
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
        caption="Danh sách người dùng"
        empty={<AdminEmptyState title="Không tìm thấy người dùng" description={search ? 'Không có tài khoản khớp từ khóa và bộ lọc.' : 'Thử chọn trạng thái hoặc vai trò khác.'} onReset={query.reset} />}
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
