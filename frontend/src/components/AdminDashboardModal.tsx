import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Users,
  Layers,
  Lock,
  Unlock,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    communities,
    posts,
    reports,
    toggleLockUser,
    adminToggleLockCommunity,
    adminDeleteCommunity,
    setSelectedCommunityId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'communities'>('users');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  if (currentUser?.globalRole !== 'ADMIN') {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h3>
          <p className="text-xs text-slate-600">
            Khu vực Quản trị hệ thống chỉ dành cho người dùng có Global Role là <strong>ADMIN</strong>.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleLockUser = (userId: string) => {
    const res = toggleLockUser(userId);
    showFeedback(res.message);
  };

  const handleToggleLockCommunity = (commId: string) => {
    const res = adminToggleLockCommunity(commId);
    showFeedback(res.message);
  };

  const handleDeleteCommunity = (commId: string) => {
    if (confirm('Xác nhận XÓA vĩnh viễn cộng đồng này khỏi hệ thống?')) {
      const res = adminDeleteCommunity(commId);
      showFeedback(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quản trị Hệ thống (Admin Dashboard)
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý người dùng, khóa/mở khóa tài khoản và quản trị các Community.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/50 border-b border-slate-100 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block text-[11px]">Tổng người dùng:</span>
            <strong className="text-lg font-extrabold text-slate-900">{users.length}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block text-[11px]">Cộng đồng hoạt động:</span>
            <strong className="text-lg font-extrabold text-slate-900">{communities.filter((c) => !c.isDeleted).length}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block text-[11px]">Tổng bài viết:</span>
            <strong className="text-lg font-extrabold text-slate-900">{posts.filter((p) => !p.isDeleted).length}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block text-[11px]">Báo cáo hệ thống:</span>
            <strong className="text-lg font-extrabold text-amber-600">{reports.length}</strong>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 px-5 bg-white text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Người Dùng</span>
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'communities'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Quản lý Community</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: User Management */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Người dùng</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Global Role</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isAdmin = u.globalRole === 'ADMIN';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar}
                                alt={u.displayName}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-bold text-slate-800">
                                  {u.displayName} {isSelf && <span className="text-purple-600">(Bạn)</span>}
                                </p>
                                <p className="text-[11px] text-slate-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">{u.email}</td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.globalRole === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.globalRole}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {u.isLocked ? (
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>ĐÃ BỊ KHÓA</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                Hoạt động
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {isAdmin ? (
                              <span className="text-slate-400 text-[11px] italic">Admin hệ thống</span>
                            ) : (
                              <button
                                id={`admin-toggle-lock-user-${u.id}`}
                                onClick={() => handleToggleLockUser(u.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer ${
                                  u.isLocked
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                                }`}
                                title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {u.isLocked ? (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>Mở khóa</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Khóa tài khoản</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Community Management (Function #31) */}
          {activeTab === 'communities' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Community</th>
                      <th className="py-2.5 px-3">Owner</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Ngày tạo</th>
                      <th className="py-2.5 px-3 text-right">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {communities.map((comm) => {
                      const commOwner = users.find((u) => u.id === comm.ownerId);

                      return (
                        <tr key={comm.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{comm.icon}</span>
                              <div>
                                <p className="font-bold text-slate-900">{comm.name}</p>
                                <p className="text-[11px] text-slate-400">c/{comm.slug}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-700">
                            u/{commOwner?.username || 'user'}
                          </td>

                          <td className="py-3 px-3">
                            {comm.isDeleted ? (
                              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                ĐÃ XÓA
                              </span>
                            ) : comm.isLocked ? (
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>BỊ KHÓA</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                Đang mở
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {new Date(comm.createdAt).toLocaleDateString('vi-VN')}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View community */}
                              <button
                                onClick={() => {
                                  setSelectedCommunityId(comm.id);
                                  onClose();
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                title="Xem cộng đồng"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {!comm.isDeleted && (
                                <>
                                  {/* Lock / Unlock community */}
                                  <button
                                    id={`admin-toggle-lock-comm-${comm.id}`}
                                    onClick={() => handleToggleLockCommunity(comm.id)}
                                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                      comm.isLocked
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    }`}
                                    title={comm.isLocked ? 'Mở khóa Community' : 'Khóa Community'}
                                  >
                                    {comm.isLocked ? 'Mở khóa' : 'Khóa'}
                                  </button>

                                  {/* Delete community */}
                                  <button
                                    id={`admin-delete-comm-${comm.id}`}
                                    onClick={() => handleDeleteCommunity(comm.id)}
                                    className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[11px] font-semibold transition flex items-center gap-0.5"
                                    title="Xóa Community"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Xóa</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
