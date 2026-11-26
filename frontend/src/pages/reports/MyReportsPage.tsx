import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import useAdminResource from '../../hooks/useAdminResource';
import { reportService } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import type { ReportReason, ReportStatus, ReportTargetType } from '../../types';

const types: Record<ReportTargetType, string> = {
  POST: 'Bài viết', COMMENT: 'Bình luận', COMMUNITY: 'Cộng đồng',
};
const statuses: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý', RESOLVED: 'Đã giải quyết', REJECTED: 'Đã từ chối',
};
const reasons: Record<ReportReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Quấy rối',
  HATE_SPEECH: 'Ngôn từ thù ghét',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  MISINFORMATION: 'Thông tin sai lệch',
  OTHER: 'Lý do khác',
};
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const selectStyle = 'min-h-10 rounded-[var(--radius-control)] border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm';

function MyReportsList() {
  const [params, setParams] = useSearchParams();
  const typeValue = params.get('type') || '';
  const statusValue = params.get('status') || '';
  const type = Object.hasOwn(types, typeValue) ? typeValue as ReportTargetType : 'POST';
  const status = Object.hasOwn(statuses, statusValue) ? statusValue as ReportStatus : '';
  const requestedPage = Number(params.get('page') || 0);
  const page = Number.isInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 214748364 ? requestedPage : 0;
  const { data, loading, error, reload } = useAdminResource(
    useCallback(() => reportService.listMine(type, status, page), [type, status, page]),
  );

  function changeFilter(key: 'status' | 'type', value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  function changePage(nextPage: number) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('page', String(nextPage));
      return next;
    });
  }

  return <section className="utility-page space-y-4 pb-8" aria-busy={loading}>
    <PageHeader title="Báo cáo của tôi" description="Theo dõi các báo cáo bạn đã gửi và trạng thái xử lý." />
    <div className="flex flex-wrap gap-3">
      <label className="grid gap-1 text-sm">Loại báo cáo
        <select className={selectStyle} value={type} onChange={event => changeFilter('type', event.target.value)}>
          {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Trạng thái
        <select className={selectStyle} value={status} onChange={event => changeFilter('status', event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </div>
    {loading && <p role="status">Đang tải báo cáo…</p>}
    {error && <div role="alert" className="space-y-2"><p>{error}</p><Button variant="secondary" onClick={reload}>Thử lại</Button></div>}
    {data && !loading && !error && <>
      {data.content.length === 0 && <p role="status" className="py-8 text-[var(--text-secondary)]">Không có báo cáo phù hợp với bộ lọc hiện tại.</p>}
      <ul className="divide-y divide-[var(--border-color)] rounded-[var(--radius-card)] bg-[var(--bg-surface)]">
        {data.content.map(report => <li key={report.id} className="space-y-2 p-4 [overflow-wrap:anywhere]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{types[report.targetType]} #{report.targetId}</h2>
            <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium">{statuses[report.status]}</span>
          </div>
          <p className="text-sm">{reasons[report.reason] || report.reason}{report.communityName ? ` · c/${report.communityName}` : ''}</p>
          {report.description && <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{report.description}</p>}
          <p className="text-xs text-[var(--text-secondary)]">
            Gửi lúc <time dateTime={report.createdAt}>{dateFormat.format(new Date(report.createdAt))}</time>
            {report.resolvedAt && <> · Xử lý lúc <time dateTime={report.resolvedAt}>{dateFormat.format(new Date(report.resolvedAt))}</time></>}
          </p>
        </li>)}
      </ul>
      {(page > 0 || !data.last) && <nav aria-label="Phân trang báo cáo" className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => changePage(page - 1)}>Trang trước</Button>
        <span className="text-sm">Trang {page + 1}</span>
        <Button variant="secondary" size="sm" disabled={data.last} onClick={() => changePage(page + 1)}>Trang sau</Button>
      </nav>}
    </>}
  </section>;
}

export default function MyReportsPage() {
  const userId = useAuthStore(state => state.user?.id);
  return <MyReportsList key={userId} />;
}
