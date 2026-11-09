import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { COMMUNITY_ROLES } from '../../constants/roles';
import RoleBadge from '../common/RoleBadge';
import { ShieldCheck, ShieldAlert, UserPlus, UserMinus, Shield } from 'lucide-react';

export default function CommunityModerationModal({ isOpen, onClose, community }) {
  const { getCommunityMembers, assignModerator, removeModerator } = useCommunity();
  const { allUsers, currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');

  if (!community) return null;

  const members = getCommunityMembers(community.id);

  // Group members into current moderators and eligible members
  const currentMods = members.filter(m => m.role === COMMUNITY_ROLES.MODERATOR && !m.isBanned);
  const eligibleMembers = members.filter(m => m.role === COMMUNITY_ROLES.MEMBER && !m.isBanned);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    await assignModerator(community.id, selectedUserId);
    setSelectedUserId('');
  };

  const handleRemove = async (userId) => {
    await removeModerator(community.id, userId);
  };

  const getUser = (userId) => allUsers.find(u => u.id === userId) || { name: 'Người dùng', username: userId, avatar: '' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quản lý Điều hành viên - community/${community.slug}`} maxWidth="max-w-xl">
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold text-[#d7dadc] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-orange-500" />
            Bổ nhiệm Điều hành viên mới
          </h4>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#272729] border border-[#343536] text-[#d7dadc] rounded-xl text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="" className="bg-[#1a1a1b] text-[#818384]">-- Chọn thành viên để bổ nhiệm làm Mod --</option>
              {eligibleMembers.map((m) => {
                const u = getUser(m.userId);
                return (
                  <option key={m.userId} value={m.userId} className="bg-[#1a1a1b] text-[#d7dadc]">
                    {u.name} (@{u.username})
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              disabled={!selectedUserId}
              onClick={handleAssign}
              className="px-4 py-2 bg-[#ff4500] hover:bg-[#ff5722] disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
            >
              Bổ nhiệm
            </button>
          </div>
        </div>

        {/* Current Moderators List */}
        <div>
          <h4 className="text-xs font-bold text-[#d7dadc] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Danh sách Điều hành viên hiện tại ({currentMods.length})
          </h4>

          {currentMods.length === 0 ? (
            <p className="text-xs text-[#818384] py-3 italic">
              Chưa có Điều hành viên nào được bổ nhiệm.
            </p>
          ) : (
            <div className="divide-y divide-[#272729] border border-[#343536] rounded-2xl overflow-hidden">
              {currentMods.map((m) => {
                const u = getUser(m.userId);
                return (
                  <div key={m.userId} className="p-3 bg-[#1a1a1b] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#343536]"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#d7dadc]">{u.name}</div>
                        <div className="text-[11px] text-[#818384]">@{u.username}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 border border-rose-900/50"
                      title="Thu hồi quyền Moderator"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Thu hồi quyền Mod</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
