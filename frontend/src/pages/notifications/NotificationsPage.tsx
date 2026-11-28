import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import EditorialTabs from '../../components/ui/EditorialTabs';
import { NotificationIcon, NotificationMessage } from '../../components/layout/NotificationIdentity';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CheckCheck, Trash2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { notifications, unreadCount, hasMore, loadMore, hydrate, markRead, markAllRead, deleteReadNotifications } = useNotificationStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);
  const clearPending = useRef(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    hydrate().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
    });
  }, [addToast, hydrate]);

  const filtered = notifications.filter((n) => (tab === 'unread' ? !n.isRead : true));

  const clearRead = async () => {
    if (clearPending.current) return;
    clearPending.current = true;
    setClearingRead(true);
    try {
      await deleteReadNotifications();
      setConfirmClear(false);
      addToast('Đã xóa thông báo đã đọc.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể xóa thông báo.', 'error');
    } finally {
      clearPending.current = false;
      setClearingRead(false);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await markAllRead();
      addToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markRead(id);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
    }
  };

  const showMore = async () => {
    setLoadingMore(true);
    try {
      await loadMore();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể tải thêm thông báo.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="notifications-page utility-page">
      <header className="utility-heading flex flex-wrap items-end justify-between gap-4">
        <h1>Thông báo của bạn</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={!unreadCount}
            isLoading={markingAllRead} leftIcon={<CheckCheck size={16} />}>Đọc tất cả</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}
            disabled={markingAllRead || (!hasMore && !notifications.some(item => item.isRead))}
            leftIcon={<Trash2 size={16} />}>Xóa đã đọc</Button>
        </div>
      </header>
      <EditorialTabs label="Lọc thông báo" value={tab} onChange={setTab} options={[{id:'all',label:'Tất cả'},{id:'unread',label:`Chưa đọc (${unreadCount})`}]} />
      {!!filtered.length && <div className="notification-list">{filtered.map((item) => <Link key={item.id}
        to={item.targetUrl} data-notification-type={item.type}
        onClick={() => { if (!item.isRead) void markAsRead(item.id); }} className={`notification-panel-item ${item.isRead ? '' : 'is-unread'}`}>
        <NotificationIcon item={item} />
        <div className="notification-panel-copy">
          <NotificationMessage item={item} />
          <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('vi-VN', {day:'numeric',month:'short'})}</time>
        </div>
        {!item.isRead && <><span className="notification-panel-dot" aria-hidden="true" /><span className="sr-only">Chưa đọc</span></>}
      </Link>)}</div>}
      {hasMore && <Button variant="secondary" size="sm" isLoading={loadingMore} onClick={() => void showMore()}>Xem thêm</Button>}
      {!filtered.length && !hasMore && <section className="editorial-empty">
        <h2>{tab === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'}</h2>
      </section>}
      {confirmClear && <Modal isOpen title="Xóa thông báo đã đọc?"
        description="Thao tác này sẽ xóa tất cả thông báo đã đọc, kể cả ở các trang chưa mở."
        closeDisabled={clearingRead} onClose={() => { if (!clearPending.current) setConfirmClear(false); }}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={clearingRead} onClick={() => setConfirmClear(false)}>Hủy</Button>
          <Button variant="danger" isLoading={clearingRead} onClick={() => void clearRead()}>Xóa đã đọc</Button>
        </div>
      </Modal>}
    </div>
  );
};
export default NotificationsPage;
