import { useCallback, useEffect, useRef, useState } from 'react';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { listAdminActivityLogs } from '../../services/adminActivityLogService.js';
import {
  AdminDataTable,
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

function activityTone(action = '') {
  if (/DELETE|LOCK|BAN|SUSPEND|REJECT/i.test(action)) return 'danger';
  if (/CREATE|RESOLVE|UNLOCK|APPROVE|UPDATE|EDIT/i.test(action)) return 'positive';
  return 'neutral';
}

function activityDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityLogManagementPage() {
  const query = useAdminQuery();
  const actorUserId = query.params.get('actorUserId') || '';
  const action = (query.params.get('action') || '').slice(0, 80);
  const targetType = (query.params.get('targetType') || '').slice(0, 40);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => listAdminActivityLogs({ actorUserId, action, targetType, page, size }),
    [actorUserId, action, targetType, page, size],
  ));
  const [draftState, setDraftState] = useState({ source: `${actorUserId}\u0000${action}\u0000${targetType}`, actorUserId, action, targetType });
  const [filterError, setFilterError] = useState('');
  const filterTimer = useRef(null);
  const source = `${actorUserId}\u0000${action}\u0000${targetType}`;
  const drafts = draftState.source === source ? draftState : { source, actorUserId, action, targetType };
  const rows = result.data?.empty ? [] : result.data?.content || [];

  useEffect(() => () => clearTimeout(filterTimer.current), []);

  const scheduleFilterChange = values => {
    const next = { ...drafts, ...values };
    setDraftState(next);
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      const actor = next.actorUserId.trim();
      const actorNumber = Number(actor);
      if (actor && (!/^\d+$/.test(actor) || !Number.isSafeInteger(actorNumber) || actorNumber <= 0)) {
        setFilterError('Actor User ID phải là số nguyên dương.');
        return;
      }
      setFilterError('');
      query.update({
        actorUserId: actor ? String(actorNumber) : '',
        action: next.action.trim().slice(0, 80),
        targetType: next.targetType.trim().slice(0, 40),
      }, true);
    }, 350);
  };

  const applyFilters = event => {
    event.preventDefault();
    clearTimeout(filterTimer.current);
    const actor = drafts.actorUserId.trim();
    const actorNumber = Number(actor);
    if (actor && (!/^\d+$/.test(actor) || !Number.isSafeInteger(actorNumber) || actorNumber <= 0)) {
      setFilterError('Actor User ID phải là số nguyên dương.');
      return;
    }
    setFilterError('');
    query.update({
      actorUserId: actor ? String(actorNumber) : '',
      action: drafts.action.trim().slice(0, 80),
      targetType: drafts.targetType.trim().slice(0, 40),
    });
  };

  const clearFilters = () => {
    clearTimeout(filterTimer.current);
    setFilterError('');
    setDraftState({ source: '\u0000\u0000', actorUserId: '', action: '', targetType: '' });
    query.update({ actorUserId: '', action: '', targetType: '' });
  };

  const columns = [
    { key: 'id', label: 'ID nhật ký', numeric: true, render: log => adminNumber(log.id) },
    { key: 'actorUserId', label: 'ID người thực hiện', numeric: true, render: log => log.actorUserId ?? '—' },
    { key: 'actorUsername', label: 'Người thực hiện', render: log => log.actorUsername || '—' },
    {
      key: 'action',
      label: 'Hành động',
      render: log => <span className={`admin-activity-action-badge tone-${activityTone(log.action)}`}>{log.action || '—'}</span>,
    },
    { key: 'targetType', label: 'Loại đối tượng', render: log => log.targetType || '—' },
    { key: 'targetId', label: 'ID đối tượng', numeric: true, render: log => log.targetId ?? '—' },
    { key: 'note', label: 'Ghi chú', className: 'admin-wrap-cell', render: log => <span className="admin-activity-note">{log.note || '—'}</span> },
    { key: 'createdAt', label: 'Thời điểm', numeric: true, render: log => activityDateTime(log.createdAt) },
  ];

  return (
    <div className="admin-page admin-activity-log-management">
      <AdminPageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi các thao tác quản trị được ghi nhận trong hệ thống."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <form className="admin-activity-filters" onSubmit={applyFilters}>
        <label className="admin-filter" htmlFor="admin-log-actor-id">
          <span>ID người thực hiện</span>
          <input
            id="admin-log-actor-id"
            type="number"
            min="1"
            step="1"
            value={drafts.actorUserId}
            onChange={event => scheduleFilterChange({ actorUserId: event.target.value })}
            placeholder="Ví dụ: 9"
          />
        </label>
        <label className="admin-filter" htmlFor="admin-log-action">
          <span>Mã hành động</span>
          <input
            id="admin-log-action"
            value={drafts.action}
            maxLength={80}
            onChange={event => scheduleFilterChange({ action: event.target.value })}
            placeholder="Ví dụ: DELETE_POST"
          />
        </label>
        <label className="admin-filter" htmlFor="admin-log-target-type">
          <span>Loại đối tượng</span>
          <input
            id="admin-log-target-type"
            value={drafts.targetType}
            maxLength={40}
            onChange={event => scheduleFilterChange({ targetType: event.target.value })}
            placeholder="Ví dụ: POST"
          />
        </label>
        <div className="admin-activity-filter-actions">
          <button className="admin-button admin-button-primary" type="submit">Áp dụng</button>
          {(actorUserId || action || targetType) && <button className="admin-button" type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
        </div>
      </form>
      {filterError && <p className="admin-inline-error" role="alert">{filterError}</p>}

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải nhật ký…'
            : result.error
              ? 'Không thể tải nhật ký'
              : `${adminNumber(result.data?.totalElements)} bản ghi`}
        </span>
      </div>
      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={log => log.id}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Nhật ký hoạt động"
        empty={<AdminEmptyState title="Không tìm thấy nhật ký hoạt động" />}
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
