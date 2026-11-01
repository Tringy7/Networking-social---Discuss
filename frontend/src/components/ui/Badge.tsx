import React from 'react';
import { Shield, Crown, UserCheck } from 'lucide-react';

interface BadgeProps {
  role?: 'OWNER' | 'MODERATOR' | 'ADMIN' | 'MEMBER' | 'USER' | 'GUEST';
  variant?: 'orange' | 'blue' | 'green' | 'red' | 'neutral';
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  role,
  variant,
  children,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  if (role) {
    if (role === 'ADMIN') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/25 ${sizeClasses} ${className}`}
        >
          <Shield className="w-3 h-3" />
          <span>ADMIN</span>
        </span>
      );
    }
    if (role === 'OWNER') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-[var(--radius-sm)] bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] ${sizeClasses} ${className}`}
        >
          <Crown className="w-3 h-3" />
          <span>Trưởng nhóm</span>
        </span>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-[var(--radius-sm)] bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/25 ${sizeClasses} ${className}`}
        >
          <Shield className="w-3 h-3" />
          <span>Kiểm duyệt viên</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)] ${sizeClasses} ${className}`}
      >
        <UserCheck className="w-3 h-3" />
        <span>Thành viên</span>
      </span>
    );
  }

  const variants = {
    orange: 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)]',
    blue: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/25',
    green: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/25',
    red: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/25',
    neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[var(--radius-sm)] ${variants[variant || 'neutral']} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
