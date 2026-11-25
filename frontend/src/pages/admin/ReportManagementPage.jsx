import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminReportDetail, listAdminReports, rejectAdminReport, resolveAdminReport } from '../../services/adminReportService.js';
import Modal from '../../components/ui/Modal';
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

const REPORT_TYPES = [
  ['POST', 'Bài viết'],
  ['COMMENT', 'Bình luận'],
  ['COMMUNITY', 'Cộng đồng'],
];

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

function ReportDecisionDialog({ type, reportId, decision, onClose, onSuccess }) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore(state => state.addToast);

  const submit = async event => {
    event.preventDefault();
    const note = resolutionNote.trim();
    if (!note) {
      setError('Ghi chú xử lý là bắt buộc.');
      return;
    }
    if (note.length > 2000) {
      setError('Ghi chú xử lý không được vượt quá 2000 ký tự.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const submitDecision = decision === 'reject' ? rejectAdminReport : resolveAdminReport;
      await submitDecision(type, reportId, note);
      addToast(`Report #${reportId} ${decision === 'reject' ? 'rejected' : 'resolved'} successfully.`, 'success');
      onSuccess();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật báo cáo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} closeDisabled={busy} title={decision === 'reject' ? 'Từ chối báo cáo' : 'Giải quyết báo cáo'} maxWidth="md">
      <form className="admin-resolve-form" onSubmit={submit}>
        <p>{decision === 'reject' ? 'Nhập Ghi chú xử lý để từ chối báo cáo này.' : 'Nhập Ghi chú xử lý để xác nhận báo cáo này đã được xử lý.'}</p>
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
          <button className={`admin-button ${decision === 'reject' ? 'admin-button-danger' : 'admin-button-primary'}`} type="submit" disabled={busy || !resolutionNote.trim() || resolutionNote.length > 2000}>
            {busy ? 'Đang lưu…' : decision === 'reject' ? 'Từ chối' : 'Giải quyết'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ReportDetailPage() {
  const { type, reportId } = useParams();
  const [params] = useSearchParams();
  const validType = REPORT_TYPES.some(([value]) => value === type);
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
  const [decision, setDecision] = useState(null);

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const report = detail.data;
  return (
    <div className="admin-report-detail">
      <h2>Thông tin báo cáo</h2>
      <AdminFields items={[
        ['ID báo cáo', report.id],
        ['Loại đối tượng', report.targetType],
        ['ID đối tượng', report.targetId],
        ['Cộng đồng', report.communityName],
        ['Người báo cáo', report.reporterUsername ? `@${report.reporterUsername}` : '—'],
        ['Lý do', REASONS[report.reason] || report.reason],
        ['Mô tả', report.description],
        ['Trạng thái', <AdminStatusBadge status={report.status} />],
        ['Hành động', report.action],
        ['Ghi chú xử lý', report.resolutionNote],
        ['Người xử lý', report.resolvedBy],
        ['Ngày xử lý', adminDate(report.resolvedAt)],
        ['Ngày tạo', adminDate(report.createdAt)],
      ]} />
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
          onClose={() => setDecision(null)}
          onSuccess={detail.reload}
        />
      )}
    </div>
  );
}

export default function ReportManagementPage() {
  const query = useAdminQuery();
  const typeValue = query.params.get('type') || '';
  const type = REPORT_TYPES.some(([value]) => value === typeValue) ? typeValue : 'POST';
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
    { key: 'targetType', label: 'Loại đối tượng', render: report => report.targetType || '—' },
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
    { key: 'action', label: 'Hành động', render: report => report.action || '—' },
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
            options={REPORT_TYPES}
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
