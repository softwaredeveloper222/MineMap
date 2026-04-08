import { create } from 'zustand';

type ReportsStore = {
  reports: any[];
  reportDetails: any[];
  setReports: (reports: any[]) => void;
  setReportDetail: (reportDetails: any[]) => void;
  addReport: (report: any) => void;
  addReportDetail: (detail: any) => void;
  deleteReport: (reportId: string) => void;
};

export const useReportsStore = create<ReportsStore>((set) => ({
  reports: [],
  reportDetails: [],

  setReports: (reports) => set({ reports }),

  addReport: (report) =>
    set((state) => ({
      reports: [...state.reports, report],
    })),

  setReportDetail: (reportDetails) => set({ reportDetails }),

  addReportDetail: (detail) =>
    set((state) => ({
      reportDetails: [...state.reportDetails, detail],
    })),

  deleteReport: (reportId) =>
    set((state) => ({
      reports: state.reports.filter((report) => report.id !== reportId),
    })),
}));
