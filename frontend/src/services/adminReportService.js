import apiClient from './apiClient';

export function listAdminReports({ type, status = '', communityName = '', page = 0, size = 10 } = {}) {
  const reportType = ['POST', 'COMMENT', 'COMMUNITY'].includes(type) ? type : 'POST';
  const params = new URLSearchParams({ type: reportType, page: String(page), size: String(size) });
  if (['PENDING', 'RESOLVED', 'REJECTED'].includes(status)) params.set('status', status);
  if (communityName) params.set('communityName', String(communityName).slice(0, 255));

  return apiClient.get(`/admin/reports?${params}`);
}

export function getAdminReportDetail(type, reportId) {
  const reportType = ['POST', 'COMMENT', 'COMMUNITY'].includes(type) ? type : 'POST';
  return apiClient.get(`/admin/reports/${encodeURIComponent(reportType)}/${encodeURIComponent(String(reportId))}`);
}

function submitReportDecision(type, reportId, resolutionNote, decision) {
  if (!['POST', 'COMMENT', 'COMMUNITY'].includes(type)) {
    throw new Error('Loại báo cáo không hợp lệ.');
  }
  const note = String(resolutionNote || '').trim();
  if (!note) throw new Error('Resolution Note là bắt buộc.');
  if (note.length > 2000) throw new Error('Resolution Note không được vượt quá 2000 ký tự.');

  return apiClient.patch(
    `/admin/reports/${encodeURIComponent(type)}/${encodeURIComponent(String(reportId))}/${decision}`,
    { resolutionNote: note },
  );
}

export function resolveAdminReport(type, reportId, resolutionNote) {
  return submitReportDecision(type, reportId, resolutionNote, 'resolve');
}

export function rejectAdminReport(type, reportId, resolutionNote) {
  return submitReportDecision(type, reportId, resolutionNote, 'reject');
}
