import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { SYSTEM_ROLES } from '../../constants/roles';
import { 
  MessageSquareCode, 
  Search, 
  Plus, 
  User, 
  LogOut, 
  ShieldAlert, 
  Settings, 
  Compass, 
  Menu, 
  X, 
  LogIn, 
  UserPlus, 
  Flame, 
  MailCheck 
} from 'lucide-react';

export default function Navbar({
  onOpenCreatePost,
  onOpenVerifyEmail,
  onToggleMobileSidebar,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentRole, isAuthenticated, logout, pendingEmail } = useAuth();
  const { searchKeyword, setSearchKeyword } = usePost();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const profile = currentUser?.profile || {};
  const userDisplayName = profile.displayName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'Người dùng';
  const rawAvatar = profile.avatar || profile.avatarObjectKey || currentUser?.avatar || '';
  const userAvatar = rawAvatar
    ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') ? rawAvatar : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366f1&color=fff`;

  return (
    <header className="sticky top-0 z-40 bg-[#12151B]/95 backdrop-blur-md border-b border-[#262C3A]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md font-black text-base">
              D
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base text-[#d7dadc] leading-tight tracking-tight">
                Discuss<span className="text-orange-500">.</span>
              </span>
              <span className="text-[10px] font-medium text-[#818384] -mt-0.5 hidden sm:inline">
                Reddit Style Community
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Global Search Input */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#818384] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm bài viết, chủ đề trên Discuss..."
              className="w-full pl-10 pr-4 py-1.5 bg-[#272729] hover:bg-[#2d2d30] focus:bg-[#1a1a1b] border border-[#343536] focus:border-orange-500 rounded-full text-xs sm:text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Explore communities nav button */}
          <Link
            to="/explore"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              location.pathname === '/explore'
                ? 'bg-[#272729] text-[#d7dadc] border border-[#343536]'
                : 'text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]'
            }`}
          >
            <Compass className="w-4 h-4 text-orange-500" />
            <span>Khám phá</span>
          </Link>

          {/* Create Post Button */}
          {isAuthenticated && (
            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Đăng bài</span>
            </button>
          )}

          {/* Admin panel quick button if admin */}
          {currentRole === SYSTEM_ROLES.ADMIN && (
            <Link
              to="/admin"
              className={`p-2 rounded-full transition cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-rose-900/40 text-rose-400 border border-rose-800'
                  : 'text-rose-400 hover:bg-[#272729]'
              }`}
              title="Quản trị hệ thống (Admin Panel)"
            >
              <ShieldAlert className="w-4 h-4" />
            </Link>
          )}

          {/* User Profile or Guest Auth buttons */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#272729] transition cursor-pointer border border-transparent hover:border-[#343536]"
              >
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="w-7 h-7 rounded-full object-cover border border-[#343536]"
                />
                <div className="hidden lg:flex flex-col text-left pr-2">
                  <span className="text-xs font-bold text-[#d7dadc] leading-tight truncate max-w-[120px]">
                    {userDisplayName}
                  </span>
                  <span className="text-[10px] text-[#818384] font-mono">
                    user/{currentUser?.username}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-11 w-56 bg-[#1a1a1b] rounded-2xl shadow-2xl border border-[#343536] py-1.5 z-50 animate-in fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2.5 border-b border-[#343536]">
                    <div className="font-bold text-xs text-[#d7dadc] truncate">{userDisplayName}</div>
                    <div className="text-[11px] text-[#818384] font-mono truncate">{currentUser?.email}</div>
                  </div>

                  <Link
                    to="/user"
                    className="w-full px-4 py-2 text-left text-xs font-medium text-[#d7dadc] hover:bg-[#272729] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#818384]" />
                    <span>Hồ sơ của tôi</span>
                  </Link>

                  <Link
                    to="/user/edit"
                    className="w-full px-4 py-2 text-left text-xs font-medium text-[#d7dadc] hover:bg-[#272729] flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-[#818384]" />
                    <span>Chỉnh sửa thông tin</span>
                  </Link>

                  {currentRole === SYSTEM_ROLES.ADMIN && (
                    <Link
                      to="/admin"
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>Quản trị hệ thống</span>
                    </Link>
                  )}

                  <div className="border-t border-[#343536] mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {pendingEmail && (
                <button
                  onClick={() => onOpenVerifyEmail && onOpenVerifyEmail(pendingEmail, '482915')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800 rounded-full transition cursor-pointer"
                  title="Nhập mã OTP để xác thực tài khoản vừa đăng ký"
                >
                  <MailCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xác thực email</span>
                </button>
              )}
              <Link
                to="/login"
                className="px-4 py-1.5 text-xs font-bold text-[#d7dadc] hover:bg-[#272729] rounded-full transition cursor-pointer flex items-center gap-1.5 border border-[#343536]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
