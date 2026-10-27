import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  Search,
  Plus,
  Bell,
  MessageSquare,
  Bookmark,
  User as UserIcon,
  Settings,
  LogOut,
  Shield,
  X,
  TrendingUp,
  Clock,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, activeRole } = useAuthStore();
  const { communities } = useCommunityStore();
  const { posts, openCreateModal } = usePostStore();
  const { notifications, hydrate: hydrateNotifications, markRead } = useNotificationStore();
  const addToast = useToastStore((state) => state.addToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (!isAuthenticated) return;
    hydrateNotifications().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
    });
  }, [addToast, hydrateNotifications, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=all`);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (error: unknown) {
      addToast(error instanceof Error ? error.message : 'Đăng xuất thất bại.', 'error');
    }
  };

  const filteredCommunities = communities
    .filter(
      (c) =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 3);

  const filteredPosts = posts
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 3);

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-[var(--bg-nav)] border-b border-[var(--border-color)] px-4 sm:px-6">
      <div className="h-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* ZONE 1: BRAND LOGO */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Logo showTagline={false} size="md" />
        </div>

        {/* ZONE 2: SEARCH INPUT & AUTOCOMPLETE */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#6C7482] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Tìm kiếm bài viết, cộng đồng, tác giả..."
              className="w-full h-10 pl-10 pr-9 bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange)] rounded-full text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--color-orange-soft)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-[#6C7482] hover:text-[#F1F3F7] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-12 left-0 right-0 bg-[#191A1C] border border-[#303235] rounded-2xl shadow-2xl p-3 z-50 text-left space-y-3">
              {searchQuery.trim() ? (
                <>
                  {filteredCommunities.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-[#70747C] uppercase px-2 mb-1.5">
                        Cộng đồng gợi ý
                      </div>
                      <div className="space-y-1">
                        {filteredCommunities.map((c) => (
                          <Link
                            key={c.id}
                            to={`/c/${c.name}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#222426] transition-colors"
                          >
                            <Avatar src={c.avatarUrl} alt={c.displayName} size="xs" shape="rounded" />
                            <div className="truncate">
                              <span className="text-xs font-semibold text-[#F5F5F5] block truncate">
                                {c.displayName}
                              </span>
                              <span className="text-[11px] text-[#70747C]">
                                {c.memberCount.toLocaleString('vi-VN')} thành viên
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPosts.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-[#70747C] uppercase px-2 mb-1.5">
                        Bài viết
                      </div>
                      <div className="space-y-1">
                        {filteredPosts.map((p) => (
                          <Link
                            key={p.id}
                            to={`/post/${p.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="block p-2 rounded-xl hover:bg-[#222426] transition-colors"
                          >
                            <div className="text-xs font-medium text-[#F5F5F5] truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-[#70747C] mt-0.5">
                              {p.communityDisplayName} · {p.heartCount} lượt thích
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCommunities.length === 0 && filteredPosts.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#9A9DA3]">
                      Không tìm thấy kết quả phù hợp cho "{searchQuery}"
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="text-[11px] font-bold text-[#70747C] uppercase px-2 mb-1.5 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#FF5700]" />
                      <span>Xu hướng tìm kiếm</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      {['Spring Boot 3', 'React 19', 'Đồ án tốt nghiệp', 'Tailwind v4', 'Gemini AI'].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSearchQuery(tag);
                              navigate(`/search?q=${encodeURIComponent(tag)}&type=all`);
                              setIsSearchOpen(false);
                            }}
                            className="text-xs px-2.5 py-1 rounded-full bg-[#222426] hover:bg-[#292B2E] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="border-t border-[#303235] pt-2">
                    <div className="text-[11px] font-bold text-[#70747C] uppercase px-2 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tìm kiếm gần đây</span>
                    </div>
                    <div className="space-y-0.5">
                      {['Kiến trúc Clean Architecture', 'Học bổng CNTT'].map((recent) => (
                        <button
                          key={recent}
                          type="button"
                          onClick={() => {
                            setSearchQuery(recent);
                            navigate(`/search?q=${encodeURIComponent(recent)}&type=all`);
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] rounded-lg transition-colors truncate"
                        >
                          {recent}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ZONE 3: ACTIONS & USER MENU */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated && user ? (
            <>
              {/* Create Post Button */}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateModal()}
                className="hidden md:inline-flex cursor-pointer"
              >
                Tạo bài viết
              </Button>

              {/* Messages Shortcut */}
              <Link
                to="/messages"
                className="p-2 rounded-full text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] transition-colors relative cursor-pointer"
                title="Tin nhắn riêng"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5700]" />
              </Link>

              {/* Notifications Dropdown */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && isAuthenticated) {
                      hydrateNotifications().catch((error: unknown) => {
                        addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
                      });
                    }
                  }}
                  className="p-2 rounded-full text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] transition-colors relative cursor-pointer"
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-[#FF5700] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-left shadow-[0_16px_48px_rgba(15,23,42,0.16)] sm:w-96">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Thông báo</h4>
                      {unreadNotifs > 0 && (
                        <span className="rounded-full bg-[var(--color-orange-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-orange)]">
                          {unreadNotifs} mới
                        </span>
                      )}
                      <Link
                        to="/notifications"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs text-[#FF5700] hover:underline"
                      >
                        Xem tất cả
                      </Link>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.slice(0, 5).map((n) => (
                        <Link
                          key={n.id}
                          to={n.targetUrl}
                          onClick={() => {
                            setIsNotifOpen(false);
                            if (!n.isRead) {
                              markRead(n.id).catch((error: unknown) => {
                                addToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.', 'error');
                              });
                            }
                          }}
                          className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--bg-hover)] ${
                            !n.isRead ? 'bg-orange-50/70 ring-1 ring-inset ring-orange-100' : ''
                          }`}
                        >
                          <Avatar src={n.actor?.avatarUrl} alt={n.actor?.displayName || 'Discuss'} size="xs" />
                          <div className="min-w-0 flex-1 text-xs">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {n.actor?.displayName || 'DISCUSS'}{' '}
                            </span>
                            <span className="text-[var(--text-secondary)]">{n.message}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[#222426] border border-transparent hover:border-[#303235] transition-all cursor-pointer"
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#F5F5F5] truncate max-w-[110px]">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-[#FF5700] font-medium leading-none">
                      {user.karma} karma
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#70747C]" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-[#191A1C] border border-[#303235] rounded-2xl shadow-2xl p-2 z-50 text-left space-y-1">
                    <div className="px-3 py-2 border-b border-[#303235] mb-1">
                      <div className="text-xs font-bold text-[#F5F5F5]">{user.displayName}</div>
                      <div className="text-[11px] text-[#70747C]">@{user.username}</div>
                    </div>

                    <Link
                      to={`/u/${user.username}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#FF5700]" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      to="/saved"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] rounded-xl transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Bài viết đã lưu</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#9A9DA3] hover:text-[#F5F5F5] hover:bg-[#222426] rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Cài đặt hệ thống</span>
                    </Link>

                    {activeRole === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors border-t border-[#303235]"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="pt-1 border-t border-[#303235]">
                      <button
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
