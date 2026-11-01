import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { formatDate } from '../../utils/formatters';
import { Search, Lock, Unlock, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export default function UserManagementTab() {
  const { allUsers, lockUserAccount, unlockUserAccount, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | LOCKED
  const [targetLockUser, setTargetLockUser] = useState(null);
  const [lockReason, setLockReason] = useState('');

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmLock = async () => {
    if (!targetLockUser) return;
    await lockUserAccount(targetLockUser.id, lockReason || 'Vi phạm điều khoản thảo luận');
    setTargetLockUser(null);
    setLockReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, username, email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          >
            <option value="ALL">Tất cả ({allUsers.length})</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Lock Dialog modal inline */}
      {targetLockUser && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Khóa tài khoản: {targetLockUser.name} (@{targetLockUser.username})</span>
          </div>
          <p className="text-xs text-rose-700">
            Khi bị khóa, người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ thao tác nào trên hệ thống Discuss cho đến khi được Admin mở khóa lại.
          </p>
          <input
            type="text"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="Nhập lý do khóa tài khoản..."
            className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTargetLockUser(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmLock}
              className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Xác nhận khóa tài khoản
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Vai trò hệ thống</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isLocked = user.status === 'LOCKED';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">Bạn</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{user.username} • {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <RoleBadge role={user.systemRole} type="system" size="xs" />
                      </td>

                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" /> Đã khóa
                          </span>
                        ) : user.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chờ xác thực
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(user.joinedAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          isLocked ? (
                            <button
                              onClick={() => unlockUserAccount(user.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Mở khóa</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setTargetLockUser(user)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              title="Khóa tài khoản"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Khóa</span>
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
