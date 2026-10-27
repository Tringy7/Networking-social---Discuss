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
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (role) {
    if (role === 'ADMIN') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 ${sizeClasses} ${className}`}
        >
          <Shield className="w-3 h-3" />
          <span>ADMIN</span>
        </span>
      );
    }
    if (role === 'OWNER') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 ${sizeClasses} ${className}`}
        >
          <Crown className="w-3 h-3" />
          <span>Trưởng nhóm</span>
        </span>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 ${sizeClasses} ${className}`}
        >
          <Shield className="w-3 h-3" />
          <span>Kiểm duyệt viên</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-md bg-[#222426] text-[#9A9DA3] border border-[#303235] ${sizeClasses} ${className}`}
      >
        <UserCheck className="w-3 h-3" />
        <span>Thành viên</span>
      </span>
    );
  }

  const variants = {
    orange: 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30',
    blue: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
    green: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
    red: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
    neutral: 'bg-[#222426] text-[#9A9DA3] border border-[#303235]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${variants[variant || 'neutral']} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
