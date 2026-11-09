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
    <div className="bg-[#1a1a1b] rounded-2xl border border-[#343536] shadow-sm overflow-hidden mb-6">
      {/* Banner */}
      <div className="h-44 sm:h-56 relative bg-gradient-to-r from-[#2a2420] via-[#362720] to-[#1e1c1b] overflow-hidden">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-[#1a1a1b]/90 text-orange-400 border border-[#343536] backdrop-blur-md shadow-sm">
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
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-[#1a1a1b] shadow-xl object-cover bg-[#272729] shrink-0"
            />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-[#d7dadc] tracking-tight">
                  community/{community.slug}
                </h1>
                {role && <RoleBadge role={role} size="md" />}
              </div>
              <p className="text-sm font-semibold text-[#818384]">
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
                className="px-4 py-2 bg-[#ff4500] hover:bg-[#ff5722] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Đăng bài</span>
              </button>
            )}

            {/* Join / Leave button */}
            {currentUser && (
              isJoined ? (
                <button
                  onClick={handleLeaveClick}
                  className="px-4 py-2 bg-[#272729] hover:bg-[#343536] text-[#818384] hover:text-rose-400 hover:border-rose-900/50 border border-[#343536] text-xs sm:text-sm font-semibold rounded-full transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Rời cộng đồng</span>
                </button>
              ) : (
                <button
                  onClick={() => joinCommunity(community.id)}
                  className="px-5 py-2 bg-[#ff4500] hover:bg-[#ff5722] text-white text-xs sm:text-sm font-bold rounded-full shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
                className="px-3 py-2 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs sm:text-sm font-medium rounded-full transition cursor-pointer flex items-center gap-1.5 border border-[#343536]"
              >
                <Users className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Thành viên & Kiểm duyệt</span>
              </button>
            )}

            {isOwner && (
              <>
                <button
                  onClick={onOpenModerators}
                  title="Gán / Xóa Điều hành viên (Moderator)"
                  className="px-3 py-2 bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-xs sm:text-sm font-medium rounded-full transition cursor-pointer flex items-center gap-1.5 border border-[#343536]"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="hidden lg:inline">Quản lý Mod</span>
                </button>

                <button
                  onClick={onOpenTransferOwner}
                  title="Chuyển quyền Chủ sở hữu (Owner)"
                  className="px-3 py-2 bg-[#272729] hover:bg-[#343536] text-amber-400 text-xs sm:text-sm font-medium rounded-full transition cursor-pointer flex items-center gap-1.5 border border-[#343536]"
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Chuyển Owner</span>
                </button>

                <button
                  onClick={onOpenEdit}
                  title="Chỉnh sửa thông tin cộng đồng"
                  className="p-2 bg-[#272729] hover:bg-[#343536] text-[#818384] hover:text-[#d7dadc] rounded-full transition cursor-pointer border border-[#343536]"
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
            <p className="text-sm text-[#d7dadc] leading-relaxed whitespace-pre-line mb-4">
              {community.description}
            </p>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#818384] font-medium">
              <span className="flex items-center gap-1.5 bg-[#272729] border border-[#343536] px-3 py-1.5 rounded-lg">
                <Users className="w-4 h-4 text-orange-400" />
                <strong className="text-[#d7dadc]">{formatNumber(community.memberCount)}</strong> thành viên
              </span>
              <span className="flex items-center gap-1.5 bg-[#272729] border border-[#343536] px-3 py-1.5 rounded-lg">
                <FileText className="w-4 h-4 text-orange-400" />
                <strong className="text-[#d7dadc]">{formatNumber(community.postCount)}</strong> bài viết
              </span>
              <span className="flex items-center gap-1.5 bg-[#272729] border border-[#343536] px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Tạo ngày {formatDate(community.createdAt)}
              </span>
            </div>
          </div>

          {/* Rules box */}
          <div className="bg-[#222426] p-4 rounded-2xl border border-[#343536] text-xs">
            <h4 className="font-bold text-[#d7dadc] uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Quy tắc cộng đồng
            </h4>
            <ol className="space-y-1.5 text-[#818384] list-decimal list-inside leading-relaxed">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1a1a1b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#343536] text-[#d7dadc]">
            <div className="w-12 h-12 rounded-full bg-amber-950/60 text-amber-400 border border-amber-900/50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Chủ sở hữu không thể rời trực tiếp
            </h3>
            <p className="text-xs text-[#818384] leading-relaxed mb-4">
              Bạn hiện là Chủ sở hữu (Owner) của <strong>community/{community.slug}</strong>. Vui lòng chuyển giao quyền Owner cho thành viên khác trước khi rời khỏi cộng đồng.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowOwnerLeaveWarning(false)}
                className="px-4 py-2 text-xs font-semibold text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] rounded-xl cursor-pointer"
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
