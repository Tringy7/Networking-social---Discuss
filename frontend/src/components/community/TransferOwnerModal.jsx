import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { COMMUNITY_ROLES } from '../../constants/roles';
import { Award, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function TransferOwnerModal({ isOpen, onClose, community }) {
  const { getCommunityMembers, transferOwnership } = useCommunity();
  const { allUsers, currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!community) return null;

  const members = getCommunityMembers(community.id);
  // Eligible members to receive ownership: anyone in community who is not the current user and not banned
  const candidates = members.filter(m => m.userId !== currentUser?.id && !m.isBanned);

  const getUser = (userId) => allUsers.find(u => u.id === userId) || { name: 'Người dùng', username: userId, avatar: '' };

  const handleTransfer = async () => {
    if (!selectedUserId || !confirmed) return;
    setLoading(true);
    try {
      await transferOwnership(community.id, selectedUserId);
      onClose();
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chuyển quyền Chủ sở hữu (Owner) - c/${community.slug}`} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-950/40 border border-amber-900/50 rounded-xl text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý quan trọng:</strong> Hành động này sẽ chuyển toàn bộ quyền Chủ sở hữu (Owner) của cộng đồng cho thành viên được chọn. Sau khi chuyển, bạn sẽ trở thành <strong>Thành viên (Member)</strong> bình thường và có thể rời khỏi cộng đồng nếu muốn.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#818384] uppercase tracking-wider mb-1.5">
            Chọn thành viên kế nhiệm làm Owner <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#272729] border border-[#343536] text-[#d7dadc] rounded-xl text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="" className="bg-[#1a1a1b] text-[#818384]">-- Chọn thành viên nhận quyền --</option>
            {candidates.map((m) => {
              const u = getUser(m.userId);
              return (
                <option key={m.userId} value={m.userId} className="bg-[#1a1a1b] text-[#d7dadc]">
                  {u.name} (@{u.username}) - {m.role === COMMUNITY_ROLES.MODERATOR ? 'Hiện là Moderator' : 'Thành viên'}
                </option>
              );
            })}
          </select>
        </div>

        {selectedUserId && (
          <div className="p-3 bg-[#272729] rounded-xl border border-[#343536] flex items-center gap-3">
            <img
              src={getUser(selectedUserId).avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-[#343536]"
            />
            <div>
              <div className="text-xs font-bold text-[#d7dadc]">
                {getUser(selectedUserId).name}
              </div>
              <div className="text-[11px] text-[#818384]">
                @{getUser(selectedUserId).username} • Sẽ trở thành Chủ sở hữu mới
              </div>
            </div>
          </div>
        )}

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-2 pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#343536] bg-[#272729] text-orange-500 focus:ring-orange-500"
          />
          <span className="text-xs text-[#d7dadc]">
            Tôi xác nhận muốn chuyển giao quyền Chủ sở hữu của cộng đồng <strong>c/{community.slug}</strong> cho thành viên này.
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#343536]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] rounded-xl font-medium cursor-pointer transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedUserId || !confirmed || loading}
            onClick={handleTransfer}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            <span>Xác nhận chuyển giao</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
