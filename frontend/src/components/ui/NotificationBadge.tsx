import React from 'react';

/** The parent control announces the full count; the visible badge stays compact. */
export default function NotificationBadge({ count }: { count: number }) {
  if (!Number.isFinite(count) || count <= 0) return null;
  return <span className="notification-count" aria-hidden="true">{count > 99 ? '99+' : Math.floor(count)}</span>;
}
