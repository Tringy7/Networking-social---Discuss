import React from 'react';
import { SYSTEM_ROLES, COMMUNITY_ROLES } from '../../constants/roles';
import { ShieldCheck, ShieldAlert, Award, UserCheck, Star, Shield } from 'lucide-react';

export default function RoleBadge({ role, type = 'community', size = 'sm' }) {
  if (!role) return null;

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : size === 'md' 
    ? 'text-xs px-2.5 py-1' 
    : 'text-[11px] px-2 py-0.5';

  if (type === 'system') {
    switch (role) {
      case SYSTEM_ROLES.ADMIN:
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Admin Hệ Thống
          </span>
        );
      case SYSTEM_ROLES.USER:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <UserCheck className="w-3 h-3 text-emerald-600" />
            Thành Viên
          </span>
        );
      case SYSTEM_ROLES.GUEST:
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            Khách (Guest)
          </span>
        );
    }
  }

  // Community roles
  switch (role) {
    case COMMUNITY_ROLES.OWNER:
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-xs ${sizeClasses}`}>
          <Award className="w-3 h-3 text-amber-600" />
          Chủ sở hữu (Owner)
        </span>
      );
    case COMMUNITY_ROLES.MODERATOR:
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 ${sizeClasses}`}>
          <ShieldCheck className="w-3 h-3 text-indigo-600" />
          Điều hành viên (Mod)
        </span>
      );
    case COMMUNITY_ROLES.MEMBER:
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <UserCheck className="w-3 h-3 text-slate-500" />
          Thành viên (Member)
        </span>
      );
    default:
      return null;
  }
}
