import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import { ReportStatus } from '../../types';
import Button from '../../components/ui/Button';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Clock,
  UserX,
} from 'lucide-react';

export const CommunityModerationPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();

  const { reports, resolveReport, rejectReport } = useReportStore();
  const { communities } = useCommunityStore();
  const { addToast } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED'>(
    'PENDING'
  );

  const community = communities.find((c) => c.name === communityName);

  // Filter reports relevant to this community
  const communityReports = reports.filter((r) => {
    const matchesComm = !r.communityName || r.communityName === communityName;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesComm && matchesStatus;
  });

  const handleResolve = (id: string) => {
    resolveReport(id, 'Đã xử lý gỡ bỏ nội dung vi phạm tiêu chuẩn cộng đồng.');
    addToast('Đã phê duyệt xử lý báo cáo vi phạm!', 'success');
  };

  const handleReject = (id: string) => {
    rejectReport(id, 'Nội dung hợp lệ, không vi phạm tiêu chuẩn cộng đồng.');
    addToast('Đã bác bỏ báo cáo.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/c/${communityName}`)}
            className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#3B82F6]" />
              <span>Hàng đợi kiểm duyệt c/{communityName}</span>
            </h1>
            <p className="text-xs text-[#9A9DA3] mt-0.5">
              Xem xét các nội dung bị báo cáo bởi thành viên và xử phạt vi phạm
            </p>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 border-b border-[#303235] pb-2 text-xs font-semibold">
        {(['PENDING', 'RESOLVED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-bold'
                : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
            }`}
          >
            {s === 'PENDING'
              ? 'Chờ duyệt'
              : s === 'RESOLVED'
              ? 'Đã xử lý'
              : s === 'REJECTED'
              ? 'Đã từ chối'
              : 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Reports Queue */}
      <div className="space-y-4">
        {communityReports.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-3xl bg-[#191A1C] border border-[#303235] space-y-3.5 shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#FF5700] bg-[#FF5700]/10 px-2 py-0.5 rounded">
                    {report.contentType}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      report.status === 'PENDING'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        : report.status === 'RESOLVED'
                        ? 'bg-[#22C55E]/15 text-[#22C55E]'
                        : 'bg-[#70747C]/15 text-[#70747C]'
                    }`}
                  >
                    {report.status === 'PENDING'
                      ? 'CHỜ DUYỆT'
                      : report.status === 'RESOLVED'
                      ? 'ĐÃ GIẢI QUYẾT'
                      : 'ĐÃ BÁC BỎ'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#F5F5F5]">
                  {report.contentTitle || `Nội dung ID: ${report.contentId}`}
                </h3>
              </div>

              <span className="text-[11px] text-[#70747C] flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                hôm nay
              </span>
            </div>

            {/* Snippet / reason */}
            <div className="p-3 rounded-2xl bg-[#101112] border border-[#303235] text-xs space-y-1.5">
              <div className="text-[#9A9DA3]">
                <strong className="text-[#F5F5F5]">Trích dẫn:</strong> "{report.contentSnippet}"
              </div>
              <div className="text-[#F59E0B] font-medium">
                <strong>Lý do báo cáo:</strong> {report.reason}
              </div>
              <div className="text-[11px] text-[#70747C]">
                Người báo cáo: @{report.reporterUsername}{' '}
                {report.targetUsername && `· Tài khoản bị tố cáo: @${report.targetUsername}`}
              </div>
            </div>

            {report.resolutionNote && (
              <div className="text-xs text-[#22C55E] bg-[#22C55E]/10 p-2.5 rounded-xl border border-[#22C55E]/20">
                <strong>Ghi chú xử lý:</strong> {report.resolutionNote}
              </div>
            )}

            {/* Mod Action Buttons */}
            {report.status === 'PENDING' && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#303235]/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(report.id)}
                  leftIcon={<XCircle className="w-4 h-4 text-[#70747C]" />}
                >
                  Bác bỏ báo cáo
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleResolve(report.id)}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Xóa nội dung & Xử phạt
                </Button>
              </div>
            )}
          </div>
        ))}

        {communityReports.length === 0 && (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#22C55E] mx-auto opacity-70" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Hàng đợi kiểm duyệt trống!</h4>
            <p className="text-xs text-[#9A9DA3]">
              Không có báo cáo nào đang chờ xử lý trong mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityModerationPage;
