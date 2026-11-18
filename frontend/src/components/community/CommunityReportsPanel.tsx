import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import apiClient from '../../services/apiClient';
import { useToastStore } from '../../store/useToastStore';
import type { ReportStatus } from '../../types';

const reportTypes = { POST: 'Bài viết', COMMENT: 'Bình luận' } as const;
const reportStatuses = { PENDING: 'Chờ xử lý', RESOLVED: 'Đã giải quyết', REJECTED: 'Đã bác bỏ' } as const;
const reasons: Record<string, string> = {
  SPAM: 'Spam', HARASSMENT: 'Quấy rối', HATE_SPEECH: 'Ngôn từ thù ghét',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp', MISINFORMATION: 'Thông tin sai lệch', OTHER: 'Khác',
};
type ReportType = keyof typeof reportTypes;
type Decision = 'resolve' | 'reject';
type CommunityReport = {
  id: number;
  targetId: number;
  reporterUsername: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
};
type ReportPage = { content: CommunityReport[]; totalPages: number };
const control = 'rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2';

export default function CommunityReportsPanel({ name, canReview }: { name: string; canReview: boolean }) {
  const [type, setType] = useState<ReportType>('POST');
  const [status, setStatus] = useState<ReportStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<ReportPage | null>(null);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<{ id: number; action: Decision } | null>(null);
  const [note, setNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const notify = useToastStore(state => state.addToast);
  const base = `/communities/${encodeURIComponent(name)}/reports`;

  useEffect(() => {
    let active = true;
    setResult(null);
    setError('');
    const query = new URLSearchParams({ type, page: String(page), size: '10' });
    if (status) query.set('status', status);
    apiClient.get<ReportPage>(`${base}?${query}`)
      .then(data => {
        if (!active) return;
        const lastPage = Math.max(0, data.totalPages - 1);
        if (page > lastPage) setPage(lastPage);
        else setResult(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải báo cáo.');
      });
    return () => { active = false; };
  }, [base, type, status, page, revision]);

  const beginReview = (id: number, action: Decision) => {
    setDecision({ id, action });
    setNote('');
    setReviewError('');
  };

  const review = async (event: FormEvent) => {
    event.preventDefault();
    if (!canReview || !decision || !note.trim() || saving) return;
    setSaving(true);
    setReviewError('');
    try {
      await apiClient.patch(`${base}/${type}/${decision.id}/${decision.action}`, { resolutionNote: note.trim() });
      setDecision(null);
      setResult(null);
      setRevision(value => value + 1);
      notify(decision.action === 'resolve' ? 'Đã giải quyết báo cáo.' : 'Đã bác bỏ báo cáo.', 'success');
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : 'Không thể xử lý báo cáo.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-4 p-4 sm:p-5">
    <div className="flex flex-wrap gap-3 text-sm">
      <label className="grid gap-1">Loại báo cáo
        <select className={control} value={type} disabled={saving} onChange={event => {
          setType(event.target.value as ReportType); setPage(0); setDecision(null); setResult(null);
        }}>
          {Object.entries(reportTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1">Trạng thái
        <select className={control} value={status} disabled={saving} onChange={event => {
          setStatus(event.target.value as ReportStatus | ''); setPage(0); setDecision(null); setResult(null);
        }}>
          <option value="">Tất cả</option>
          {Object.entries(reportStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </div>

    {error ? <div className="space-y-2" role="alert"><p>{error}</p>
      <Button size="sm" variant="secondary" onClick={() => setRevision(value => value + 1)}>Thử lại</Button>
    </div> : !result ? <p role="status">Đang tải báo cáo…</p> : result.content.length === 0 ?
      <p role="status" className="py-6 text-[var(--text-secondary)]">Không có báo cáo phù hợp.</p> :
      result.content.map(report => <article key={report.id} className="space-y-3 border-t border-[var(--border-color)] pt-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{type === 'POST' ?
            <Link className="hover:underline" to={`/post/${report.targetId}`}>Bài viết #{report.targetId}</Link> :
            `Bình luận #${report.targetId}`}</h3>
          <span className="text-sm text-[var(--text-secondary)]">{reportStatuses[report.status]}</span>
        </header>
        <p className="text-sm">{reasons[report.reason] || report.reason} · @{report.reporterUsername}</p>
        {report.description && <p className="whitespace-pre-wrap break-words text-sm text-[var(--text-secondary)]">{report.description}</p>}
        {report.resolutionNote && <p className="whitespace-pre-wrap break-words text-sm"><strong>Ghi chú xử lý</strong> · {report.resolutionNote}{report.resolvedBy && ` · @${report.resolvedBy}`}</p>}
        {canReview && report.status === 'PENDING' && (decision?.id === report.id ?
          <form className="space-y-2" onSubmit={review}>
            <label className="grid gap-1 text-sm">Ghi chú xử lý
              <textarea className={control} rows={3} value={note} onChange={event => setNote(event.target.value)}
                required maxLength={2000} disabled={saving} />
            </label>
            {reviewError && <p role="alert" className="text-sm text-[var(--color-danger)]">{reviewError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => setDecision(null)}>Hủy</Button>
              <Button type="submit" size="sm" disabled={!note.trim()} isLoading={saving}>
                {decision.action === 'resolve' ? 'Xác nhận giải quyết' : 'Xác nhận bác bỏ'}
              </Button>
            </div>
          </form> :
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => beginReview(report.id, 'reject')}>Bác bỏ</Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => beginReview(report.id, 'resolve')}>Giải quyết</Button>
          </div>)}
      </article>)}

    {result && result.totalPages > 1 && <nav aria-label="Phân trang báo cáo" className="flex flex-wrap items-center gap-3 text-sm">
      <Button size="sm" variant="secondary" disabled={saving || page === 0} onClick={() => {
        setDecision(null); setResult(null); setPage(page - 1);
      }}>Trang trước</Button>
      <span>Trang {page + 1} / {result.totalPages}</span>
      <Button size="sm" variant="secondary" disabled={saving || page + 1 >= result.totalPages} onClick={() => {
        setDecision(null); setResult(null); setPage(page + 1);
      }}>Trang sau</Button>
    </nav>}
  </div>;
}
