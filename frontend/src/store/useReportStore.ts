import { create } from 'zustand';
import type { CreateReportRequest, Report } from '../types';
import { reportService } from '../services';

interface ReportState {
  reports: Report[];
  addReport: (data: CreateReportRequest) => Promise<void>;
}

export const useReportStore = create<ReportState>(set => ({
  reports: [],
  addReport: async data => {
    const report = await reportService.create(data);
    set(state => ({ reports: [report, ...state.reports] }));
  },
}));
