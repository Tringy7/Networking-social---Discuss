import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck, X } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useToastStore } from '../../store/useToastStore';
import { NotificationIcon, NotificationMessage } from './NotificationIdentity';

function notificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function NotificationPanel({ onClose, onDismiss }: {
  onClose: () => void;
  onDismiss: () => void;
}) {
  const { notifications, unreadCount: unread, markRead, markAllRead } = useNotificationStore();
  const notify = useToastStore((state) => state.addToast);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const visible = notifications.filter((item) => filter === 'all' || !item.isRead);
  const readAll = async () => {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    try { await markAllRead(); }
    catch (error) { notify(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error'); }
    finally { pending.current = false; setSaving(false); }
  };

  return <section id="navbar-notifications" className="notification-panel" aria-labelledby="notification-panel-title">
    <header className="notification-panel-heading">
      <div><h2 id="notification-panel-title">Thông báo</h2><p aria-live="polite">{unread ? `Bạn có ${unread} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}</p></div>
      <button type="button" className="notification-panel-close" aria-label="Đóng bảng thông báo" onClick={onDismiss}><X size={18} /></button>
    </header>
    <div className="notification-panel-toolbar">
      <div className="notification-panel-filters" role="group" aria-label="Lọc thông báo">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Tất cả</button>
        <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Chưa đọc{unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}</button>
      </div>
      <button type="button" className="notification-panel-read-all" disabled={!unread || saving} onClick={() => void readAll()}>
        <CheckCheck size={16} /><span>{saving ? 'Đang cập nhật…' : 'Đọc tất cả'}</span>
      </button>
    </div>
    <div className="notification-panel-list">
      {visible.length ? <ul onKeyDown={event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const links = Array.from(event.currentTarget.querySelectorAll('a'));
        const index = links.findIndex(link => link === document.activeElement);
        if (index === -1) return;
        event.preventDefault();
        links[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
      }}>{visible.slice(0, 8).map((item) => <li key={item.id}>
        <Link to={item.targetUrl} data-notification-type={item.type} className={`notification-panel-item ${item.isRead ? '' : 'is-unread'}`}
          onClick={() => {
            onClose();
            if (!item.isRead) void markRead(item.id).catch((error: unknown) => {
              notify(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
            });
          }}>
          <NotificationIcon item={item} />
          <div className="notification-panel-copy">
            <NotificationMessage item={item} />
            <time dateTime={item.createdAt}>{notificationTime(item.createdAt)}</time>
          </div>
          {!item.isRead && <><span className="notification-panel-dot" aria-hidden="true" /><span className="sr-only">Chưa đọc</span></>}
        </Link>
      </li>)}</ul> : <div className="notification-panel-empty" role="status">
        <Bell size={28} strokeWidth={1.5} aria-hidden="true" />
        <h3>{filter === 'unread'
          ? unread ? 'Thông báo chưa đọc nằm ở các trang sau' : 'Bạn đã đọc hết thông báo'
          : 'Chưa có thông báo'}</h3>
      </div>}
    </div>
    <Link to="/notifications" className="notification-panel-footer" onClick={onClose}>Xem tất cả thông báo<ArrowRight size={16} /></Link>
  </section>;
}
