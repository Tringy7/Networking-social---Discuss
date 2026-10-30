import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { ReportStatus } from '../../types';
import Button from '../../components/ui/Button';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export const CommunityModerationPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();

  const { reports, resolveReport, rejectReport, hydrateCommunity } = useReportStore();
  const { addToast } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED'>(
    'PENDING'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!communityName) return;
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);
    hydrateCommunity(communityName).catch((error: unknown) => {
      if (!active) return;
      setLoadFailed(true);
      addToast(error instanceof Error ? error.message : 'Không thể tải hàng đợi kiểm duyệt.', 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [addToast, communityName, hydrateCommunity]);

  // Filter reports relevant to this community
  const communityReports = reports.filter((r) => {
    const matchesComm = r.communityName === communityName;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesComm && matchesStatus;
  });

  const handleResolve = async (id: string) => {
    try {
      await resolveReport(id, 'Đã xử lý gỡ bỏ nội dung vi phạm tiêu chuẩn cộng đồng.');
      addToast('Đã phê duyệt xử lý báo cáo vi phạm!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xử lý báo cáo.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectReport(id, 'Nội dung hợp lệ, không vi phạm tiêu chuẩn cộng đồng.');
      addToast('Đã bác bỏ báo cáo.', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật báo cáo.', 'error');
    }
  };

  const formatReportDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Ngày không rõ' : date.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/community/${communityName}`)}
            aria-label="Quay lại cộng đồng"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">community/{communityName}</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              <ShieldAlert className="w-5 h-5 text-[var(--color-orange-ink)]" />
              <span>Hàng đợi kiểm duyệt</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Xem xét các nội dung bị báo cáo bởi thành viên và xử phạt vi phạm
            </p>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-[var(--bg-surface)] p-1 text-sm font-medium">
        {(['PENDING', 'RESOLVED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
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
        {isLoading ? (
          <div role="status" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] py-16 text-center text-sm text-[var(--text-secondary)]">Đang tải báo cáo…</div>
        ) : loadFailed ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 text-center">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tải được hàng đợi</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kiểm tra kết nối rồi thử tải lại.</p>
            <Button variant="secondary" size="sm" onClick={() => {
              if (!communityName) return;
              setIsLoading(true);
              setLoadFailed(false);
              hydrateCommunity(communityName)
                .catch((error: unknown) => {
                  setLoadFailed(true);
                  addToast(error instanceof Error ? error.message : 'Không thể tải hàng đợi kiểm duyệt.', 'error');
                })
                .finally(() => setIsLoading(false));
            }}>Thử lại</Button>
          </div>
        ) : communityReports.map((report) => (
          <div
            key={report.id}
            className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--color-orange-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-orange-ink)]">
                    {report.contentType}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      report.status === 'PENDING'
                        ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                        : report.status === 'RESOLVED'
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {report.status === 'PENDING'
                      ? 'CHỜ DUYỆT'
                      : report.status === 'RESOLVED'
                      ? 'ĐÃ GIẢI QUYẾT'
                      : 'ĐÃ BÁC BỎ'}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {report.contentTitle || `Nội dung ID: ${report.contentId}`}
                </h2>
              </div>

              <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--text-muted)]">
                <Clock className="h-3.5 w-3.5" />
                {formatReportDate(report.createdAt)}
              </span>
            </div>

            {/* Snippet / reason */}
            <div className="space-y-2 rounded-xl bg-[var(--bg-main)] p-4 text-sm">
              <div className="text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">Trích dẫn:</strong> "{report.contentSnippet}"
              </div>
              <div className="font-medium text-[var(--color-warning)]">
                <strong>Lý do báo cáo:</strong> {report.reason}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Người báo cáo: @{report.reporterUsername}{' '}
                {report.targetUsername && `· Tài khoản bị tố cáo: @${report.targetUsername}`}
              </div>
            </div>

            {report.resolutionNote && (
              <div className="rounded-xl bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
                <strong>Ghi chú xử lý:</strong> {report.resolutionNote}
              </div>
            )}

            {/* Mod Action Buttons */}
            {report.status === 'PENDING' && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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

        {!isLoading && !loadFailed && communityReports.length === 0 && (
          <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-5 py-16 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-success)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không có báo cáo trong mục này</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Không có báo cáo nào đang chờ xử lý trong mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityModerationPage;
