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
          <Search className="w-4 h-4 text-[#818384] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thành viên trong cộng đồng..."
            className="w-full pl-10 pr-4 py-2 bg-[#272729] border border-[#343536] text-[#d7dadc] placeholder-[#818384] rounded-xl text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Ban confirmation sub-dialog if active */}
        {targetBanUser && (
          <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl animate-in fade-in space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Cấm (Ban) thành viên: {targetBanUser.name} (@{targetBanUser.username})</span>
            </div>
            <p className="text-xs text-rose-300">
              Thành viên bị cấm sẽ không thể đăng bài, bình luận hoặc tương tác trong cộng đồng này.
            </p>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do cấm (ví dụ: Spam quảng cáo liên tục)..."
              className="w-full px-3 py-2 bg-[#272729] border border-rose-900/60 text-[#d7dadc] rounded-xl text-xs focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTargetBanUser(null)}
                className="px-3 py-1.5 text-xs text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] rounded-lg cursor-pointer transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer transition"
              >
                Xác nhận Ban
              </button>
            </div>
          </div>
        )}

        {/* Member List Table */}
        <div className="divide-y divide-[#272729] max-h-96 overflow-y-auto pr-1">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#818384]">
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
                      className="w-9 h-9 rounded-full object-cover border border-[#343536] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#d7dadc]">
                          {item.user.name}
                        </span>
                        <span className="text-[11px] text-[#818384]">
                          @{item.user.username}
                        </span>
                        {item.userId === currentUser?.id && (
                          <span className="text-[10px] bg-[#272729] text-orange-400 border border-[#343536] px-1.5 py-0.2 rounded font-medium">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RoleBadge role={item.role} size="xs" />
                        {item.isBanned && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-900/50">
                            Đã bị cấm (Banned)
                          </span>
                        )}
                        <span className="text-[10px] text-[#818384]">
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
                          className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-900/50 rounded-lg flex items-center gap-1 cursor-pointer transition"
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
                            className="px-2.5 py-1 text-xs font-medium text-[#818384] hover:text-amber-400 bg-[#272729] hover:bg-[#343536] border border-[#343536] rounded-lg flex items-center gap-1 cursor-pointer transition"
                            title="Mời rời cộng đồng"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kick</span>
                          </button>
                        )}
                        {canBan && (
                          <button
                            onClick={() => setTargetBanUser(item.user)}
                            className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/50 rounded-lg flex items-center gap-1 cursor-pointer transition border border-rose-900/50"
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
