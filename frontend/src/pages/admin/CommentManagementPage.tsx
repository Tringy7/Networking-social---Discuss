import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, paginate, type AdminComment, type AdminPost } from '../../services/adminModeration';
import { useAdminData } from '../../components/admin/AdminDataContext';
import { CommentPreview } from '../../components/admin/AdminPreviews';
import { AdminPageHeader, AdminSearchInput, AdminFilter, AdminNotice, AdminDataTable, AdminEmptyState, AdminPagination, AdminStatusBadge, AdminRowMenu, AdminDetailDrawer, AdminConfirmDialog, adminDate, adminNumber, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

export default function CommentManagementPage() {
  const query = useAdminQuery();
  const rawPost = query.params.get('post') || '';
  const postId = /^\d+$/.test(rawPost) ? rawPost : '';
  const postSearch = query.params.get('postSearch') || '';
  const search = query.params.get('search') || '';
  const target = query.params.get('comment') || '';
  const posts = useAdminResource(useCallback(() => adminModeration.posts({ page: 0, size: 10, search: postSearch }), [postSearch]));
  const result = useAdminResource(useCallback(() => postId ? adminModeration.comments(postId) : Promise.resolve([]), [postId]));
  const summary = useAdminData();
  const [selected, setSelected] = useState<AdminComment | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const page = useMemo(() => paginate((result.data || []).filter(row => !search || row.content.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || row.author.username.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), query.page, query.size), [result.data, search, query.page, query.size]);
  const remove = (comment: AdminComment) => setAction({ title: 'Xóa bình luận vi phạm', label: 'Xác nhận xóa bình luận', danger: true,
    description: `Bình luận của @${comment.author.username} sẽ bị xóa mềm và nội dung được thay bằng [deleted]. Các phản hồi liên quan không tự động bị xóa.`,
    preview: <CommentPreview comment={comment} />, execute: () => adminMutations.deleteComment(String(comment.id)), success: 'Đã xóa bình luận vi phạm.' });
  const columns: AdminColumn<AdminComment>[] = [
    { key: 'content', label: 'Nội dung bình luận', className: 'admin-title-cell', render: row => <button className="admin-name-button" onClick={() => setSelected(row)}><span className="admin-cell-title">{row.content}</span><small>#{row.id}{String(row.id) === target ? ' · Được báo cáo' : ''}{row.parentId ? ` · Trả lời #${row.parentId}` : ''}</small></button> },
    { key: 'author', label: 'Tác giả', render: row => <Link to={`/u/${encodeURIComponent(row.author.username)}`}>@{row.author.username}</Link> },
    { key: 'post', label: 'Bài viết', render: row => <Link to={`/post/${row.postId}`}>Bài viết #{row.postId}</Link> },
    { key: 'date', label: 'Ngày tạo', numeric: true, render: row => adminDate(row.createdAt) },
    { key: 'status', label: 'Trạng thái', render: row => <AdminStatusBadge status={row.status} /> },
    { key: 'actions', label: '', className: 'admin-actions-cell', render: row => <AdminRowMenu label={`bình luận ${row.id}`}><button onClick={() => setSelected(row)}>Xem đầy đủ</button><Link to={`/post/${row.postId}`}>Mở bài viết gốc</Link><button className="is-danger" disabled={row.status === 'DELETED'} onClick={() => remove(row)}>Xóa bình luận</button></AdminRowMenu> },
  ];
  const postOptions: Array<[string, string]> = [[ '', 'Chọn bài viết để xem bình luận'], ...(posts.data?.content || []).map(row => [String(row.id), row.title] as [string, string])];
  if (postId && !postOptions.some(([value]) => value === postId)) postOptions.push([postId, `Bài viết #${postId}`]);
  const postColumns: AdminColumn<AdminPost>[] = [
    { key: 'title', label: 'Bài viết', className: 'admin-title-cell', render: row => <button className="admin-name-button" onClick={() => query.update({ post: String(row.id), search: '' })}><strong className="admin-cell-title">{row.title}</strong><small>c/{row.communityName}</small></button> },
    { key: 'author', label: 'Tác giả', render: row => `@${row.author.username}` },
    { key: 'count', label: 'Bình luận', numeric: true, render: row => adminNumber(row.commentCount) },
    { key: 'date', label: 'Ngày đăng', numeric: true, render: row => adminDate(row.createdAt) },
  ];
  return <div className="admin-page"><AdminPageHeader title="Quản lý bình luận" description="Kiểm duyệt các cuộc thảo luận trong cộng đồng." loading={result.loading} onRefresh={result.reload} />
    <AdminNotice>Bình luận được tra cứu theo từng bài viết. Danh sách bình luận toàn hệ thống chưa khả dụng.</AdminNotice>
    <div className="admin-post-picker"><AdminSearchInput label="Tìm bài viết chứa bình luận" value={postSearch} onChange={value => query.update({ postSearch: value }, true)} placeholder="Tìm bài viết chứa bình luận…" /><AdminFilter label={posts.loading ? 'Đang tải bài viết…' : 'Bài viết · tối đa 10 kết quả tìm kiếm'} value={postId} options={postOptions} onChange={value => { setSelected(null); query.update({ post: value, search: '' }); }} /></div>
    {posts.error && <div className="admin-notice" role="alert"><span>Chưa tải được danh sách bài viết. {posts.error}</span><button onClick={posts.reload}>Thử lại</button></div>}
    {target && !postId && <AdminNotice>Báo cáo đề cập bình luận #{target}. Chọn bài viết chứa bình luận để xem nội dung và ngữ cảnh.</AdminNotice>}
    {postId && <div className="admin-table-toolbar"><AdminSearchInput label="Lọc bình luận trong bài viết" value={search} onChange={value => query.update({ search: value }, true)} placeholder="Tìm nội dung hoặc tác giả bình luận…" /><Link className="admin-button" to={`/post/${postId}`}>Mở bài viết #{postId}</Link></div>}
    <div className="admin-list-meta"><span role="status">{!postId ? 'Chưa chọn bài viết' : result.loading ? 'Đang tải bình luận…' : result.error ? 'Chưa tải được bình luận' : `${adminNumber(page.totalElements)} bình luận trong bài viết #${postId}`}</span>{(postId || search) && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    {!postId ? <section className="admin-section"><div className="admin-section-heading"><h2>{postSearch ? 'Bài viết khớp tìm kiếm' : 'Bài viết gần đây'}</h2><span className="admin-subtle">Chọn bài viết để xem bình luận</span></div><AdminDataTable rows={posts.data?.content.slice(0, 5) || []} columns={postColumns} rowKey={row => row.id} loading={posts.loading} error={posts.error} retry={posts.reload} caption="Chọn bài viết để kiểm duyệt bình luận" empty={<AdminEmptyState title="Không tìm thấy bài viết" description="Thử một tiêu đề hoặc nội dung khác." />} /></section> : <AdminDataTable rows={page.content} columns={columns} rowKey={row => row.id} loading={result.loading} error={result.error} retry={result.reload} caption={`Bình luận trong bài viết #${postId}`} empty={<AdminEmptyState title="Không có bình luận phù hợp" description="Bài viết chưa có bình luận hoặc không có kết quả khớp từ khóa." />} />}
    {postId && <AdminPagination result={result.loading || result.error ? null : page} page={query.page} size={query.size} disabled={result.loading || !!result.error} onChange={query.update} />}
    {selected && !action && <AdminDetailDrawer title="Chi tiết bình luận" onClose={() => setSelected(null)}><CommentPreview comment={selected} /><div className="admin-drawer-section"><button className="admin-button admin-button-danger-outline" disabled={selected.status === 'DELETED'} onClick={() => remove(selected)}>Xóa bình luận</button></div></AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => { setSelected(null); result.reload(); summary.reload(); }} />}
  </div>;
}
