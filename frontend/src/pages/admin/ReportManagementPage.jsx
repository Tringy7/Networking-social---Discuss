import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { listAdminReports } from '../../services/adminReportService.js';
import {
  AdminDataTable,
  AdminEmptyState,
  AdminFilter,
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
    </div>
  );
}
