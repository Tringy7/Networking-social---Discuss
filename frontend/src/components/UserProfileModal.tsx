import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, CheckCircle2, Shield, Save, Crown, UserCheck } from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateProfile,
    members,
    communities,
  } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [message, setMessage] = useState<string | null>(null);

  if (!isProfileModalOpen || !currentUser) return null;

  // List user's community roles
  const userMemberships = members.filter((m) => m.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateProfile({ displayName, bio, avatar });
    setMessage(res.message);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Thông tin cá nhân
              </h2>
              <p className="text-[11px] text-slate-500">Xem và chỉnh sửa hồ sơ người dùng</p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <img
              src={avatar || currentUser.avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-xs"
            />
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">URL ảnh đại diện:</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-900 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiểu sử (Bio):</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-slate-800"
            />
          </div>

          {/* User Roles info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Global Role (Hệ thống):</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {currentUser.globalRole}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2">
              <span className="text-slate-500 block mb-1 font-semibold">
                Vai trò theo từng Community (Community Role):
              </span>
              {userMemberships.length === 0 ? (
                <span className="text-slate-400 italic">Chưa tham gia cộng đồng nào.</span>
              ) : (
                <div className="space-y-1">
                  {userMemberships.map((m) => {
                    const comm = communities.find((c) => c.id === m.communityId);
                    return (
                      <div key={m.communityId} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 font-medium">
                          {comm?.icon} {comm?.name}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded uppercase ${
                            m.role === 'OWNER'
                              ? 'bg-amber-100 text-amber-800'
                              : m.role === 'MODERATOR'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
