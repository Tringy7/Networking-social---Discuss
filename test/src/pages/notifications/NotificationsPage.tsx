import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../../mocks/mockData';
import { NotificationItem } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Bell, CheckCheck, MessageSquare, UserPlus, Shield, Sparkles } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => (tab === 'unread' ? !n.isRead : true));

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'info');
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'REPLY':
        return <MessageSquare className="w-3.5 h-3.5 text-[#FF5700]" />;
      case 'INVITE':
        return <UserPlus className="w-3.5 h-3.5 text-[#3B82F6]" />;
      case 'MOD_ACTION':
        return <Shield className="w-3.5 h-3.5 text-[#22C55E]" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#FF5700]" />
            <span>Thông báo của bạn</span>
          </h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Cập nhật các phản hồi, lời mời kiểm duyệt và hoạt động liên quan
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={markAllAsRead}
          leftIcon={<CheckCheck className="w-4 h-4 text-[#22C55E]" />}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#303235] pb-2 text-xs font-semibold">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'all'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setTab('unread')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            tab === 'unread'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
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
                ? 'bg-[#191A1C] border-[#FF5700]/40 shadow-sm'
                : 'bg-[#141517] border-[#303235] hover:border-[#45474B]'
            }`}
          >
            <div className="relative shrink-0">
              <Avatar src={item.actor.avatarUrl} alt={item.actor.displayName} size="md" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#191A1C] border border-[#303235]">
                {getIcon(item.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="leading-relaxed">
                <span className="font-bold text-[#F5F5F5]">{item.actor.displayName} </span>
                <span className="text-[#D1D5DB]">{item.message}</span>
              </div>
              <div className="text-[11px] text-[#70747C] mt-1">hôm nay</div>
            </div>

            {!item.isRead && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5700] shrink-0 mt-1" />
            )}
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-3">
            <Bell className="w-8 h-8 text-[#FF5700] mx-auto opacity-60" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Không có thông báo nào</h4>
            <p className="text-xs text-[#9A9DA3]">
              Bạn đã xem hết tất cả thông báo trong mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
