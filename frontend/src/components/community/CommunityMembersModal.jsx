import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { COMMUNITY_ROLES } from '../../constants/roles';
import { permissions } from '../../utils/permissions';
import { formatDate } from '../../utils/formatters';
import { Search, UserX, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function CommunityMembersModal({ isOpen, onClose, community }) {
  const { getCommunityMembers, kickMember, banMember, unbanMember, getUserCommunityRole } = useCommunity();
  const { allUsers, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [banReason, setBanReason] = useState('');
  const [targetBanUser, setTargetBanUser] = useState(null);

  if (!community) return null;

  const members = getCommunityMembers(community.id);
  const myRole = getUserCommunityRole(community.id);

  // Join membership with user info
  const membersWithInfo = members.map(m => {
    const user = allUsers.find(u => u.id === m.userId) || {
      id: m.userId,
      name: 'Người dùng Discuss',
      username: m.userId,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    };
    return { ...m, user };
  });

  const filteredMembers = membersWithInfo.filter(m =>
    m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmBan = async () => {
    if (!targetBanUser) return;
    await banMember(community.id, targetBanUser.id, banReason || 'Vi phạm nội quy cộng đồng');
    setTargetBanUser(null);
    setBanReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thành viên c/${community.slug}`} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thành viên trong cộng đồng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Ban confirmation sub-dialog if active */}
        {targetBanUser && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Cấm (Ban) thành viên: {targetBanUser.name} (@{targetBanUser.username})</span>
            </div>
            <p className="text-xs text-rose-700">
              Thành viên bị cấm sẽ không thể đăng bài, bình luận hoặc tương tác trong cộng đồng này.
            </p>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do cấm (ví dụ: Spam quảng cáo liên tục)..."
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTargetBanUser(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Xác nhận Ban
              </button>
            </div>
          </div>
        )}

        {/* Member List Table */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Không tìm thấy thành viên nào.
            </div>
          ) : (
            filteredMembers.map((item) => {
              const canKick = permissions.canKickMember(currentUser, myRole, item.role) && item.userId !== currentUser?.id;
              const canBan = permissions.canBanMember(currentUser, myRole, item.role) && item.userId !== currentUser?.id;

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {item.user.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          @{item.user.username}
                        </span>
                        {item.userId === currentUser?.id && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RoleBadge role={item.role} size="xs" />
                        {item.isBanned && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Đã bị cấm (Banned)
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Gia nhập: {formatDate(item.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Kick / Ban / Unban */}
                  <div className="flex items-center gap-1.5">
                    {item.isBanned ? (
                      canBan && (
                        <button
                          onClick={() => unbanMember(community.id, item.userId)}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer"
                          title="Gỡ cấm cho thành viên này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Gỡ cấm</span>
                        </button>
                      )
                    ) : (
                      <>
                        {canKick && (
                          <button
                            onClick={() => kickMember(community.id, item.userId)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-lg flex items-center gap-1 cursor-pointer transition"
                            title="Mời rời cộng đồng"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kick</span>
                          </button>
                        )}
                        {canBan && (
                          <button
                            onClick={() => setTargetBanUser(item.user)}
                            className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer transition border border-rose-200/60"
                            title="Cấm thành viên khỏi cộng đồng"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Ban</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
