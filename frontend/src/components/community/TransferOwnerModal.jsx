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
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý quan trọng:</strong> Hành động này sẽ chuyển toàn bộ quyền Chủ sở hữu (Owner) của cộng đồng cho thành viên được chọn. Sau khi chuyển, bạn sẽ trở thành <strong>Thành viên (Member)</strong> bình thường và có thể rời khỏi cộng đồng nếu muốn.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Chọn thành viên kế nhiệm làm Owner <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">-- Chọn thành viên nhận quyền --</option>
            {candidates.map((m) => {
              const u = getUser(m.userId);
              return (
                <option key={m.userId} value={m.userId}>
                  {u.name} (@{u.username}) - {m.role === COMMUNITY_ROLES.MODERATOR ? 'Hiện là Moderator' : 'Thành viên'}
                </option>
              );
            })}
          </select>
        </div>

        {selectedUserId && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <img
              src={getUser(selectedUserId).avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-slate-300"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">
                {getUser(selectedUserId).name}
              </div>
              <div className="text-[11px] text-slate-500">
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
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-700">
            Tôi xác nhận muốn chuyển giao quyền Chủ sở hữu của cộng đồng <strong>c/{community.slug}</strong> cho thành viên này.
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
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
