import { useEffect, useRef, useState } from 'react';
import { Laptop, Smartphone, RefreshCw, LogOut } from 'lucide-react';
import { sessionService, type LoginSession } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import './loginSessions.css';

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
export default function LoginSessions() {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [target, setTarget] = useState<LoginSession | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const notify = useToastStore((state) => state.addToast);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    sessionService.list().then((items) => { if (active) setSessions(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải thiết bị đăng nhập.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const revoke = async () => {
    if (!target || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      if (target.current) await useAuthStore.getState().logout();
      else {
        await sessionService.revoke(target.id);
        setSessions((items) => items.filter((item) => item.id !== target.id));
      }
      setTarget(null);
      notify('Đã đăng xuất thiết bị.', 'success');
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Không thể đăng xuất thiết bị.', 'error'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <section className="login-sessions" aria-labelledby="login-sessions-title">
    <header className="login-sessions-heading"><div><h3 id="login-sessions-title">Thiết bị đang đăng nhập</h3>
      <p>Bạn có thể đăng nhập trên nhiều thiết bị và đăng xuất từng phiên tại đây.</p></div>
      <button type="button" className="icon-button" disabled={loading || busy} onClick={() => setAttempt((value) => value + 1)} aria-label="Tải lại danh sách thiết bị"><RefreshCw size={16} /></button>
    </header>
    {loading ? <p className="login-sessions-status" role="status">Đang tải thiết bị…</p>
      : error ? <div className="login-sessions-status" role="alert"><p>{error}</p><Button size="sm" variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Thử lại</Button></div>
      : !sessions.length ? <p className="login-sessions-status">Không có phiên đăng nhập đang hoạt động.</p>
      : <ul className="login-sessions-list">{[...sessions].sort((a, b) => Number(b.current) - Number(a.current)).map((item) => {
        const Icon = /Android|iPhone|iPad/.test(item.deviceName) ? Smartphone : Laptop;
        return <li key={item.id} className="login-session"><Icon size={21} aria-hidden="true" />
          <div className="login-session-details"><div className="login-session-name"><strong>{item.deviceName}</strong>{item.current && <span>Thiết bị này</span>}</div>
            <p>Đăng nhập: <time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></p>
            <p>Làm mới phiên gần nhất: <time dateTime={item.lastActiveAt}>{dateLabel(item.lastActiveAt)}</time></p>
          </div>
          <button type="button" className="login-session-revoke" disabled={busy} onClick={() => setTarget(item)} aria-label={`Đăng xuất ${item.deviceName}`}><LogOut size={15} /><span>Đăng xuất</span></button>
        </li>;
      })}</ul>}
    <p className="login-sessions-note">Tên thiết bị được nhận diện từ trình duyệt và hệ điều hành. Các trình duyệt được quản lý bằng các phiên riêng.</p>
    <ConfirmDialog isOpen={target !== null} onClose={() => { if (!pending.current) setTarget(null); }}
      onConfirm={() => void revoke()} title="Đăng xuất thiết bị?"
      message={`Phiên ${target?.deviceName ?? ''} sẽ mất quyền truy cập. ${target?.current ? 'Bạn sẽ cần đăng nhập lại.' : 'Các thiết bị khác vẫn đăng nhập bình thường.'}`}
      confirmLabel="Đăng xuất" isLoading={busy} />
  </section>;
}
