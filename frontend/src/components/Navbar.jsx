import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Globe,
  X,
  Compass,
} from 'lucide-react';

export const Navbar = () => {
  const {
    currentUser,
    isGuest,
    logout,
    searchQuery,
    setSearchQuery,
    communities,
    selectedCommunityId,
    setSelectedCommunityId,
    setIsCreatePostOpen,
    setIsCreateCommunityOpen,
    setIsAdminDashboardOpen,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsProfileModalOpen,
  } = useApp();

  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const commDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commDropdownRef.current && !commDropdownRef.current.contains(e.target)) {
        setIsCommunityDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentComm = communities.find((c) => c.id === selectedCommunityId);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand & Community Selector */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            id="brand-logo-btn"
            onClick={() => {
              setSelectedCommunityId(null);
              setSearchQuery('');
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:scale-105 transition">
              D
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">Discuss</span>
              <span className="text-orange-600 font-bold text-lg">.social</span>
            </div>
          </button>

          {/* Community quick select dropdown */}
          <div className="relative" ref={commDropdownRef}>
            <button
              id="navbar-community-dropdown-btn"
              onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              {currentComm ? (
                <>
                  <span className="text-base">{currentComm.icon}</span>
                  <span className="max-w-[110px] sm:max-w-[150px] truncate font-semibold">{currentComm.name}</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">Trang chủ / Khám phá</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isCommunityDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Điều hướng
                </div>
                <button
                  onClick={() => {
                    setSelectedCommunityId(null);
                    setIsCommunityDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-50 transition cursor-pointer ${
                    selectedCommunityId === null ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Tất cả cộng đồng (Home Feed)</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Cộng đồng hiện có</span>
                  <span className="text-[10px] font-normal text-slate-500">{communities.filter(c => !c.isDeleted).length}</span>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {communities
                    .filter((c) => !c.isDeleted)
                    .map((comm) => (
                      <button
                        key={comm.id}
                        onClick={() => {
                          setSelectedCommunityId(comm.id);
                          setIsCommunityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          selectedCommunityId === comm.id ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{comm.icon}</span>
                          <span className="truncate">{comm.name}</span>
                        </div>
                        {comm.isLocked && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Khóa</span>
                        )}
                      </button>
                    ))}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                  <button
                    id="navbar-create-comm-btn"
                    onClick={() => {
                      setIsCommunityDropdownOpen(false);
                      if (isGuest) {
                        setIsAuthModalOpen(true);
                      } else {
                        setIsCreateCommunityOpen(true);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 rounded-lg font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Community mới</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết theo từ khóa (tiêu đề, nội dung)..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder:text-slate-500 rounded-full border border-transparent focus:border-orange-500 text-xs sm:text-sm transition focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & User Account */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="nav-create-post-btn"
            onClick={() => {
              if (isGuest) {
                setIsAuthModalOpen(true);
              } else {
                setIsCreatePostOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Đăng bài</span>
          </button>

          {/* Admin Dashboard button */}
          {currentUser?.globalRole === 'ADMIN' && (
            <button
              id="nav-admin-dashboard-btn"
              onClick={() => setIsAdminDashboardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer border border-purple-200"
              title="Quản trị hệ thống"
            >
              <Shield className="w-4 h-4 text-purple-700" />
              <span className="hidden lg:inline">Quản trị Hệ Thống</span>
            </button>
          )}

          {/* Auth / Profile Area */}
          {currentUser ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
                <span className="text-xs font-semibold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                  {currentUser.displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-1" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">u/{currentUser.username}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                      Hệ thống: {currentUser.globalRole}
                    </span>
                  </div>

                  <button
                    id="profile-open-btn"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Thông tin cá nhân</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    id="logout-btn"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="login-modal-open-btn"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                id="register-modal-open-btn"
                onClick={() => {
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-xs transition cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
