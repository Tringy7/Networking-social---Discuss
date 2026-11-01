import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { SYSTEM_ROLES, COMMUNITY_ROLES } from '../../constants/roles';
import RoleBadge from './RoleBadge';
import { 
  Home, 
  Compass, 
  ShieldAlert, 
  User, 
  Plus, 
  Sparkles,
  Users,
  Flame,
  Clock,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({
  currentView,
  selectedCommunityId,
  onNavigateHome,
  onNavigateExplore,
  onNavigateAdmin,
  onNavigateProfile,
  onSelectCommunity,
  onOpenCreateCommunity,
  isOpenMobile,
  onCloseMobile,
}) {
  const { currentUser, currentRole, isAuthenticated } = useAuth();
  const { communities, memberships, getUserCommunityRole } = useCommunity();

  // Find communities that current user is a member of
  const myMemberships = currentUser
    ? memberships.filter(m => m.userId === currentUser.id && !m.isBanned)
    : [];

  const myCommunities = myMemberships.map(m => {
    const comm = communities.find(c => c.id === m.communityId);
    return { ...comm, role: m.role };
  }).filter(c => !!c.id);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-4 px-3">
      <div className="space-y-6">
        {/* Main Nav Links */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onNavigateHome();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentView === 'home' && !selectedCommunityId
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Bảng tin chính</span>
          </button>

          <button
            onClick={() => {
              onNavigateExplore();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentView === 'explore'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Khám phá Cộng đồng</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                onNavigateProfile();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentView === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Hồ sơ cá nhân</span>
            </button>
          )}

          {currentRole === SYSTEM_ROLES.ADMIN && (
            <button
              onClick={() => {
                onNavigateAdmin();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Quản trị hệ thống</span>
            </button>
          )}
        </div>

        {/* My Communities Section */}
        <div className="pt-2 border-t border-slate-200/80">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cộng đồng của bạn
            </span>
            {isAuthenticated && (
              <button
                onClick={onOpenCreateCommunity}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                title="Tạo cộng đồng mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 text-center">
              Đăng nhập để xem danh sách cộng đồng bạn tham gia
            </div>
          ) : myCommunities.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 text-center space-y-2">
              <p>Bạn chưa tham gia cộng đồng nào.</p>
              <button
                onClick={onNavigateExplore}
                className="text-xs font-semibold text-indigo-600 hover:underline block mx-auto cursor-pointer"
              >
                Khám phá ngay →
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {myCommunities.map((c) => {
                const isSelected = selectedCommunityId === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCommunity(c.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/60'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={c.avatar}
                        alt=""
                        className="w-5 h-5 rounded-md object-cover shrink-0"
                      />
                      <span className="truncate font-medium">c/{c.slug}</span>
                    </div>

                    <RoleBadge role={c.role} size="xs" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick info card */}
        {isAuthenticated && (
          <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tạo Cộng Đồng Mới</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
              Xây dựng không gian thảo luận riêng và trở thành Owner quản lý cộng đồng.
            </p>
            <button
              onClick={onOpenCreateCommunity}
              className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              + Tạo ngay
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 px-2 space-y-1">
        <p className="font-semibold text-slate-600">Discuss Platform</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200/80 bg-white/70">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-white h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
