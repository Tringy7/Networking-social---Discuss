import { Bell, ClipboardCheck, FileText, Flag, MessageSquare, Reply, ShieldAlert, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import type { NotificationItem, NotificationType } from '../../types';
import Avatar from '../ui/Avatar';
import './notificationPanel.css';

const notificationIdentity = {
  COMMUNITY_POST_CREATED: { icon: FileText, label: 'Bài viết mới' },
  POST_COMMENTED: { icon: MessageSquare, label: 'Bình luận mới' },
  COMMENT_REPLIED: { icon: Reply, label: 'Phản hồi bình luận' },
  REPORT_SUBMITTED: { icon: Flag, label: 'Báo cáo mới' },
  REPORT_REVIEWED: { icon: ClipboardCheck, label: 'Kết quả báo cáo' },
  REPORT_WARNING: { icon: ShieldAlert, label: 'Cảnh cáo kiểm duyệt' },
  COMMUNITY_JOIN_CONFIRMED: { icon: UserCheck, label: 'Đã tham gia cộng đồng' },
  COMMUNITY_MEMBER_JOINED: { icon: Users, label: 'Thành viên mới' },
  COMMUNITY_JOIN_REQUEST_SENT: { icon: UserPlus, label: 'Đã gửi yêu cầu tham gia' },
  COMMUNITY_JOIN_REQUEST_RECEIVED: { icon: UserPlus, label: 'Yêu cầu tham gia mới' },
  COMMUNITY_JOIN_APPROVED: { icon: UserCheck, label: 'Yêu cầu được duyệt' },
  COMMUNITY_JOIN_REJECTED: { icon: UserX, label: 'Yêu cầu bị từ chối' },
} satisfies Record<NotificationType, { icon: typeof Bell; label: string }>;

export function NotificationIcon({ item }: { item: NotificationItem }) {
  const Icon = notificationIdentity[item.type]?.icon ?? Bell;
  return <span className="notification-identity" aria-hidden="true">
    {item.actor && <Avatar src={item.actor.avatarUrl} alt={item.actor.displayName} size="sm" />}
    <span className={item.actor ? 'notification-type-icon has-avatar' : 'notification-type-icon'}><Icon size={item.actor ? 12 : 19} /></span>
  </span>;
}

export function NotificationMessage({ item }: { item: NotificationItem }) {
  return <>
    <span className="notification-type-label">{notificationIdentity[item.type]?.label ?? 'Thông báo'}</span>
    <p>{item.actor && <strong>{item.actor.displayName} </strong>}{item.message}</p>
  </>;
}
