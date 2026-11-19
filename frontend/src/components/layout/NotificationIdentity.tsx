import { Bell, ClipboardCheck, Flag, ShieldAlert } from 'lucide-react';
import type { NotificationItem } from '../../types';
import Avatar from '../ui/Avatar';
import './notificationPanel.css';

const reportIdentity = {
  REPORT_SUBMITTED: { icon: Flag, label: 'Báo cáo mới' },
  REPORT_REVIEWED: { icon: ClipboardCheck, label: 'Kết quả báo cáo' },
  REPORT_WARNING: { icon: ShieldAlert, label: 'Cảnh cáo kiểm duyệt' },
};

export function NotificationIcon({ item }: { item: NotificationItem }) {
  if (item.actor) {
    return <Avatar src={item.actor.avatarUrl} alt={item.actor.displayName} size="sm" />;
  }

  const Icon = item.type in reportIdentity
    ? reportIdentity[item.type as keyof typeof reportIdentity].icon
    : Bell;
  return <span className="notification-panel-system" aria-hidden="true"><Icon size={17} /></span>;
}

export function NotificationMessage({ item }: { item: NotificationItem }) {
  const report = item.type in reportIdentity ? reportIdentity[item.type as keyof typeof reportIdentity] : null;
  return <>
    {report && <span className="notification-report-label">{report.label}</span>}
    <p>{item.actor && <strong>{item.actor.displayName} </strong>}{item.message}</p>
  </>;
}
