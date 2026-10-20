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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 text-indigo-600 hover:opacity-90 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-black text-lg">
              D
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg text-slate-900 leading-tight tracking-tight">
                Discuss<span className="text-indigo-600">.</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 -mt-1 hidden sm:inline">
                Mạng Xã Hội Thảo Luận
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Global Search Input (Module 7) */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm bài viết theo từ khóa, tiêu đề, tag..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              location.pathname === '/explore'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>Khám phá</span>
          </Link>

          {/* Create Post Button */}
          {isAuthenticated && (
            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Đăng bài</span>
            </button>
          )}

          {/* Admin panel quick button if admin */}
          {currentRole === SYSTEM_ROLES.ADMIN && (
            <Link
              to="/admin"
              className={`p-2 rounded-xl transition cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-rose-100 text-rose-700'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
              title="Quản trị hệ thống (Admin Panel)"
            >
              <ShieldAlert className="w-5 h-5" />
            </Link>
          )}

          {/* User Profile or Guest Auth buttons */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {userDisplayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    @{currentUser?.username}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900 truncate">{userDisplayName}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</div>
                  </div>

                  <Link
                    to="/user"
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Hồ sơ của tôi</span>
                  </Link>

                  <Link
                    to="/user/edit"
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Chỉnh sửa thông tin</span>
                  </Link>

                  {currentRole === SYSTEM_ROLES.ADMIN && (
                    <Link
                      to="/admin"
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>Quản trị hệ thống</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
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
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer"
                  title="Nhập mã OTP để xác thực tài khoản vừa đăng ký"
                >
                  <MailCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Xác thực email</span>
                </button>
              )}
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
