import { create } from 'zustand';
import { Report, ReportStatus, ReportContentType } from '../types';
import { MOCK_REPORTS } from '../mocks/mockData';

interface ReportState {
  reports: Report[];
  addReport: (data: {
    contentType: ReportContentType;
    contentId: string;
    contentTitle?: string;
    contentSnippet?: string;
    communityName?: string;
    reason: string;
    targetUsername?: string;
  }) => void;
  resolveReport: (reportId: string, note?: string) => void;
  rejectReport: (reportId: string, note?: string) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: MOCK_REPORTS,

  addReport: (data) => {
    const newReport: Report = {
      id: `rep_${Date.now()}`,
      contentType: data.contentType,
      contentId: data.contentId,
      contentTitle: data.contentTitle,
      contentSnippet: data.contentSnippet,
      communityName: data.communityName,
      reporterUsername: 'huutri_dev',
      targetUsername: data.targetUsername,
      reason: data.reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ reports: [newReport, ...state.reports] }));
  },

  resolveReport: (reportId, note) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'RESOLVED' as ReportStatus,
              resolutionNote: note || 'Đã xử lý nội dung vi phạm.',
            }
          : r
      ),
    }));
  },

  rejectReport: (reportId, note) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'REJECTED' as ReportStatus,
              resolutionNote: note || 'Báo cáo không vi phạm tiêu chuẩn cộng đồng.',
            }
          : r
      ),
    }));
  },
}));
