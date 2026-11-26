import { listAdminReports } from './adminReportService';
import { adminService } from './index';

export const ADMIN_REPORT_TYPES = [
  ['POST', 'Bài viết'],
  ['COMMENT', 'Bình luận'],
  ['COMMUNITY', 'Cộng đồng'],
] as const;

export const adminModeration = {
  stats: adminService.getStats,
  reportCounts: async () => {
    const byType = await Promise.all(ADMIN_REPORT_TYPES.map(async ([type, label]) => {
      const [pending, resolved] = await Promise.all([
        listAdminReports({ type, size: 1, status: 'PENDING' }),
        listAdminReports({ type, size: 1, status: 'RESOLVED' }),
      ]);
      return { type, label, pending: pending.totalElements, resolved: resolved.totalElements };
    }));
    return {
      pending: byType.reduce((total, count) => total + count.pending, 0),
      resolved: byType.reduce((total, count) => total + count.resolved, 0),
      byType,
    };
  },
};
