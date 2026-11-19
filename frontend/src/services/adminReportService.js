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
