import apiClient from './apiClient';
import { adminService } from './index';

type ReportType = 'POST' | 'COMMENT' | 'COMMUNITY';

const reportTypes: ReportType[] = ['POST', 'COMMENT', 'COMMUNITY'];
function reportPage(type: ReportType, page: number, size: number, status = '') {
  const query = new URLSearchParams({ type, page: String(page), size: String(size) });
  if (status) query.set('status', status);
  return apiClient.get<{ totalElements: number }>(`/admin/reports?${query}`);
}

export const adminModeration = {
  stats: adminService.getStats,
  reportCounts: async () => {
    const totals = await Promise.all((['PENDING', 'RESOLVED'] as const).map(async status => {
      const pages = await Promise.all(reportTypes.map(type => reportPage(type, 0, 1, status)));
      return pages.reduce((sum, page) => sum + page.totalElements, 0);
    }));
    return { pending: totals[0], resolved: totals[1] };
  },
};
