import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Globe,
  Plus,
  Crown,
  ShieldCheck,
  UserCheck,
  Lock,
  MessageSquare,
} from 'lucide-react';

export const Sidebar = () => {
  const {
    communities,
    selectedCommunityId,
    setSelectedCommunityId,
    sortFilter,
    setSortFilter,
    currentUser,
    getUserCommunityRole,
    setIsCreateCommunityOpen,
    setIsAuthModalOpen,
  } = useApp();

  const activeCommunities = communities.filter((c) => !c.isDeleted);

  return (
    <aside className="w-64 shrink-0 hidden md:block space-y-5">
      {/* Feeds navigation */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Bảng tin
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCommunityId(null)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2.5 transition cursor-pointer ${
              selectedCommunityId === null
                ? 'bg-orange-50 text-orange-600 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4 text-orange-500" />
            <span>Tất cả bài viết</span>
          </button>

          <div className="pt-2 pb-1 border-t border-slate-100 my-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3">
              Lọc theo độ nổi bật
            </span>
          </div>

          <button
            onClick={() => setSortFilter('hot')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition cursor-pointer ${
              sortFilter === 'hot'
                ? 'bg-slate-100 text-orange-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Thịnh hành (Hot)</span>
          </button>

          <button
            onClick={() => setSortFilter('new')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition cursor-pointer ${
              sortFilter === 'new'
                ? 'bg-slate-100 text-blue-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Mới nhất (New)</span>
          </button>

          <button
            onClick={() => setSortFilter('top')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition cursor-pointer ${
              sortFilter === 'top'
                ? 'bg-slate-100 text-amber-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Được vote nhiều nhất (Top)</span>
          </button>
        </div>
      </div>

      {/* Community List */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Cộng đồng ({activeCommunities.length})
          </p>
          <button
            id="sidebar-create-community-btn"
            onClick={() => {
              if (!currentUser) setIsAuthModalOpen(true);
              else setIsCreateCommunityOpen(true);
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1 rounded transition cursor-pointer"
            title="Tạo Community mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {activeCommunities.map((comm) => {
            const role = currentUser ? getUserCommunityRole(comm.id, currentUser.id) : null;
            const isSelected = selectedCommunityId === comm.id;

            return (
              <button
                key={comm.id}
                onClick={() => setSelectedCommunityId(comm.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{comm.icon}</span>
                  <div className="truncate text-left">
                    <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {comm.name}
                    </p>
                    <p className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                      {comm.slug}
                    </p>
                  </div>
                </div>

                {/* Role badge in this community */}
                <div className="shrink-0 flex items-center gap-1">
                  {comm.isLocked && (
                    <span title="Cộng đồng bị khóa bởi Admin">
                      <Lock className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                    </span>
                  )}
                  {role === 'OWNER' && (
                    <span
                      title="Bạn là Owner của cộng đồng này"
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Crown className="w-2.5 h-2.5" />
                      <span>Owner</span>
                    </span>
                  )}
                  {role === 'MODERATOR' && (
                    <span
                      title="Bạn là Moderator của cộng đồng này"
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Mod</span>
                    </span>
                  )}
                  {role === 'MEMBER' && (
                    <span
                      title="Bạn là thành viên (Member)"
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>Member</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (!currentUser) setIsAuthModalOpen(true);
            else setIsCreateCommunityOpen(true);
          }}
          className="mt-3 w-full py-2 px-3 border border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/50 rounded-xl text-xs font-semibold text-slate-600 hover:text-orange-600 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Community mới</span>
        </button>
      </div>

      {/* Discuss Community info box */}
      <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 border border-slate-700 shadow-sm text-xs">
        <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold">
          <MessageSquare className="w-4 h-4" />
          <span>Discuss Social</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px] mb-2">
          Tham gia các sub-community để chia sẻ kiến thức, bình chọn chủ đề hay và thảo luận cùng cộng đồng.
        </p>
        <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
          <span>Phiên bản 2.0</span>
          <span className="text-orange-400 font-medium">Discuss Community</span>
        </div>
      </div>
    </aside>
  );
};
