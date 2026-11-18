import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { adminService, userService, type AdminUserApiResponse } from '../../services';
import { adminCapabilities, adminMutations } from '../../services/adminModeration';
import { useAuthStore } from '../../store/useAuthStore';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { useAdminData } from '../../components/admin/AdminDataContext';
import { AdminPageHeader, AdminDataTable, AdminSearchInput, AdminFilter, AdminStatusBadge, AdminPagination, AdminRowMenu, AdminDetailDrawer, AdminFields, AdminAvatar, AdminConfirmDialog, AdminNotice, AdminEmptyState, AdminLoadingSkeleton, AdminErrorState, adminDate, adminNumber, AdminRoleBadge, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

function Identity({ user }: { user: AdminUserApiResponse }) {
  return <div className="admin-identity"><AdminAvatar name={user.displayName || user.username} src={user.avatarUrl} /><span><strong>{user.displayName || user.username}</strong><small>@{user.username}</small></span></div>;
}
function Profile({ username }: { username: string }) {
  const result = useAdminResource(useCallback(() => userService.getPublicProfile(username), [username]));
  if (result.loading) return <AdminLoadingSkeleton />;
  if (result.error) return <AdminErrorState error={result.error} retry={result.reload} />;
  return <AdminFields items={[['Giới thiệu', result.data?.bio || '—'], ['Địa điểm', result.data?.location || '—']]} />;
}
export default function UserManagementPage() {
  const query = useAdminQuery();
  const search = (query.params.get('search') || '').slice(0, 200);
  const status = ['ACTIVE', 'SUSPENDED'].includes(query.params.get('status') || '') ? query.params.get('status')! : '';
  const sort = query.params.get('sort') === 'createdAt,asc' ? 'createdAt,asc' : 'createdAt,desc';
  const role = ['USER', 'ADMIN'].includes(query.params.get('role') || '') ? query.params.get('role')! : '';
  const { page } = query;
  const size = 10;
  const result = useAdminResource(useCallback(() => adminService.listUsers({ page, size, search, status, role, sort }), [page, size, search, status, role, sort]));
  const [selected, setSelected] = useState<AdminUserApiResponse | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const current = useAuthStore(state => state.user);
  const summary = useAdminData();
  const openStatus = (user: AdminUserApiResponse) => {
    const locked = ['LOCKED', 'SUSPENDED'].includes(user.status);
    if (!locked && user.status !== 'ACTIVE') return;
    setAction({ title: locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản', label: locked ? 'Mở khóa' : 'Xác nhận khóa', danger: !locked, available: adminCapabilities.userStatus,
      description: `${locked ? 'Cho phép đăng nhập lại' : 'Tạm ngừng quyền truy cập'} đối với tài khoản @${user.username}.`,
      preview: <Identity user={user} />, execute: () => adminMutations.setUserStatus(user.id, locked ? 'ACTIVE' : 'LOCKED'), success: 'Đã cập nhật trạng thái tài khoản.' });
  };
  const canChangeStatus = (user: AdminUserApiResponse) =>
    ['ACTIVE', 'LOCKED', 'SUSPENDED'].includes(user.status);
  const columns: AdminColumn<AdminUserApiResponse>[] = [
    { key: 'user', label: 'Người dùng', render: user => <button className="admin-name-button" onClick={() => setSelected(user)}><Identity user={user} /></button> },
    { key: 'email', label: 'Email', render: user => user.email || '—', className: 'admin-wrap-cell' },
    { key: 'role', label: 'Vai trò', render: user => <AdminRoleBadge role={user.role} /> },
    { key: 'status', label: 'Trạng thái', render: user => <AdminStatusBadge status={user.status} label={user.status === 'PENDING' ? 'Chờ xác thực' : undefined} /> },
    { key: 'date', label: 'Ngày tham gia', numeric: true, render: user => adminDate(user.createdAt) },
    { key: 'actions', label: '', className: 'admin-actions-cell', render: user => <AdminRowMenu label={user.username}><button onClick={() => setSelected(user)}>Xem chi tiết</button><button disabled={current?.username === user.username || !canChangeStatus(user)} title={current?.username === user.username ? 'Không thể tự khóa tài khoản đang đăng nhập.' : !canChangeStatus(user) ? 'Chỉ tài khoản đang hoạt động hoặc đã khóa mới có thể đổi trạng thái.' : undefined} onClick={() => openStatus(user)}>{['LOCKED', 'SUSPENDED'].includes(user.status) ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</button></AdminRowMenu> },
  ];
  return <div className="admin-page"><AdminPageHeader title="Quản lý người dùng" description="Theo dõi tài khoản, trạng thái hoạt động và quyền truy cập." loading={result.loading} onRefresh={result.reload} />
    <div className="admin-table-toolbar"><AdminSearchInput value={search} onChange={value => query.update({ search: value }, true)} placeholder="Tìm username hoặc email…" label="Tìm người dùng" /><div className="admin-filter-bar"><AdminFilter label="Trạng thái" value={status} onChange={value => query.update({ status: value })} options={[[ '', 'Tất cả trạng thái'], ['ACTIVE', 'Đang hoạt động'], ['SUSPENDED', 'Đã khóa']]} /><div className={`admin-role-filter${role ? ' is-active' : ''}`}><AdminFilter label="Vai trò" value={role} onChange={value => query.update({ role: value })} options={[[ '', 'Tất cả vai trò'], ['USER', 'Người dùng'], ['ADMIN', 'Quản trị viên']]} /></div><AdminFilter label="Sắp xếp" value={sort} onChange={value => query.update({ sort: value })} options={[[ 'createdAt,desc', 'Mới nhất'], ['createdAt,asc', 'Cũ nhất']]} /></div></div>
    <div className="admin-list-meta"><span role="status">{result.loading ? 'Đang tải người dùng…' : result.error ? 'Chưa tải được danh sách' : `${adminNumber(result.data?.totalElements)} ${role === 'ADMIN' ? 'quản trị viên' : role === 'USER' ? 'người dùng' : 'tài khoản'}${search || status || role ? ' phù hợp' : ''}`}</span><span>10 tài khoản / trang</span>{(search || status || role) && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    <AdminDataTable rows={result.data?.content || []} columns={columns} rowKey={user => user.id} loading={result.loading} error={result.error} retry={result.reload} caption="Danh sách người dùng" empty={<AdminEmptyState title="Không tìm thấy người dùng" onReset={query.reset} />} />
    <AdminPagination hidePageSize result={result.data} page={page} size={size} disabled={result.loading || !!result.error} onChange={query.update} />
    {selected && !action && <AdminDetailDrawer title="Chi tiết người dùng" onClose={() => setSelected(null)}><Identity user={selected} /><AdminFields items={[[ 'ID tài khoản', selected.id], ['Email', selected.email], ['Trạng thái', <AdminStatusBadge status={selected.status} label={selected.status === 'PENDING' ? 'Chờ xác thực' : undefined} />], ['Vai trò', <AdminRoleBadge role={selected.role} />], ['Ngày tham gia', adminDate(selected.createdAt)]]} /><h2>Hồ sơ công khai</h2><Profile username={selected.username} /><Link className="admin-button" to={`/u/${encodeURIComponent(selected.username)}`}>Xem hồ sơ <ArrowUpRight size={15} /></Link><div className="admin-drawer-section"><h2>Quản lý tài khoản</h2>{current?.username === selected.username && <AdminNotice>Không thể tự khóa tài khoản đang đăng nhập.</AdminNotice>}<div className="admin-inline-actions"><button className="admin-button" disabled={current?.username === selected.username || !canChangeStatus(selected)} onClick={() => openStatus(selected)}>{['LOCKED', 'SUSPENDED'].includes(selected.status) ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</button></div></div></AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => { setSelected(null); result.reload(); summary.reload(); }} />}
  </div>;
}
