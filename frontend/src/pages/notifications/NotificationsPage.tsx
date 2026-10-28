import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationItem } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NOTIFICATIONS_AVAILABLE } from '../../services';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Bell, CheckCheck, MessageSquare, UserPlus, Shield, Sparkles } from 'lucide-react';

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

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'REPLY':
        return <MessageSquare className="h-3.5 w-3.5 text-orange-600" />;
      case 'INVITE':
        return <UserPlus className="h-3.5 w-3.5 text-sky-600" />;
      case 'MOD_ACTION':
        return <Shield className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-[var(--text-primary)]">
            <Bell className="h-6 w-6 text-[var(--color-orange)]" />
            <span>Thông báo của bạn</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Cập nhật các phản hồi, lời mời kiểm duyệt và hoạt động liên quan
          </p>
        </div>

        {!NOTIFICATIONS_AVAILABLE && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700">
            Đây là thông báo minh họa; trạng thái đã đọc chỉ được lưu trong phiên hiện tại.
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={markAllAsRead}
          disabled={notifications.length === 0}
          leftIcon={<CheckCheck className="h-4 w-4 text-emerald-600" />}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 text-sm font-semibold">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'all'
              ? 'border border-[var(--color-orange-border)] bg-[var(--color-orange-soft)] font-bold text-[var(--color-orange)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setTab('unread')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'unread'
              ? 'border border-[var(--color-orange-border)] bg-[var(--color-orange-soft)] font-bold text-[var(--color-orange)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          Chưa đọc ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <Link
            key={item.id}
            to={item.targetUrl}
            onClick={() => markAsRead(item.id)}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
              !item.isRead
                ? 'border-[var(--color-orange-border)] bg-orange-50/70 shadow-sm'
                : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <div className="relative shrink-0">
              <Avatar src={item.actor?.avatarUrl} alt={item.actor?.displayName || 'Discuss'} size="md" />
              <div className="absolute -bottom-1 -right-1 rounded-full border border-[var(--border-color)] bg-white p-1 shadow-sm">
                {getIcon(item.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="leading-relaxed">
                <span className="font-bold text-[var(--text-primary)]">{item.actor?.displayName || 'DISCUSS'} </span>
                <span className="text-[var(--text-secondary)]">{item.message}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">hôm nay</div>
            </div>

            {!item.isRead && (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-orange)] ring-2 ring-orange-100" />
            )}
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="space-y-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-8 py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-orange-soft)]">
              <Bell className="h-7 w-7 text-[var(--color-orange)]" />
            </span>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              Bạn đã cập nhật!
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Bạn đã xem hết tất cả thông báo trong mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
