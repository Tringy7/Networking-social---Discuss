import { create } from 'zustand';
import { Report, ReportContentType } from '../types';
import { reportService } from '../services';

interface ReportState {
  reports: Report[];
  hydrate: () => Promise<void>;
  hydrateCommunity: (communityName: string) => Promise<void>;
  addReport: (data: {
    contentType: ReportContentType;
    contentId: string;
    contentTitle?: string;
    contentSnippet?: string;
    communityName?: string;
    reason: string;
    targetUsername?: string;
  }) => Promise<void>;
  resolveReport: (reportId: string, note?: string) => Promise<void>;
  rejectReport: (reportId: string, note?: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],

  hydrate: async () => {
    const reports = await reportService.list();
    set({ reports });
  },

  hydrateCommunity: async (communityName) => {
    const reports = await reportService.listForCommunity(communityName);
    set({ reports });
  },

  addReport: async (data) => {
    const report = await reportService.create(data);
    set((state) => ({ reports: [report, ...state.reports] }));
  },

  resolveReport: async (reportId, note) => {
    const report = await reportService.resolve(reportId, 'RESOLVED', note);
    set((state) => ({
      reports: state.reports.map((item) => item.id === reportId ? report : item),
    }));
  },

  rejectReport: async (reportId, note) => {
    const report = await reportService.resolve(reportId, 'REJECTED', note);
    set((state) => ({
      reports: state.reports.map((item) => item.id === reportId ? report : item),
    }));
  },
}));
