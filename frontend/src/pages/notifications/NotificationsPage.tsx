import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NOTIFICATIONS_AVAILABLE } from '../../services';
import EditorialTabs from '../../components/ui/EditorialTabs';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { notifications, hydrate, markRead, markAllRead } = useNotificationStore();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    hydrate().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
    });
  }, [addToast, hydrate]);

  const filtered = notifications.filter((n) => (tab === 'unread' ? !n.isRead : true));

  const markAllAsRead = async () => {
    try {
      await markAllRead();
      addToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markRead(id);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
    }
  };

  return (
    <div className="notifications-page utility-page">
      <header className="utility-heading flex flex-wrap items-end justify-between gap-4"><div><h1>Cuộc trò chuyện tiếp nối.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Phản hồi, lời mời và hoạt động dành cho bạn.</p></div><Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={notifications.length === 0} leftIcon={<CheckCheck size={16} />}>Đánh dấu đã đọc</Button></header>
      <EditorialTabs label="Lọc thông báo" value={tab} onChange={setTab} options={[{id:'all',label:`Tất cả (${notifications.length})`},{id:'unread',label:`Chưa đọc (${notifications.filter((n) => !n.isRead).length})`}]} />
      {!NOTIFICATIONS_AVAILABLE && <p className="feed-notice">Thông báo mẫu · Trạng thái được lưu trong phiên hiện tại.</p>}
      <div className="notification-list">{filtered.map((item) => <Link key={item.id} to={item.targetUrl} onClick={() => void markAsRead(item.id)} className={`notification-row ${item.isRead ? '' : 'is-unread'}`}>
        <Avatar src={item.actor?.avatarUrl} alt={item.actor?.displayName || 'DISCUSS'} size="sm" />
        <div className="min-w-0 flex-1"><p><strong>{item.actor?.displayName || 'DISCUSS'}</strong> {item.message}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('vi-VN', {day:'numeric',month:'short'})}</time></div>
        {!item.isRead && <span className="unread-dot" aria-label="Chưa đọc" />}
      </Link>)}</div>
      {!filtered.length && <section className="editorial-empty"><h2>Bạn đã cập nhật.</h2><p>Những phản hồi mới sẽ xuất hiện ở đây.</p></section>}
    </div>
  );
};
export default NotificationsPage;
