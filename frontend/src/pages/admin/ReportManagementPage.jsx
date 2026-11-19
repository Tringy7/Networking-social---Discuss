import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminReportDetail, listAdminReports, rejectAdminReport, resolveAdminReport } from '../../services/adminReportService.js';
import Modal from '../../components/ui/Modal';
import { useToastStore } from '../../store/useToastStore';
import {
  AdminDataTable,
  AdminDetailDrawer,
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
  ['POST', 'Post'],
  ['COMMENT', 'Comment'],
  ['COMMUNITY', 'Community'],
];

const REPORT_STATUSES = [
  ['', 'All statuses'],
  ['PENDING', 'Pending'],
  ['RESOLVED', 'Resolved'],
  ['REJECTED', 'Rejected'],
];

const REASONS = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate speech',
  INAPPROPRIATE_CONTENT: 'Inappropriate content',
  MISINFORMATION: 'Misinformation',
  OTHER: 'Other',
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
      setError('Resolution Note là bắt buộc.');
      return;
    }
    if (note.length > 2000) {
      setError('Resolution Note không được vượt quá 2000 ký tự.');
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
    <Modal isOpen onClose={() => !busy && onClose()} closeDisabled={busy} title={decision === 'reject' ? 'Reject report' : 'Resolve report'} maxWidth="md">
      <form className="admin-resolve-form" onSubmit={submit}>
        <p>{decision === 'reject' ? 'Nhập Resolution Note để từ chối báo cáo này.' : 'Nhập Resolution Note để xác nhận báo cáo này đã được xử lý.'}</p>
        <label htmlFor="admin-report-resolution-note">Resolution Note</label>
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
          <button className="admin-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`admin-button ${decision === 'reject' ? 'admin-button-danger' : 'admin-button-primary'}`} type="submit" disabled={busy || !resolutionNote.trim() || resolutionNote.length > 2000}>
            {busy ? 'Saving…' : decision === 'reject' ? 'Reject' : 'Resolve'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReportDetailContent({ type, reportId, onListRefresh }) {
  const detail = useAdminResource(useCallback(() => getAdminReportDetail(type, reportId), [type, reportId]));
  const [decision, setDecision] = useState(null);

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const report = detail.data;
  return (
    <div className="admin-report-detail">
      <AdminFields items={[
        ['Report ID', report.id],
        ['Target Type', report.targetType],
        ['Target ID', report.targetId],
        ['Community Name', report.communityName],
        ['Reporter Username', report.reporterUsername ? `@${report.reporterUsername}` : '—'],
        ['Reason', REASONS[report.reason] || report.reason],
        ['Description', report.description],
        ['Status', <AdminStatusBadge status={report.status} />],
        ['Action', report.action],
        ['Resolution Note', report.resolutionNote],
        ['Resolved By', report.resolvedBy],
        ['Resolved At', adminDate(report.resolvedAt)],
        ['Created At', adminDate(report.createdAt)],
      ]} />
      {report.status === 'PENDING' && (
        <div className="admin-inline-actions">
          <button className="admin-button admin-button-primary" type="button" onClick={() => setDecision('resolve')}>Resolve</button>
          <button className="admin-button admin-button-danger-outline" type="button" onClick={() => setDecision('reject')}>Reject</button>
        </div>
      )}
      {decision && report.status === 'PENDING' && (
        <ReportDecisionDialog
          type={type}
          reportId={reportId}
          decision={decision}
          onClose={() => setDecision(null)}
          onSuccess={() => {
            detail.reload();
            onListRefresh();
          }}
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
  const [selectedReport, setSelectedReport] = useState(null);
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
    { key: 'id', label: 'Report ID', numeric: true, render: report => adminNumber(report.id) },
    { key: 'targetType', label: 'Target Type', render: report => report.targetType || '—' },
    { key: 'targetId', label: 'Target ID', numeric: true, render: report => report.targetId ?? '—' },
    {
      key: 'communityName',
      label: 'Community Name',
      render: report => report.communityName
        ? <Link to={`/c/${encodeURIComponent(report.communityName)}`}>c/{report.communityName}</Link>
        : '—',
    },
    {
      key: 'reporterUsername',
      label: 'Reporter Username',
      render: report => report.reporterUsername
        ? <Link to={`/u/${encodeURIComponent(report.reporterUsername)}`}>@{report.reporterUsername}</Link>
        : '—',
    },
    { key: 'reason', label: 'Reason', render: report => REASONS[report.reason] || report.reason || '—' },
    {
      key: 'description',
      label: 'Description',
      className: 'admin-wrap-cell',
      render: report => <span className="admin-report-description">{report.description || '—'}</span>,
    },
    { key: 'status', label: 'Status', render: report => <AdminStatusBadge status={report.status} /> },
    { key: 'action', label: 'Action', render: report => report.action || '—' },
    { key: 'resolvedBy', label: 'Resolved By', render: report => report.resolvedBy || '—' },
    { key: 'resolvedAt', label: 'Resolved At', numeric: true, render: report => adminDate(report.resolvedAt) },
    { key: 'createdAt', label: 'Created At', numeric: true, render: report => adminDate(report.createdAt) },
    {
      key: 'viewDetails',
      label: 'Details',
      className: 'admin-actions-cell',
      render: report => <button className="admin-text-action" type="button" onClick={() => setSelectedReport({ type: report.targetType, reportId: report.id })}>View Details</button>,
    },
  ];

  return (
    <div className="admin-page admin-report-management">
      <AdminPageHeader
        title="Report Management"
        description="Theo dõi báo cáo nội dung theo loại, trạng thái và cộng đồng."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar">
        <form className="admin-filter-bar" onSubmit={applyCommunity}>
          <AdminFilter
            label="Type"
            value={type}
            options={REPORT_TYPES}
            onChange={value => query.update({ type: value })}
          />
          <AdminFilter
            label="Status"
            value={status}
            options={REPORT_STATUSES}
            onChange={value => query.update({ status: value })}
          />
          <label className="admin-filter" htmlFor="admin-report-community-name">
            <span>Community Name</span>
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
        caption="Danh sách báo cáo Admin"
        empty={<AdminEmptyState title="Không tìm thấy báo cáo" onReset={resetFilters} />}
      />
      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />
      {selectedReport && (
        <AdminDetailDrawer
          title={`Report #${selectedReport.reportId}`}
          onClose={() => setSelectedReport(null)}
        >
          <ReportDetailContent type={selectedReport.type} reportId={selectedReport.reportId} onListRefresh={result.reload} />
        </AdminDetailDrawer>
      )}
    </div>
  );
}
