import React, { useEffect, useState } from 'react';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { Report, ReportStatus, ReportContentType } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Filter, Eye } from 'lucide-react';

export const ReportManagementPage: React.FC = () => {
  const { reports, resolveReport, rejectReport } = useReportStore();
  const { addToast } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    useReportStore.getState().hydrate().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải báo cáo.', 'error');
    });
  }, [addToast]);

  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || r.contentType === typeFilter;
    return matchesStatus && matchesType;
  });

  const handleResolve = async (id: string) => {
    try {
      await resolveReport(id, resolutionNote || 'Nội dung vi phạm đã được xử lý.');
      setSelectedReport(null);
      setResolutionNote('');
      addToast('Đã xử lý giải quyết báo cáo vi phạm!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xử lý báo cáo.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectReport(id, resolutionNote || 'Nội dung không vi phạm tiêu chuẩn.');
      setSelectedReport(null);
      setResolutionNote('');
      addToast('Đã bác bỏ báo cáo.', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xử lý báo cáo.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[#EF4444]" />
          <span>Quản lý báo cáo vi phạm toàn hệ thống</span>
        </h1>
        <p className="text-xs text-[#9A9DA3] mt-0.5">
          Theo dõi và xử lý các nội dung độc hại, bài viết spam hoặc tài khoản bị khiếu nại
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="PENDING">Chờ xử lý (Pending)</option>
          <option value="RESOLVED">Đã giải quyết (Resolved)</option>
          <option value="REJECTED">Đã bác bỏ (Rejected)</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
        >
          <option value="ALL">Mọi loại nội dung</option>
          <option value="POST">Bài viết (POST)</option>
          <option value="COMMENT">Bình luận (COMMENT)</option>
          <option value="COMMUNITY">Cộng đồng (COMMUNITY)</option>
        </select>

        <span className="text-xs text-[#70747C] ml-auto">
          {filteredReports.length} báo cáo
        </span>
      </div>

      {/* Reports Table */}
      <div className="bg-[#191A1C] border border-[#303235] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141517] border-b border-[#303235] text-[11px] text-[#70747C] uppercase font-bold">
              <tr>
                <th className="p-4">Loại</th>
                <th className="p-4">Nội dung báo cáo</th>
                <th className="p-4">Lý do</th>
                <th className="p-4">Người báo cáo</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303235]/60">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#1E2023] transition-colors">
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5700]/15 text-[#FF5700]">
                      {rep.contentType}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="font-bold text-[#F5F5F5] truncate">
                      {rep.contentTitle || rep.contentId}
                    </div>
                    {rep.contentSnippet && (
                      <div className="text-[11px] text-[#9A9DA3] truncate">
                        "{rep.contentSnippet}"
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-[#F59E0B] font-medium">{rep.reason}</td>
                  <td className="p-4 text-[#9A9DA3]">@{rep.reporterUsername}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'PENDING'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                          : rep.status === 'RESOLVED'
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-[#70747C]/15 text-[#70747C]'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedReport(rep)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Kiểm tra
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Review Drawer / Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Chi tiết báo cáo vi phạm #${selectedReport.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="p-3.5 rounded-2xl bg-[#141517] border border-[#303235] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#FF5700] bg-[#FF5700]/10 px-2 py-0.5 rounded">
                  {selectedReport.contentType}
                </span>
                <span className="text-[11px] text-[#70747C]">Trạng thái: {selectedReport.status}</span>
              </div>
              <h4 className="text-sm font-bold text-[#F5F5F5]">
                {selectedReport.contentTitle || selectedReport.contentId}
              </h4>
              {selectedReport.contentSnippet && (
                <p className="text-[#D1D5DB] bg-[#101112] p-2.5 rounded-xl border border-[#303235]">
                  "{selectedReport.contentSnippet}"
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[#70747C] font-semibold">Lý do khiếu nại:</span>
              <p className="text-[#F59E0B] font-medium">{selectedReport.reason}</p>
            </div>

            {selectedReport.status === 'PENDING' && (
              <div className="space-y-2 pt-2 border-t border-[#303235]">
                <label className="text-xs font-semibold text-[#9A9DA3]">Ghi chú xử lý:</label>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Nhập ghi chú cho người dùng hoặc biên bản xử phạt..."
                  className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none"
                />

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReject(selectedReport.id)}
                    leftIcon={<XCircle className="w-4 h-4 text-[#70747C]" />}
                  >
                    Bác bỏ báo cáo
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolve(selectedReport.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Xác nhận vi phạm & Xóa
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReportManagementPage;
