import React, { useEffect, useState } from 'react';
import { useReportStore } from '../../store/useReportStore';
import { useToastStore } from '../../store/useToastStore';
import { Report } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ShieldAlert, CheckCircle2, XCircle, Eye } from 'lucide-react';

export const ReportManagementPage: React.FC = () => {
  const { reports, resolveReport, rejectReport } = useReportStore();
  const { addToast } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);
    useReportStore.getState().hydrate()
      .catch((error: unknown) => {
        if (!active) return;
        setLoadFailed(true);
        addToast(error instanceof Error ? error.message : 'Không thể tải báo cáo.', 'error');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
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
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[var(--color-danger)]" />
          <span>Quản lý báo cáo vi phạm toàn hệ thống</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Theo dõi và xử lý các nội dung độc hại, bài viết spam hoặc tài khoản bị khiếu nại
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="PENDING">Chờ xử lý (Pending)</option>
          <option value="RESOLVED">Đã giải quyết (Resolved)</option>
          <option value="REJECTED">Đã bác bỏ (Rejected)</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer"
        >
          <option value="ALL">Mọi loại nội dung</option>
          <option value="POST">Bài viết (POST)</option>
          <option value="COMMENT">Bình luận (COMMENT)</option>
          <option value="COMMUNITY">Cộng đồng (COMMUNITY)</option>
        </select>

        <span className="ml-auto text-sm text-[var(--text-secondary)]">
          {filteredReports.length} báo cáo
        </span>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table aria-label="Báo cáo vi phạm" className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[var(--bg-main)] text-xs font-semibold text-[var(--text-secondary)]">
              <tr>
                <th className="p-4">Loại</th>
                <th className="p-4">Nội dung báo cáo</th>
                <th className="p-4">Lý do</th>
                <th className="p-4">Người báo cáo</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                  <td className="p-4">
                    <span className="rounded-md bg-[var(--color-orange-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-orange-ink)]">
                      {rep.contentType}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="max-w-xs truncate font-semibold text-[var(--text-primary)]">
                      {rep.contentTitle || rep.contentId}
                    </div>
                    {rep.contentSnippet && (
                      <div className="max-w-xs truncate text-xs text-[var(--text-secondary)]">
                        "{rep.contentSnippet}"
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs p-4 font-medium text-[var(--color-warning)]">{rep.reason}</td>
                  <td className="p-4 text-[var(--text-secondary)]">@{rep.reporterUsername}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${
                        rep.status === 'PENDING'
                          ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                          : rep.status === 'RESOLVED'
                          ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
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

      {!isLoading && !loadFailed && filteredReports.length === 0 && (
        <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-5 py-14 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-success)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Không có báo cáo trong mục này</h2>
          <p className="text-sm text-[var(--text-secondary)]">Hãy chọn trạng thái hoặc loại nội dung khác để lọc.</p>
        </div>
      )}
      {isLoading && (
        <div role="status" className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] py-12 text-center text-sm text-[var(--text-secondary)]">Đang tải báo cáo…</div>
      )}
      {loadFailed && (
        <div role="alert" className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 text-center">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tải được báo cáo</h2>
          <p className="text-sm text-[var(--text-secondary)]">Kiểm tra kết nối rồi thử lại.</p>
          <Button variant="secondary" size="sm" onClick={() => {
            setIsLoading(true);
            setLoadFailed(false);
            useReportStore.getState().hydrate()
              .catch((error: unknown) => {
                setLoadFailed(true);
                addToast(error instanceof Error ? error.message : 'Không thể tải báo cáo.', 'error');
              })
              .finally(() => setIsLoading(false));
          }}>Thử lại</Button>
        </div>
      )}

      {/* Report Review Drawer / Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Chi tiết báo cáo vi phạm #${selectedReport.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="space-y-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[var(--color-orange-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-orange-ink)]">
                  {selectedReport.contentType}
                </span>
                <span className="text-xs text-[var(--text-muted)]">Trạng thái: {selectedReport.status}</span>
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {selectedReport.contentTitle || selectedReport.contentId}
              </h3>
              {selectedReport.contentSnippet && (
                <p className="rounded-lg bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-secondary)]">
                  "{selectedReport.contentSnippet}"
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-[var(--text-muted)]">Lý do khiếu nại:</span>
              <p className="font-medium text-[var(--color-warning)]">{selectedReport.reason}</p>
            </div>

            {selectedReport.status === 'PENDING' && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-[var(--text-secondary)]">Ghi chú xử lý:</label>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Nhập ghi chú cho người dùng hoặc biên bản xử phạt..."
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReject(selectedReport.id)}
                    leftIcon={<XCircle className="w-4 h-4 text-[var(--text-muted)]" />}
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
