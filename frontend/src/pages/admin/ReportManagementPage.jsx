import { useCallback, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminReportDetail, getAdminReportTarget, listAdminReports, rejectAdminReport, resolveAdminReport } from '../../services/adminReportService.js';
import { ADMIN_REPORT_TYPES } from '../../services/adminModeration';
import { useAdminData } from '../../components/admin/AdminDataContext.jsx';
import Modal from '../../components/ui/Modal';
import PostBody from '../../components/post/PostBody';
import { CommentAttachmentList } from '../../components/comment/CommentAttachments';
import { httpUrl } from '../../components/post/postUrls';
import { useToastStore } from '../../store/useToastStore';
import {
  AdminDataTable,
  AdminDetailLink,
  AdminDetailPage,
  AdminErrorState,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminPagination,
  AdminStatusBadge,
  adminDate,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

const reportTypeLabels = Object.fromEntries(ADMIN_REPORT_TYPES);

const REPORT_STATUSES = [
  ['', 'Tất cả trạng thái'],
  ['PENDING', 'Chờ xử lý'],
  ['RESOLVED', 'Đã giải quyết'],
  ['REJECTED', 'Đã từ chối'],
];

const REASONS = {
  SPAM: 'Spam',
  HARASSMENT: 'Quấy rối',
  HATE_SPEECH: 'Ngôn từ thù ghét',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  MISINFORMATION: 'Thông tin sai lệch',
  OTHER: 'Khác',
};

const moderationActions = {
  POST: 'REMOVE_POST',
  COMMENT: 'REMOVE_COMMENT',
  COMMUNITY: 'LOCK_COMMUNITY',
};
const actionLabels = {
  REVIEWED: 'Đã xem xét',
  REJECTED: 'Từ chối báo cáo',
  REMOVE_POST: 'Gỡ bài viết',
  REMOVE_COMMENT: 'Gỡ bình luận',
  LOCK_COMMUNITY: 'Khóa cộng đồng',
};

function ReportDecisionDialog({ type, reportId, decision, canActOnTarget, onClose, onSuccess }) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [action, setAction] = useState('REVIEWED');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const addToast = useToastStore(state => state.addToast);
  const { reports } = useAdminData();

  const submit = async event => {
    event.preventDefault();
    if (pending.current) return;
    const note = resolutionNote.trim();
    if (!note) {
      setError('Ghi chú xử lý là bắt buộc.');
      return;
    }
    if (note.length > 2000) {
      setError('Ghi chú xử lý không được vượt quá 2000 ký tự.');
      return;
    }

    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (decision === 'reject') await rejectAdminReport(type, reportId, note);
      else await resolveAdminReport(type, reportId, note, action);
      const result = decision === 'reject' ? 'Đã từ chối' : 'Đã giải quyết';
      addToast(`${result} báo cáo #${reportId}.`, 'success');
      reports.reload();
      onSuccess();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật báo cáo.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} closeDisabled={busy} title={decision === 'reject' ? 'Từ chối báo cáo' : 'Giải quyết báo cáo'} maxWidth="md">
      <form className="admin-resolve-form" onSubmit={submit}>
        <p>{decision === 'reject' ? 'Nhập lý do từ chối báo cáo.' : 'Nhập ghi chú về cách bạn đã xử lý báo cáo.'}</p>
        {decision === 'resolve' && canActOnTarget && <AdminFilter
          label="Hành động kiểm duyệt"
          value={action}
          onChange={setAction}
          disabled={busy}
          options={[
            ['REVIEWED', 'Giữ nguyên nội dung'],
            [moderationActions[type], actionLabels[moderationActions[type]]],
          ]}
        />}
        <label htmlFor="admin-report-resolution-note">Ghi chú xử lý</label>
        <textarea
          id="admin-report-resolution-note"
          value={resolutionNote}
          onChange={event => setResolutionNote(event.target.value)}
          maxLength={2000}
          rows={6}
          required
          aria-describedby="admin-report-resolution-count"
        />
        <div className="admin-resolve-form-meta">
          <span id="admin-report-resolution-count" role="status">{resolutionNote.length}/2000</span>
        </div>
        {error && <p className="admin-inline-error" role="alert">{error}</p>}
        <div className="admin-dialog-actions">
          <button className="admin-button" type="button" onClick={onClose} disabled={busy}>Hủy</button>
          <button className={`admin-button ${decision === 'reject' || action !== 'REVIEWED' ? 'admin-button-danger' : 'admin-button-primary'}`} type="submit" disabled={busy || !resolutionNote.trim() || resolutionNote.length > 2000}>
            {busy ? 'Đang lưu…' : decision === 'reject' ? 'Từ chối' : action === 'REVIEWED' ? 'Giải quyết' : `${actionLabels[action]} và giải quyết`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ReportDetailPage() {
  const { type, reportId } = useParams();
  const [params] = useSearchParams();
  const validType = ADMIN_REPORT_TYPES.some(([value]) => value === type);
  const backParams = new URLSearchParams(params);
  if (validType && !backParams.has('type') && type !== 'POST') backParams.set('type', type);

  return <AdminDetailPage title={`Báo cáo #${reportId}`} backTo="/admin/reports" backLabel="Về danh sách báo cáo" backSearch={backParams.toString()}>
    {validType
      ? <ReportDetailContent key={`${type}-${reportId}`} type={type} reportId={reportId} />
      : <AdminEmptyState title="Không tìm thấy báo cáo" description="Loại báo cáo trong đường dẫn không hợp lệ." />}
  </AdminDetailPage>;
}

function ReportDetailContent({ type, reportId }) {
  const detail = useAdminResource(useCallback(() => getAdminReportDetail(type, reportId), [type, reportId]));
  const target = useAdminResource(useCallback(() => getAdminReportTarget(type, reportId), [type, reportId]));
  const [decision, setDecision] = useState(null);

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const report = detail.data;
  const canActOnTarget = type === 'POST'
    ? Boolean(target.data?.post && target.data.post.status !== 'DELETED')
    : type === 'COMMENT'
      ? Boolean(target.data?.comment && target.data.comment.status !== 'DELETED')
      : target.data?.community?.status === 'ACTIVE';
  return (
    <div className="admin-report-detail">
      <h2>Thông tin báo cáo</h2>
      <AdminFields items={[
        ['ID báo cáo', report.id],
        ['Loại đối tượng', reportTypeLabels[report.targetType] || report.targetType],
        ['ID đối tượng', report.targetId],
        ['Cộng đồng', report.communityName],
        ['Người báo cáo', report.reporterUsername ? `@${report.reporterUsername}` : '—'],
        ['Lý do', REASONS[report.reason] || report.reason],
        ['Mô tả', report.description],
        ['Trạng thái', <AdminStatusBadge status={report.status} />],
        ['Hành động', actionLabels[report.action] || report.action],
        ['Ghi chú xử lý', report.resolutionNote],
        ['Người xử lý', report.resolvedBy],
        ['Ngày xử lý', adminDate(report.resolvedAt)],
        ['Ngày tạo', adminDate(report.createdAt)],
      ]} />
      <ReportTargetPreview resource={target} />
      {report.status === 'PENDING' && (
        <div className="admin-inline-actions">
          <button className="admin-button admin-button-primary" type="button" onClick={() => setDecision('resolve')}>Giải quyết</button>
          <button className="admin-button admin-button-danger-outline" type="button" onClick={() => setDecision('reject')}>Từ chối</button>
        </div>
      )}
      {decision && report.status === 'PENDING' && (
        <ReportDecisionDialog
          type={type}
          reportId={reportId}
          decision={decision}
          canActOnTarget={canActOnTarget}
          onClose={() => setDecision(null)}
          onSuccess={() => {
            detail.reload();
            target.reload();
          }}
        />
      )}
    </div>
  );
}

function ReportTargetPreview({ resource }) {
  const { post, comment, community } = resource.data || {};
  return (
    <section className="admin-report-target" aria-labelledby="admin-report-target-title">
      <h2 id="admin-report-target-title">Nội dung bị báo cáo</h2>
      {resource.loading ? <AdminLoadingSkeleton /> : resource.error
        ? <AdminErrorState error={resource.error} retry={resource.reload} />
        : <>
          {comment && <article>
            <header><h3>Bình luận của @{comment.username}</h3><AdminStatusBadge status={comment.status} /></header>
            {comment.status === 'DELETED' ? <p>Bình luận đã bị gỡ.</p> : <>
              {comment.content && <p>{comment.content}</p>}
              <CommentAttachmentList attachments={comment.attachments?.filter(attachment => httpUrl(attachment.url))} />
            </>}
          </article>}
          {post && <article>
            <header><h3>{comment ? 'Bài viết gốc' : 'Bài viết'} · {post.title}</h3><AdminStatusBadge status={post.status} /></header>
            {post.author?.username && <p>@{post.author.username} · c/{post.communityName}</p>}
            {post.status === 'DELETED' ? <p>Bài viết đã bị gỡ.</p> : <PostBody post={post} />}
            <Link to={`/admin/posts/${post.id}`}>Mở chi tiết bài viết</Link>
          </article>}
          {community && <article>
            <header><h3>c/{community.name}</h3><AdminStatusBadge status={community.status} /></header>
            {community.description && <p>{community.description}</p>}
            <p>{adminNumber(community.memberCount)} thành viên{community.owner?.username ? ` · Chủ cộng đồng @${community.owner.username}` : ''}</p>
            <Link to={`/admin/communities/${community.id}`}>Mở hồ sơ cộng đồng</Link>
          </article>}
        </>}
    </section>
  );
}

export default function ReportManagementPage() {
  const query = useAdminQuery();
  const typeValue = query.params.get('type') || '';
  const type = ADMIN_REPORT_TYPES.some(([value]) => value === typeValue) ? typeValue : 'POST';
  const statusValue = query.params.get('status') || '';
  const status = ['PENDING', 'RESOLVED', 'REJECTED'].includes(statusValue) ? statusValue : '';
  const communityName = (query.params.get('communityName') || '').slice(0, 255);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => listAdminReports({ type, status, communityName, page, size }),
    [type, status, communityName, page, size],
  ));
  const [communityDraftState, setCommunityDraftState] = useState({ source: communityName, value: communityName });
  const communityDraft = communityDraftState.source === communityName ? communityDraftState.value : communityName;
  const reports = result.data?.empty ? [] : result.data?.content || [];

  const applyCommunity = event => {
    event.preventDefault();
    const value = communityDraft.trim().slice(0, 255);
    setCommunityDraftState({ source: value, value });
    query.update({ communityName: value });
  };

  const resetFilters = () => {
    setCommunityDraftState({ source: '', value: '' });
    query.update({ type: 'POST', status: '', communityName: '' });
  };

  const columns = [
    { key: 'id', label: 'ID báo cáo', numeric: true, render: report => adminNumber(report.id) },
    { key: 'targetType', label: 'Loại đối tượng', render: report => reportTypeLabels[report.targetType] || report.targetType || '—' },
    { key: 'targetId', label: 'ID đối tượng', numeric: true, render: report => report.targetId ?? '—' },
    {
      key: 'communityName',
      label: 'Cộng đồng',
      render: report => report.communityName
        ? <Link to={`/c/${encodeURIComponent(report.communityName)}`}>c/{report.communityName}</Link>
        : '—',
    },
    {
      key: 'reporterUsername',
      label: 'Người báo cáo',
      render: report => report.reporterUsername
        ? <Link to={`/u/${encodeURIComponent(report.reporterUsername)}`}>@{report.reporterUsername}</Link>
        : '—',
    },
    { key: 'reason', label: 'Lý do', render: report => REASONS[report.reason] || report.reason || '—' },
    {
      key: 'description',
      label: 'Mô tả',
      className: 'admin-wrap-cell',
      render: report => <span className="admin-report-description">{report.description || '—'}</span>,
    },
    { key: 'status', label: 'Trạng thái', render: report => <AdminStatusBadge status={report.status} /> },
    { key: 'action', label: 'Hành động', render: report => actionLabels[report.action] || report.action || '—' },
    { key: 'resolvedBy', label: 'Người xử lý', render: report => report.resolvedBy || '—' },
    { key: 'resolvedAt', label: 'Ngày xử lý', numeric: true, render: report => adminDate(report.resolvedAt) },
    { key: 'createdAt', label: 'Ngày tạo', numeric: true, render: report => adminDate(report.createdAt) },
    {
      key: 'viewDetails',
      label: 'Chi tiết',
      className: 'admin-actions-cell',
      render: report => <AdminDetailLink className="admin-text-action" to={`/admin/reports/${report.targetType}/${report.id}`}>Xem chi tiết</AdminDetailLink>,
    },
  ];

  return (
    <div className="admin-page admin-report-management">
      <AdminPageHeader
        title="Quản lý báo cáo"
        description="Theo dõi báo cáo nội dung theo loại, trạng thái và cộng đồng."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar">
        <form className="admin-filter-bar" onSubmit={applyCommunity}>
          <AdminFilter
            label="Loại báo cáo"
            value={type}
            options={ADMIN_REPORT_TYPES}
            onChange={value => query.update({ type: value })}
          />
          <AdminFilter
            label="Trạng thái"
            value={status}
            options={REPORT_STATUSES}
            onChange={value => query.update({ status: value })}
          />
          <label className="admin-filter" htmlFor="admin-report-community-name">
            <span>Cộng đồng</span>
            <input
              id="admin-report-community-name"
              value={communityDraft}
              maxLength={255}
              onChange={event => setCommunityDraftState({ source: communityName, value: event.target.value })}
              placeholder="Nhập tên cộng đồng"
            />
          </label>
          <button className="admin-button admin-button-primary" type="submit">Áp dụng</button>
          {(status || communityName || type !== 'POST') && <button className="admin-button" type="button" onClick={resetFilters}>Đặt lại bộ lọc</button>}
        </form>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải báo cáo…'
            : result.error
              ? 'Chưa tải được danh sách báo cáo'
              : `${adminNumber(result.data?.totalElements)} báo cáo`}
        </span>
      </div>

      <AdminDataTable
        rows={reports}
        columns={columns}
        rowKey={report => `${report.targetType}-${report.id}`}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Danh sách báo cáo"
        empty={<AdminEmptyState title="Không tìm thấy báo cáo" onReset={resetFilters} />}
      />
      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />
    </div>
  );
}
