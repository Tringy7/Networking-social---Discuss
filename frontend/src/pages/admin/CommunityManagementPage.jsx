import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, adminCapabilities } from '../../services/adminModeration';
import { CommunityPreview } from '../../components/admin/AdminPreviews.jsx';
import { AdminPageHeader, AdminSearchInput, AdminFilter, AdminDataTable, AdminEmptyState, AdminPagination, AdminStatusBadge, AdminAvatar, AdminRowMenu, AdminDetailDrawer, AdminConfirmDialog, adminDate, adminNumber } from '../../components/admin/AdminUI.jsx';
export default function CommunityManagementPage() {
  const query = useAdminQuery();
  const search = query.params.get('search') || '';
  const status = query.params.get('status') || '';
  const visibility = query.params.get('visibility') || '';
  const size = 10;
  const result = useAdminResource(useCallback(() => adminModeration.communities({
    page: query.page,
    size,
    search,
    status,
    visibility
  }), [query.page, search, status, visibility]));
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const page = result.data;
  const toggle = community => {
    const banned = ['BANED', 'BANNED'].includes(community.status || community.communityStatus || '');
    setAction({
      title: banned ? 'Mở lại cộng đồng' : 'Cấm cộng đồng',
      description: `${banned ? 'Cho phép hoạt động lại' : 'Tạm dừng hoạt động'} đối với cộng đồng c/${community.name}. Tên cộng đồng và nội dung không tự động bị xóa.`,
      label: banned ? 'Mở lại cộng đồng' : 'Xác nhận cấm',
      available: adminCapabilities.communityStatus,
      danger: !banned,
      execute: () => adminMutations.setCommunityStatus(community.id, banned ? 'ACTIVE' : 'BANED'),
      success: 'Đã cập nhật trạng thái cộng đồng.'
    });
  };
  const columns = [{
    key: 'name',
    label: 'Cộng đồng',
    render: row => <button className="admin-name-button" onClick={() => setSelected(row)}><div className="admin-identity"><AdminAvatar name={row.name} src={row.avatarUrl} square /><span><strong>c/{row.name}</strong><small>{row.visibility === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}</small></span></div></button>
  }, {
    key: 'owner',
    label: 'Chủ sở hữu',
    render: row => row.owner?.username || <button className="admin-text-action" onClick={() => setSelected(row)}>Xem chi tiết</button>
  }, {
    key: 'category',
    label: 'Danh mục',
    render: row => row.categoryName || '—'
  }, {
    key: 'members',
    label: 'Thành viên',
    numeric: true,
    render: row => adminNumber(row.memberCount)
  }, {
    key: 'status',
    label: 'Trạng thái',
    render: row => <AdminStatusBadge status={row.communityStatus || row.status} />
  }, {
    key: 'date',
    label: 'Ngày tạo',
    numeric: true,
    render: row => adminDate(row.createdAt)
  }, {
    key: 'actions',
    label: '',
    className: 'admin-actions-cell',
    render: row => <AdminRowMenu label={row.name}><button onClick={() => setSelected(row)}>Xem chi tiết</button><Link to={`/c/${encodeURIComponent(row.name)}`}>Mở cộng đồng</Link><button onClick={() => toggle(row)}>Cấm / mở lại cộng đồng</button></AdminRowMenu>
  }];
  return <div className="admin-page"><AdminPageHeader title="Quản lý cộng đồng" description="Giám sát và quản lý các cộng đồng trên DISCUSS." loading={result.loading} onRefresh={result.reload} />
    <div className="admin-table-toolbar"><AdminSearchInput value={search} onChange={value => query.update({
        search: value
      }, true)} label="Tìm cộng đồng" placeholder="Tìm theo tên cộng đồng…" /><AdminFilter label="Trạng thái" value={status} options={[['', 'Tất cả trạng thái'], ['ACTIVE', 'Đang hoạt động'], ['BANED', 'Đã cấm']]} onChange={value => query.update({
        status: value
      })} /><AdminFilter label="Quyền riêng tư" value={visibility} options={[['', 'Tất cả quyền riêng tư'], ['PUBLIC', 'Công khai'], ['PRIVATE', 'Riêng tư']]} onChange={value => query.update({
        visibility: value
      })} /></div>
    <div className="admin-list-meta"><span role="status">{result.loading ? 'Đang tải cộng đồng…' : result.error ? 'Chưa tải được danh sách' : `${adminNumber(page?.totalElements || 0)} cộng đồng`}</span>{(search || status || visibility) && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    <AdminDataTable rows={page?.content || []} columns={columns} rowKey={row => row.id} loading={result.loading} error={result.error} retry={result.reload} caption="Danh sách cộng đồng" empty={<AdminEmptyState title="Không tìm thấy cộng đồng" onReset={query.reset} />} />
    <AdminPagination hidePageSize result={result.loading || result.error ? null : page || null} page={query.page} size={size} disabled={result.loading || !!result.error} onChange={query.update} />
    {selected && !action && <AdminDetailDrawer title="Chi tiết cộng đồng" onClose={() => setSelected(null)}><CommunityPreview name={selected.name} id={selected.id} /><div className="admin-drawer-section"><h2>Kiểm duyệt cộng đồng</h2><button className="admin-button admin-button-danger-outline" onClick={() => toggle(selected)}>Cấm / mở lại cộng đồng</button></div></AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => {
      setSelected(null);
      result.reload();
    }} />}
  </div>;
}
