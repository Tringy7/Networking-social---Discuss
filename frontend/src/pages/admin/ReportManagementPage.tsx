import { useCallback, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, adminMutations, adminCapabilities, type AdminReport, type AdminComment, type ReportType } from '../../services/adminModeration';
import { useAdminData } from '../../components/admin/AdminDataContext';
import { CommunityPreview, PostPreview, CommentPreview } from '../../components/admin/AdminPreviews';
import { AdminPageHeader, AdminSearchInput, AdminFilter, AdminNotice, AdminDataTable, AdminEmptyState, AdminPagination, AdminStatusBadge, AdminRowMenu, AdminDetailDrawer, AdminConfirmDialog, AdminFields, AdminLoadingSkeleton, AdminErrorState, adminDate, adminNumber, type AdminAction, type AdminColumn } from '../../components/admin/AdminUI';

const types: Record<string, string> = { POST: 'Bài viết', COMMENT: 'Bình luận', COMMUNITY: 'Cộng đồng' };
const reasons: Record<string, string> = { SPAM: 'Spam', HARASSMENT: 'Quấy rối', HATE_SPEECH: 'Ngôn từ thù ghét', INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp', MISINFORMATION: 'Thông tin sai lệch', OTHER: 'Khác' };
function ReportCommentContext({ report, onRemove }: { report: AdminReport; onRemove: (comment: AdminComment) => void }) {
  const [draft, setDraft] = useState('');
  const [post, setPost] = useState('');
  const result = useAdminResource(useCallback(() => post ? adminModeration.comments(post) : Promise.resolve([]), [post]));
  const comment = result.data?.find(row => row.id === report.targetId);
  const submit = (event: FormEvent) => { event.preventDefault(); if (/^\d+$/.test(draft.trim())) setPost(draft.trim()); };
  return <div className="admin-report-context"><AdminNotice>Báo cáo chưa kèm bài viết gốc. Nhập ID bài viết chứa bình luận #{report.targetId} để kiểm tra đúng nội dung trước khi xóa.</AdminNotice><form className="admin-context-form" onSubmit={submit}><label>ID bài viết<input value={draft} onChange={event => setDraft(event.target.value)} inputMode="numeric" pattern="[0-9]+" required placeholder="Ví dụ: 123" /></label><button className="admin-button" type="submit">Xem ngữ cảnh</button></form>
    {post && (result.loading ? <AdminLoadingSkeleton /> : result.error ? <AdminErrorState error={result.error} retry={result.reload} /> : comment ? <><CommentPreview comment={comment} /><button className="admin-button admin-button-danger-outline" disabled={comment.status === 'DELETED'} onClick={() => onRemove(comment)}>Xóa bình luận</button></> : <AdminNotice>Không tìm thấy bình luận #{report.targetId} trong bài viết #{post}.</AdminNotice>)}
    <Link className="admin-text-action" to={`/admin/comments?comment=${report.targetId}${post ? `&post=${post}` : ''}`}>Mở trang tra cứu bình luận</Link></div>;
}
export default function ReportManagementPage() {
  const query = useAdminQuery();
  const { page, size } = query;
  const status = ['PENDING', 'RESOLVED', 'REJECTED'].includes(query.params.get('status') || '') ? query.params.get('status')! : '';
  const type = (['POST', 'COMMENT', 'COMMUNITY'].includes(query.params.get('type') || '') ? query.params.get('type')! : '') as ReportType | '';
  const community = query.params.get('community') || '';
  const result = useAdminResource(useCallback(() => adminModeration.reports({ page, size, status, type, community }), [page, size, status, type, community]));
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const summary = useAdminData();
  const resolve = (report: AdminReport, reject: boolean) => setAction({ title: reject ? 'Bác bỏ báo cáo' : 'Giải quyết báo cáo', label: reject ? 'Xác nhận bác bỏ' : 'Xác nhận giải quyết', description: `Báo cáo ${types[report.targetType].toLowerCase()} #${report.targetId} của @${report.reporterUsername} sẽ được đánh dấu ${reject ? 'đã bác bỏ' : 'đã giải quyết'}.`, available: adminCapabilities.reportResolution, execute: () => adminMutations.resolveReport(report, reject ? 'REJECTED' : 'RESOLVED'), success: 'Đã cập nhật báo cáo.' });
  const deletePost = (report: AdminReport) => setAction({ title: 'Xóa bài viết được báo cáo', label: 'Xác nhận xóa bài viết', danger: true, description: `Bài viết #${report.targetId} sẽ bị xóa mềm. Thao tác này không tự động thay đổi trạng thái báo cáo.`, preview: <PostPreview id={String(report.targetId)} />, execute: () => adminMutations.deletePost(String(report.targetId)), success: 'Đã xóa bài viết. Trạng thái báo cáo chưa thay đổi.' });
  const deleteComment = (comment: AdminComment) => setAction({ title: 'Xóa bình luận được báo cáo', label: 'Xác nhận xóa bình luận', danger: true, description: 'Bình luận sẽ bị xóa mềm, nội dung được thay bằng [deleted]. Trạng thái báo cáo chưa thay đổi.', preview: <CommentPreview comment={comment} />, execute: () => adminMutations.deleteComment(String(comment.id)), success: 'Đã xóa bình luận. Trạng thái báo cáo chưa thay đổi.' });
  const columns: AdminColumn<AdminReport>[] = [
    { key: 'target', label: 'Đối tượng', render: report => <button className="admin-name-button" onClick={() => setSelected(report)}><strong>{types[report.targetType]} #{report.targetId}</strong><small>c/{report.communityName}</small></button> },
    { key: 'type', label: 'Loại báo cáo', render: report => types[report.targetType] },
    { key: 'reason', label: 'Lý do', render: report => reasons[report.reason] || report.reason },
    { key: 'reporter', label: 'Người báo cáo', render: report => <Link to={`/u/${encodeURIComponent(report.reporterUsername)}`}>@{report.reporterUsername}</Link> },
    { key: 'date', label: 'Ngày báo cáo', numeric: true, render: report => adminDate(report.createdAt) },
    { key: 'status', label: 'Trạng thái', render: report => <AdminStatusBadge status={report.status} /> },
    { key: 'actions', label: '', className: 'admin-actions-cell', render: report => <AdminRowMenu label={`báo cáo ${report.targetType} ${report.id}`}><button onClick={() => setSelected(report)}>Xem xét báo cáo</button><button disabled={report.status !== 'PENDING'} onClick={() => resolve(report, false)}>Giải quyết báo cáo</button><button disabled={report.status !== 'PENDING'} onClick={() => resolve(report, true)}>Bác bỏ báo cáo</button></AdminRowMenu> },
  ];
  return <div className="admin-page"><AdminPageHeader title="Trung tâm báo cáo" description="Xem xét và xử lý nội dung được cộng đồng báo cáo." loading={result.loading} onRefresh={result.reload} />
    <div className="admin-status-tabs" aria-label="Trạng thái báo cáo">{[[ '', 'Tất cả'], ['PENDING', 'Chờ xử lý'], ['RESOLVED', 'Đã giải quyết'], ['REJECTED', 'Đã bác bỏ']].map(([value, label]) => <button key={value} aria-pressed={status === value} onClick={() => query.update({ status: value })}>{label}</button>)}</div>
    <div className="admin-table-toolbar"><AdminSearchInput label="Lọc báo cáo theo cộng đồng" value={community} onChange={value => query.update({ community: value }, true)} placeholder="Tên chính xác của cộng đồng…" /><div className="admin-filter-bar"><AdminFilter label="Đối tượng" value={type} onChange={value => query.update({ type: value })} options={[[ '', 'Tất cả loại'], ['POST', 'Bài viết'], ['COMMENT', 'Bình luận'], ['COMMUNITY', 'Cộng đồng']]} /><label className="admin-filter"><span>Ngày báo cáo</span><input type="date" disabled aria-label="Lọc ngày báo cáo chưa khả dụng" /><small>Chưa hỗ trợ lọc ngày</small></label></div></div>
    <div className="admin-list-meta"><span role="status">{result.loading ? 'Đang tải báo cáo…' : result.error ? 'Chưa tải được báo cáo' : `${adminNumber(result.data?.totalElements)} báo cáo`}</span>{(status || type || community) && <button onClick={query.reset}>Đặt lại bộ lọc</button>}</div>
    <AdminDataTable rows={result.data?.content || []} columns={columns} rowKey={row => `${row.targetType}-${row.id}`} loading={result.loading} error={result.error} retry={result.reload} caption="Danh sách báo cáo kiểm duyệt" empty={<AdminEmptyState title="Không có báo cáo phù hợp" onReset={query.reset} />} />
    <AdminPagination result={result.data} page={page} size={size} disabled={result.loading || !!result.error} onChange={query.update} />
    <AdminNotice>Đã hỗ trợ xem báo cáo và xóa bài viết / bình luận vi phạm. Giải quyết hoặc bác bỏ báo cáo chưa khả dụng; xóa nội dung không tự động đánh dấu báo cáo đã xử lý.</AdminNotice>
    {selected && !action && <AdminDetailDrawer title="Xem xét báo cáo" onClose={() => setSelected(null)}><div className="admin-report-heading"><h2>{types[selected.targetType]} #{selected.targetId}</h2><AdminStatusBadge status={selected.status} /></div>
      <AdminFields items={[[ 'Người báo cáo', <Link to={`/u/${encodeURIComponent(selected.reporterUsername)}`}>@{selected.reporterUsername}</Link>], ['Cộng đồng', <Link to={`/c/${encodeURIComponent(selected.communityName)}`}>c/{selected.communityName}</Link>], ['Lý do', reasons[selected.reason] || selected.reason], ['Ngày báo cáo', adminDate(selected.createdAt)]]} />
      <h2>Mô tả bổ sung</h2><p className="admin-preserve-lines">{selected.description || 'Không có mô tả bổ sung.'}</p>
      {(selected.resolutionNote || selected.resolvedBy) && <AdminFields items={[[ 'Ghi chú xử lý', selected.resolutionNote], ['Người xử lý', selected.resolvedBy], ['Ngày xử lý', adminDate(selected.resolvedAt)]]} />}
      <div className="admin-drawer-section"><h2>Nội dung được báo cáo</h2>{selected.targetType === 'POST' ? <PostPreview id={String(selected.targetId)} onDelete={() => deletePost(selected)} /> : selected.targetType === 'COMMUNITY' ? <CommunityPreview name={selected.communityName} /> : <ReportCommentContext report={selected} onRemove={deleteComment} />}</div>
      <div className="admin-drawer-section"><h2>Kết quả xem xét</h2><AdminNotice>Cập nhật kết quả xem xét chưa được hệ thống hỗ trợ.</AdminNotice><div className="admin-inline-actions"><button className="admin-button" disabled={selected.status !== 'PENDING'} onClick={() => resolve(selected, false)}>Giải quyết báo cáo</button><button className="admin-button" disabled={selected.status !== 'PENDING'} onClick={() => resolve(selected, true)}>Bác bỏ báo cáo</button></div></div>
    </AdminDetailDrawer>}
    {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={() => { setSelected(null); result.reload(); summary.reload(); }} />}
  </div>;
}
