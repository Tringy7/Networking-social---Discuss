import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, type AdminPost } from '../../services/adminModeration';
import { useAdminData } from '../../components/admin/AdminDataContext';
import { PostPreview } from '../../components/admin/AdminPreviews';
import { AdminPageHeader, AdminSearchInput, AdminFilter, AdminNotice, AdminDataTable, AdminEmptyState, AdminPagination, AdminStatusBadge, AdminRowMenu, AdminDetailDrawer, AdminConfirmDialog, adminDate, adminNumber, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

export default function PostManagementPage() {
  const query = useAdminQuery();
  const { page, size } = query;
  const search = query.params.get('search') || '';
  const community = query.params.get('community') || '';
  const result = useAdminResource(useCallback(() => adminModeration.posts({ page, size, search, community }), [page, size, search, community]));
  const communities = useAdminResource(adminModeration.activeCommunities);
  const summary = useAdminData();
  const [selected, setSelected] = useState<AdminPost | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const remove = (post: AdminPost) => setAction({ title: 'Xóa bài viết vi phạm', label: 'Xác nhận xóa bài viết', danger: true, description: `Bài viết “${post.title}” của @${post.author.username} sẽ bị xóa mềm và không còn hiển thị. Đây là thao tác kiểm duyệt.`, preview: <p className="admin-preserve-lines">{post.content.slice(0, 500)}</p>, execute: () => adminMutations.deletePost(post.id), success: 'Đã xóa bài viết vi phạm.' });
  const columns: AdminColumn<AdminPost>[] = [
    { key: 'title', label: 'Bài viết', className: 'admin-title-cell', render: row => <button className="admin-name-button" onClick={() => setSelected(row)}><strong className="admin-cell-title">{row.title}</strong><small>#{row.id}</small></button> },
    { key: 'author', label: 'Tác giả', render: row => <Link to={`/u/${encodeURIComponent(row.author.username)}`}>@{row.author.username}</Link> },
    { key: 'community', label: 'Cộng đồng', render: row => <Link to={`/c/${encodeURIComponent(row.communityName)}`}>c/{row.communityName}</Link> },
    { key: 'type', label: 'Loại', render: row => row.type || '—' },
    { key: 'status', label: 'Trạng thái', render: row => <AdminStatusBadge status={row.status} /> },
    { key: 'date', label: 'Ngày đăng', numeric: true, render: row => adminDate(row.createdAt) },
    { key: 'actions', label: '', className: 'admin-actions-cell', render: row => <AdminRowMenu label={`bài viết ${row.id}`}><button onClick={() => setSelected(row)}>Xem trước</button><Link to={`/post/${row.id}`}>Mở bài viết</Link><button className="is-danger" onClick={() => remove(row)}>Xóa bài viết</button></AdminRowMenu> },
  ];
  return <div className="admin-page"><AdminPageHeader title="Quản lý bài viết" description="Theo dõi và kiểm duyệt nội dung bài viết." loading={result.loading} onRefresh={result.reload} />
    <AdminNotice>Danh sách gồm bài đã đăng mà tài khoản hiện tại được phép xem. Tra cứu toàn bộ bài đã xóa, bài ẩn và nội dung riêng tư chưa được hỗ trợ.</AdminNotice>
    <div className="admin-table-toolbar"><AdminSearchInput label="Tìm bài viết" value={search} onChange={value => query.update({ search: value }, true)} placeholder="Tìm tiêu đề hoặc nội dung…" /><div className="admin-filter-bar"><AdminFilter label="Cộng đồng" value={community} options={[[ '', 'Tất cả cộng đồng'], ...(communities.data || []).map(row => [row.name, `c/${row.name}`] as [string, string])]} onChange={value => query.update({ community: value })} /><AdminFilter label="Trạng thái" value="PUBLISHED" disabled options={[[ 'PUBLISHED', 'Đã đăng']]} reason="Chưa hỗ trợ mọi trạng thái" /></div></div>
    {communities.error && <div className="admin-notice" role="alert"><span>Chưa tải được bộ lọc cộng đồng.</span><button onClick={communities.reload}>Thử lại</button></div>}
    <div className="admin-list-meta"><span role="status">{result.loading ? 'Đang tải bài viết…' : result.error ? 'Chưa tải được danh sách' : `${adminNumber(result.data?.totalElements)} bài viết trong phạm vi đang xem`}</span>{(search || community) && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    <AdminDataTable rows={result.data?.content || []} columns={columns} rowKey={row => row.id} loading={result.loading} error={result.error} retry={result.reload} caption="Bài viết được phép xem" empty={<AdminEmptyState title="Không tìm thấy bài viết" onReset={query.reset} />} />
    <AdminPagination result={result.data} page={page} size={size} disabled={result.loading || !!result.error} onChange={query.update} />
    {selected && !action && <AdminDetailDrawer title="Xem trước bài viết" onClose={() => setSelected(null)}><PostPreview id={selected.id} onDelete={() => remove(selected)} /></AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => { setSelected(null); result.reload(); summary.reload(); }} />}
  </div>;
}
