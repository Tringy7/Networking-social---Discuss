import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  onOpenCreateCommunity,
  isOpenMobile,
  onCloseMobile,
}) {
  const location = useLocation();
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
    <div className="h-full flex flex-col justify-between py-4 px-3 text-[#d7dadc]">
      <div className="space-y-6">
        {/* Main Nav Links */}
        <div className="space-y-1">
          <Link
            to="/"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              location.pathname === '/'
                ? 'bg-[#272729] text-white font-bold border-l-2 border-orange-500'
                : 'text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Home className="w-4 h-4 text-orange-500" />
            <span>Bảng tin chính</span>
          </Link>

          <Link
            to="/explore"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              location.pathname === '/explore'
                ? 'bg-[#272729] text-white font-bold border-l-2 border-orange-500'
                : 'text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Khám phá Cộng đồng</span>
          </Link>

          <Link
            to="/user"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              location.pathname === '/user' || location.pathname === '/user/edit'
                ? 'bg-[#272729] text-white font-bold border-l-2 border-orange-500'
                : 'text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Hồ sơ cá nhân</span>
            </div>
            {!isAuthenticated && (
              <span className="text-[10px] bg-[#272729] text-orange-400 font-mono px-1.5 py-0.5 rounded font-bold border border-[#343536]">
                API
              </span>
            )}
          </Link>

          {currentRole === SYSTEM_ROLES.ADMIN && (
            <Link
              to="/admin"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-rose-950/40 text-rose-400 border-l-2 border-rose-500'
                  : 'text-rose-400 hover:bg-[#272729]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Quản trị hệ thống</span>
            </Link>
          )}
        </div>

        {/* My Communities Section */}
        <div className="pt-2 border-t border-[#343536]">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-[#818384] uppercase tracking-wider">
              Cộng đồng của bạn
            </span>
            {isAuthenticated && (
              <button
                onClick={onOpenCreateCommunity}
                className="p-1 text-orange-400 hover:bg-[#272729] rounded-lg transition cursor-pointer"
                title="Tạo cộng đồng mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="p-3 bg-[#1a1a1b] border border-[#343536] rounded-xl text-[11px] text-[#818384] text-center">
              Đăng nhập để xem danh sách cộng đồng bạn tham gia
            </div>
          ) : myCommunities.length === 0 ? (
            <div className="p-3 bg-[#1a1a1b] border border-[#343536] rounded-xl text-[11px] text-[#818384] text-center space-y-2">
              <p>Bạn chưa tham gia cộng đồng nào.</p>
              <Link
                to="/explore"
                className="text-xs font-semibold text-orange-400 hover:underline block mx-auto cursor-pointer"
              >
                Khám phá ngay →
              </Link>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {myCommunities.map((c) => {
                const isSelected = location.pathname === `/community/${c.slug}` || location.pathname === `/community/${c.id}`;

                return (
                  <Link
                    key={c.id}
                    to={`/community/${c.slug || c.id}`}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#272729] text-white font-bold border border-[#343536]'
                        : 'hover:bg-[#272729] text-[#d7dadc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={c.avatar}
                        alt=""
                        className="w-5 h-5 rounded-md object-cover shrink-0 border border-[#343536]"
                      />
                      <span className="truncate font-medium">community/{c.slug}</span>
                    </div>

                    <RoleBadge role={c.role} size="xs" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick info card */}
        {isAuthenticated && (
          <div className="p-3.5 bg-[#1a1a1b] rounded-2xl border border-[#343536] text-xs">
            <div className="flex items-center gap-1.5 font-bold text-orange-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Tạo Cộng Đồng Mới</span>
            </div>
            <p className="text-[11px] text-[#818384] leading-relaxed mb-2.5">
              Xây dựng không gian thảo luận riêng và trở thành Owner quản lý cộng đồng.
            </p>
            <button
              onClick={onOpenCreateCommunity}
              className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              + Tạo ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Flush against the very left edge */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-[#343536] bg-[#0e1113]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-[#0e1113] border-r border-[#343536] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
