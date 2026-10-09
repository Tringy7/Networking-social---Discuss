import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { COMMUNITY_ROLES } from '../../constants/roles';
import { permissions } from '../../utils/permissions';
import { formatNumber, formatDate } from '../../utils/formatters';
import { 
  Users, 
  Settings, 
  ShieldCheck, 
  Award, 
  UserMinus, 
  UserPlus, 
  LogOut, 
  FileText, 
  Calendar,
  AlertCircle,
  Shield,
  ArrowRightLeft
} from 'lucide-react';

export default function CommunityHeader({ 
  community, 
  onOpenEdit, 
  onOpenMembers, 
  onOpenModerators, 
  onOpenTransferOwner,
  onOpenCreatePost
}) {
  const { getUserCommunityRole, joinCommunity, leaveCommunity } = useCommunity();
  const { currentUser } = useAuth();
  const [showOwnerLeaveWarning, setShowOwnerLeaveWarning] = useState(false);

  const role = getUserCommunityRole(community.id);
  const isJoined = !!role;
  const isOwner = role === COMMUNITY_ROLES.OWNER || permissions.isAdmin(currentUser);
  const isModOrOwner = role === COMMUNITY_ROLES.MODERATOR || isOwner;

  const handleLeaveClick = async () => {
    if (role === COMMUNITY_ROLES.OWNER) {
      setShowOwnerLeaveWarning(true);
      return;
    }
    await leaveCommunity(community.id);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden mb-6">
      {/* Banner */}
      <div className="h-44 sm:h-56 relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
        
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-800 backdrop-blur-md shadow-sm">
          {community.category || 'Cộng đồng'}
        </span>
      </div>

      {/* Main Info Bar */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
          {/* Avatar & Title */}
          <div className="flex items-end gap-4">
            <img
              src={community.avatar}
              alt={community.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-xl object-cover bg-white shrink-0"
            />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  c/{community.slug}
                </h1>
                {role && <RoleBadge role={role} size="md" />}
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {community.name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            {/* Create Post in this community */}
            {isJoined && (
              <button
                onClick={onOpenCreatePost}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Đăng bài</span>
              </button>
            )}

            {/* Join / Leave button */}
            {currentUser && (
              isJoined ? (
                <button
                  onClick={handleLeaveClick}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Rời cộng đồng</span>
                </button>
              ) : (
                <button
                  onClick={() => joinCommunity(community.id)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tham gia</span>
                </button>
              )
            )}

            {/* Moderator & Owner Control Dropdowns / Buttons */}
            {isModOrOwner && (
              <button
                onClick={onOpenMembers}
                title="Quản lý thành viên (Kick, Ban, Unban)"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Thành viên & Kiểm duyệt</span>
              </button>
            )}

            {isOwner && (
              <>
                <button
                  onClick={onOpenModerators}
                  title="Gán / Xóa Điều hành viên (Moderator)"
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-200"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline">Quản lý Mod</span>
                </button>

                <button
                  onClick={onOpenTransferOwner}
                  title="Chuyển quyền Chủ sở hữu (Owner)"
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-amber-200"
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  <span className="hidden lg:inline">Chuyển Owner</span>
                </button>

                <button
                  onClick={onOpenEdit}
                  title="Chỉnh sửa thông tin cộng đồng"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer border border-slate-200"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description & Rules Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="lg:col-span-2">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
              {community.description}
            </p>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Users className="w-4 h-4 text-indigo-500" />
                <strong className="text-slate-800">{formatNumber(community.memberCount)}</strong> thành viên
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <FileText className="w-4 h-4 text-purple-500" />
                <strong className="text-slate-800">{formatNumber(community.postCount)}</strong> bài viết
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Tạo ngày {formatDate(community.createdAt)}
              </span>
            </div>
          </div>

          {/* Rules box */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Quy tắc cộng đồng
            </h4>
            <ol className="space-y-1.5 text-slate-600 list-decimal list-inside leading-relaxed">
              {community.rules && community.rules.map((rule, idx) => (
                <li key={idx} className="line-clamp-2">
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Owner Leave Warning Dialog */}
      {showOwnerLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Chủ sở hữu không thể rời trực tiếp
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn hiện là Chủ sở hữu (Owner) của <strong>c/{community.slug}</strong>. Vui lòng chuyển giao quyền Owner cho thành viên khác trước khi rời khỏi cộng đồng.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowOwnerLeaveWarning(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowOwnerLeaveWarning(false);
                  onOpenTransferOwner();
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer"
              >
                Chuyển quyền Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
