import { useCallback, useState } from 'react';
import { communityService } from '../../services';
import useAdminResource from '../../hooks/useAdminResource';
import { useToastStore } from '../../store/useToastStore';
import Button from '../ui/Button';

const statusLabel = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã chấp thuận',
  REJECTED: 'Đã từ chối',
  CLOSED: 'Đã đóng',
};

function formatTime(value: string) {
  return new Date(value).toLocaleString('vi-VN');
}

export default function CommunityJoinRequestsPanel({ name }: { name: string }) {
  const [history, setHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const notify = useToastStore((state) => state.addToast);
  const requests = useAdminResource(useCallback(
    () => communityService.listJoinRequests(name, history, page), [name, history, page]
  ));

  async function review(id: number, approved: boolean) {
    setReviewing(id);
    try {
      await communityService.reviewJoinRequest(name, id, approved);
      notify(approved ? 'Đã duyệt yêu cầu tham gia.' : 'Đã từ chối yêu cầu tham gia.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.', 'error');
    } finally {
      setReviewing(null);
      if (page > 0 && requests.data?.content.length === 1) setPage(page - 1);
      else requests.reload();
    }
  }

  return <section className="space-y-4" aria-label="Xét duyệt thành viên">
    <div className="flex gap-2">
      <Button size="sm" variant={history ? 'secondary' : 'primary'} aria-pressed={!history} disabled={reviewing !== null}
        onClick={() => { setHistory(false); setPage(0); }}>Chờ duyệt</Button>
      <Button size="sm" variant={history ? 'primary' : 'secondary'} aria-pressed={history} disabled={reviewing !== null}
        onClick={() => { setHistory(true); setPage(0); }}>Lịch sử</Button>
    </div>
    {requests.loading && <p role="status">Đang tải yêu cầu…</p>}
    {requests.error && <div role="alert" className="space-y-2">
      <p>{requests.error}</p>
      <Button size="sm" variant="secondary" onClick={requests.reload}>Thử lại</Button>
    </div>}
    {requests.data && <>
      {requests.data.content.length === 0 && <p>{history ? 'Chưa có lịch sử xét duyệt.' : 'Không có yêu cầu đang chờ duyệt.'}</p>}
      <ul className="divide-y divide-[var(--border-color)]">
        {requests.data.content.map((request) => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="space-y-1">
            <p className="font-medium">@{request.applicantUsername}</p>
            <p className="text-sm text-[var(--text-secondary)]">Gửi lúc {formatTime(request.requestedAt)}</p>
            {history && <p className="text-sm">
              {statusLabel[request.status]}
              {request.reviewerUsername && request.reviewedAt && <> bởi @{request.reviewerUsername} lúc {formatTime(request.reviewedAt)}</>}
            </p>}
          </div>
          {!history && <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={reviewing !== null} onClick={() => void review(request.id, false)}>Từ chối</Button>
            <Button size="sm" disabled={reviewing !== null} onClick={() => void review(request.id, true)}>Chấp thuận</Button>
          </div>}
        </li>)}
      </ul>
      {(page > 0 || requests.data.totalPages > 1) && <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" disabled={page === 0 || reviewing !== null} onClick={() => setPage(page - 1)}>Trang trước</Button>
        <span className="text-sm">Trang {page + 1}</span>
        <Button size="sm" variant="secondary" disabled={page + 1 >= requests.data.totalPages || reviewing !== null} onClick={() => setPage(page + 1)}>Trang sau</Button>
      </div>}
    </>}
  </section>;
}
