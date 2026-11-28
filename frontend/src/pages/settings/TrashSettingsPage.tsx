import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { postService, type TrashedPost } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import PostBody from '../../components/post/PostBody';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import './trashSettings.css';

export default function TrashSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const toast = useToastStore((state) => state.addToast);
  const [items, setItems] = useState<TrashedPost[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<TrashedPost | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setItems([]);
    if (!userId) { setLoading(false); return; }
    postService.trash(page).then((result) => {
      if (active) { setItems(result.content); setLast(result.last); }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải thùng rác.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, retry, userId]);

  const restore = async (item: TrashedPost) => {
    if (restoring) return;
    setRestoring(item.post.id);
    try {
      await postService.restore(item.post.id);
      if (useAuthStore.getState().user?.id !== userId) return;
      setRestoreTarget(null);
      setExpanded(null);
      if (items.length === 1 && page > 0) setPage((value) => value - 1);
      else setRetry((value) => value + 1);
      toast('Đã khôi phục bài viết về cộng đồng.', 'success');
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Không thể khôi phục bài viết.', 'error');
    } finally { setRestoring(null); }
  };

  return <section className="space-y-6">
    <header className="space-y-2">
      <h2 className="text-xl font-semibold">Thùng rác</h2>
      <p className="text-sm text-[var(--text-secondary)]">Xem lại các bài viết của bạn đã xóa. Bài trong thùng rác không xuất hiện trên bảng tin.</p>
      <Link className="text-sm text-[var(--color-orange-ink)] hover:underline" to={`/u/${user?.username || ''}`}>Xem bài viết trên trang cá nhân</Link>
    </header>
    {loading ? <p role="status">Đang tải thùng rác…</p> : error ? <div role="alert" className="space-y-3"><p>{error}</p><Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div> : <>
      {!items.length && <div className="py-10 space-y-3 text-center text-[var(--text-secondary)]"><Trash2 className="mx-auto" size={28} /><p>Không có bài viết nào trong thùng rác.</p></div>}
      <div className="trash-post-list">
      {items.map((item) => <article key={item.post.id} className="trash-post" aria-labelledby={`trash-title-${item.post.id}`}>
        <div className="trash-post-header">
          <div className="trash-post-summary">
            <div className="trash-post-meta"><span>c/{item.post.communityName}</span><span className="trash-post-status">Đã xóa</span></div>
            <h3 id={`trash-title-${item.post.id}`} className="trash-post-title">{item.post.title}</h3>
            {item.deletedAt && <p className="trash-post-date">Thời gian xóa: <time dateTime={item.deletedAt}>{new Date(item.deletedAt).toLocaleString('vi-VN')}</time></p>}
          </div>
          <Button size="sm" variant="secondary" disabled={!item.canRestore || !!restoring}
            title={!item.canRestore ? 'Bài viết bị kiểm duyệt xóa không thể tự khôi phục.' : 'Đưa bài viết trở lại cộng đồng'}
            isLoading={restoring === item.post.id} onClick={() => setRestoreTarget(item)} leftIcon={<RotateCcw size={16} />}>Khôi phục</Button>
        </div>
        <div className="trash-post-actions">
          <button type="button" aria-controls={`trash-preview-${item.post.id}`} aria-expanded={expanded === item.post.id}
            onClick={() => setExpanded(expanded === item.post.id ? null : item.post.id)}>
            {expanded === item.post.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded === item.post.id ? 'Ẩn nội dung' : 'Xem nội dung bài viết'}
          </button>
          {!item.canRestore && <p>Bài viết bị kiểm duyệt xóa không thể tự khôi phục.</p>}
        </div>
        {expanded === item.post.id && <div id={`trash-preview-${item.post.id}`} className="trash-post-preview">
          <p className="trash-preview-label">Nội dung bài viết đã xóa</p>
          <PostBody post={item.post} />
        </div>}
      </article>)}
      </div>
      {(page > 0 || !last) && <nav aria-label="Phân trang thùng rác" className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0 || !!restoring} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-sm">Trang {page + 1}</span><Button variant="secondary" disabled={last || !!restoring} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></nav>}
    </>}
    <ConfirmDialog isOpen={!!restoreTarget} onClose={() => { if (!restoring) setRestoreTarget(null); }}
      onConfirm={() => { if (restoreTarget) void restore(restoreTarget); }} title="Khôi phục bài viết"
      message={`Khôi phục “${restoreTarget?.post.title || ''}” về cộng đồng? Bài viết sẽ xuất hiện trở lại với những người có quyền xem.`}
      confirmLabel="Khôi phục bài viết" variant="primary" isLoading={!!restoring} />
  </section>;
}
