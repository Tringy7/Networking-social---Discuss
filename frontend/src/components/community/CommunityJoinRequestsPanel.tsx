import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock, History, Inbox, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { communityService, type CommunityJoinRequest } from '../../services';
import useAdminResource from '../../hooks/useAdminResource';
import { useToastStore } from '../../store/useToastStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const statuses = {
  PENDING: { label: 'Chờ duyệt', variant: 'orange' },
  APPROVED: { label: 'Đã chấp thuận', variant: 'green' },
  REJECTED: { label: 'Đã từ chối', variant: 'red' },
  CLOSED: { label: 'Đã đóng', variant: 'neutral' },
} as const;

function RequestTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short', timeStyle: 'short',
  })}</time>;
}

export default function CommunityJoinRequestsPanel({ name }: { name: string }) {
  const [history, setHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState<{ id: number; approved: boolean } | null>(null);
  const notify = useToastStore((state) => state.addToast);
  const requests = useAdminResource(useCallback(
    () => communityService.listJoinRequests(name, history, page), [name, history, page]
  ));
  const data = requests.data;
  const lastPage = data ? Math.max(0, data.totalPages - 1) : page;

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  async function review(request: CommunityJoinRequest, approved: boolean) {
    if (reviewing || request.status !== 'PENDING') return;
    setReviewing({ id: request.id, approved });
    try {
      await communityService.reviewJoinRequest(name, request.id, approved);
      notify(approved ? `Đã chấp thuận @${request.applicantUsername}.`
        : `Đã từ chối yêu cầu của @${request.applicantUsername}.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.', 'error');
    } finally {
      setReviewing(null);
      requests.reload();
    }
  }

  return <section className="space-y-4" aria-label="Yêu cầu tham gia cộng đồng">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
      <div role="group" aria-label="Trạng thái yêu cầu" className="flex gap-2">
        <Button size="sm" variant={history ? 'ghost' : 'secondary'} aria-pressed={!history} disabled={reviewing !== null}
          leftIcon={<Clock size={15} aria-hidden="true" />} onClick={() => { setHistory(false); setPage(0); }}>Chờ duyệt</Button>
        <Button size="sm" variant={history ? 'secondary' : 'ghost'} aria-pressed={history} disabled={reviewing !== null}
          leftIcon={<History size={15} aria-hidden="true" />} onClick={() => { setHistory(true); setPage(0); }}>Lịch sử</Button>
      </div>
      {data && <span className="text-sm text-[var(--text-secondary)]">{data.totalElements.toLocaleString('vi-VN')} yêu cầu</span>}
    </div>
    {requests.loading && <p role="status">Đang tải yêu cầu…</p>}
    {requests.error && <div role="alert" className="space-y-2">
      <p>{requests.error}</p>
      <Button size="sm" variant="secondary" onClick={requests.reload}>Thử lại</Button>
    </div>}
    {data && page <= lastPage && <>
      {data.content.length === 0 ? <div className="editorial-empty">
        <Inbox size={24} className="mx-auto mb-2 text-[var(--text-secondary)]" aria-hidden="true" />
        <p>{history ? 'Chưa có lịch sử xét duyệt.' : 'Không có yêu cầu đang chờ duyệt.'}</p>
      </div> : <ul className="divide-y divide-[var(--border-color)]">
        {data.content.map(request => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar alt={request.applicantUsername} size="sm" />
            <div className="min-w-0 space-y-1">
              <Link to={`/u/${encodeURIComponent(request.applicantUsername)}`} className="break-all font-semibold hover:underline">
                @{request.applicantUsername}
              </Link>
              <p className="text-sm text-[var(--text-secondary)]">Gửi lúc <RequestTime value={request.requestedAt} /></p>
              {history && (request.reviewerUsername || request.reviewedAt) && <p className="text-sm text-[var(--text-secondary)]">
                {request.reviewerUsername && <>Người xử lý @{request.reviewerUsername}</>}
                {request.reviewerUsername && request.reviewedAt && ' · '}
                {request.reviewedAt && <RequestTime value={request.reviewedAt} />}
              </p>}
            </div>
          </div>
          {history ? <Badge variant={statuses[request.status].variant}>{statuses[request.status].label}</Badge>
            : <div className="flex gap-2">
              <Button size="sm" variant="secondary" leftIcon={<X size={15} aria-hidden="true" />} disabled={reviewing !== null}
                isLoading={reviewing?.id === request.id && !reviewing.approved} onClick={() => void review(request, false)}>Từ chối</Button>
              <Button size="sm" leftIcon={<Check size={15} aria-hidden="true" />} disabled={reviewing !== null}
                isLoading={reviewing?.id === request.id && reviewing.approved} onClick={() => void review(request, true)}>Chấp thuận</Button>
            </div>}
        </li>)}
      </ul>}
      {data.totalPages > 1 && <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] pt-3" aria-label="Phân trang yêu cầu">
        <Button size="sm" variant="secondary" disabled={page === 0 || reviewing !== null} leftIcon={<ChevronLeft size={15} aria-hidden="true" />} onClick={() => setPage(page - 1)}>Trang trước</Button>
        <span className="text-sm text-[var(--text-secondary)]">Trang {data.page + 1}/{data.totalPages}</span>
        <Button size="sm" variant="secondary" disabled={page >= lastPage || reviewing !== null} rightIcon={<ChevronRight size={15} aria-hidden="true" />} onClick={() => setPage(page + 1)}>Trang sau</Button>
      </nav>}
    </>}
  </section>;
}
