import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, adminCapabilities, paginate, type AdminCommunity } from '../../services/adminModeration';
import { CommunityPreview } from '../../components/admin/AdminPreviews';
import { AdminPageHeader, AdminSearchInput, AdminFilter, AdminNotice, AdminDataTable, AdminEmptyState, AdminPagination, AdminStatusBadge, AdminAvatar, AdminRowMenu, AdminDetailDrawer, AdminConfirmDialog, adminDate, adminNumber, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

export default function CommunityManagementPage() {
  const query = useAdminQuery();
  const search = query.params.get('search') || '';
  const status = query.params.get('status') === 'BANED' ? 'BANED' : 'ACTIVE';
  const result = useAdminResource(useCallback(() => status === 'ACTIVE' ? adminModeration.activeCommunities() : Promise.resolve([]), [status]));
  const [selected, setSelected] = useState<AdminCommunity | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const page = useMemo(() => paginate((result.data || []).filter(community => community.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())), query.page, query.size), [result.data, search, query.page, query.size]);
  const toggle = (community: AdminCommunity) => {
    const banned = ['BANED', 'BANNED'].includes(community.status || community.communityStatus || '');
    setAction({ title: banned ? 'Mở lại cộng đồng' : 'Cấm cộng đồng', description: `${banned ? 'Cho phép hoạt động lại' : 'Tạm dừng hoạt động'} đối với cộng đồng c/${community.name}. Tên cộng đồng và nội dung không tự động bị xóa.`, label: banned ? 'Mở lại cộng đồng' : 'Xác nhận cấm', available: adminCapabilities.communityStatus, danger: !banned, execute: () => adminMutations.setCommunityStatus(community.name, banned ? 'ACTIVE' : 'BANED'), success: 'Đã cập nhật trạng thái cộng đồng.' });
  };
  const columns: AdminColumn<AdminCommunity>[] = [
    { key: 'name', label: 'Cộng đồng', render: row => <button className="admin-name-button" onClick={() => setSelected(row)}><div className="admin-identity"><AdminAvatar name={row.name} src={row.avatarUrl} square /><span><strong>c/{row.name}</strong><small>{row.visibility === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}</small></span></div></button> },
    { key: 'owner', label: 'Chủ sở hữu', render: row => row.owner?.username || <button className="admin-text-action" onClick={() => setSelected(row)}>Xem chi tiết</button> },
    { key: 'category', label: 'Danh mục', render: row => row.categoryName || '—' },
    { key: 'members', label: 'Thành viên', numeric: true, render: row => adminNumber(row.memberCount) },
    { key: 'status', label: 'Trạng thái', render: row => <AdminStatusBadge status={row.communityStatus || row.status} /> },
    { key: 'date', label: 'Ngày tạo', numeric: true, render: row => adminDate(row.createdAt) },
    { key: 'actions', label: '', className: 'admin-actions-cell', render: row => <AdminRowMenu label={row.name}><button onClick={() => setSelected(row)}>Xem chi tiết</button><Link to={`/c/${encodeURIComponent(row.name)}`}>Mở cộng đồng</Link><button onClick={() => toggle(row)}>Cấm / mở lại cộng đồng</button></AdminRowMenu> },
  ];
  return <div className="admin-page"><AdminPageHeader title="Quản lý cộng đồng" description="Giám sát và quản lý các cộng đồng trên DISCUSS." loading={result.loading} onRefresh={result.reload} />
    <AdminNotice>Danh sách hiện cung cấp các cộng đồng đang hoạt động. Danh sách đầy đủ mọi trạng thái và thao tác cấm / mở lại chưa khả dụng.</AdminNotice>
    <div className="admin-table-toolbar"><AdminSearchInput value={search} onChange={value => query.update({ search: value }, true)} label="Tìm cộng đồng" placeholder="Tìm theo tên cộng đồng…" /><AdminFilter label="Trạng thái" value={status} options={[[ 'ACTIVE', 'Đang hoạt động'], ['BANED', 'Đã cấm · chưa hỗ trợ danh sách']]} onChange={value => query.update({ status: value })} /></div>
    <div className="admin-list-meta"><span role="status">{status === 'BANED' ? 'Danh sách cộng đồng bị cấm chưa khả dụng' : result.loading ? 'Đang tải cộng đồng…' : result.error ? 'Chưa tải được danh sách' : `${adminNumber(page.totalElements)} cộng đồng đang hoạt động`}</span>{search && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    {status === 'BANED' ? <AdminEmptyState title="Chưa thể xem danh sách cộng đồng bị cấm" description="Bạn vẫn có thể xem tổng số cộng đồng bị cấm trong trang Tổng quan." onReset={query.reset} /> : <AdminDataTable rows={page.content} columns={columns} rowKey={row => row.id} loading={result.loading} error={result.error} retry={result.reload} caption="Danh sách cộng đồng đang hoạt động" empty={<AdminEmptyState title="Không tìm thấy cộng đồng" onReset={query.reset} />} />}
    <AdminPagination result={status === 'BANED' || result.loading || result.error ? null : page} page={query.page} size={query.size} disabled={status === 'BANED' || result.loading || !!result.error} onChange={query.update} />
    {selected && !action && <AdminDetailDrawer title="Chi tiết cộng đồng" onClose={() => setSelected(null)}><CommunityPreview name={selected.name} /><div className="admin-drawer-section"><h2>Kiểm duyệt cộng đồng</h2><AdminNotice>Thao tác cấm / mở lại cộng đồng chưa được hỗ trợ.</AdminNotice><button className="admin-button admin-button-danger-outline" onClick={() => toggle(selected)}>Cấm / mở lại cộng đồng</button></div></AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => { setSelected(null); result.reload(); }} />}
  </div>;
}
