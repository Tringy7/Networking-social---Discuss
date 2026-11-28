import { parseSearchQuery } from '../../utils/searchQuery';
import { ADMIN_AVAILABLE } from '../../services';
import { postPath } from '../../utils/postPath';
import ThemeToggle from '../ui/ThemeToggle';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBadge from '../ui/NotificationBadge';
import NotificationPanel from './NotificationPanel';
import Logo from '../common/Logo';
import Avatar from '../ui/Avatar';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';
import { useToastStore } from '../../store/useToastStore';
import { notificationSyncKey, useNotificationStore } from '../../store/useNotificationStore';
import { listenForNotificationSoundPermission } from '../../utils/notificationSound';
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
  Clock,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, activeRole } = useAuthStore();
  const unreadMessages = useChatStore(state => state.threads.reduce((total, thread) => total + (thread.hidden || thread.muted ? 0 : thread.unread), 0));
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const stop = useChatStore.getState().connect();
    return () => {
      stop();
      useChatStore.getState().clear();
    };
  }, [isAuthenticated, user?.id]);
  const { communities } = useCommunityStore();
  const { posts } = usePostStore();
  const { unreadCount: unreadNotifs, hydrate: hydrateNotifications, syncUnreadCount, clear } = useNotificationStore();
  const addToast = useToastStore((state) => state.addToast);

  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    if (location.pathname === '/search') setSearchQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.pathname, location.search]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('discuss_searches') || '[]');
      return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
    } catch { return []; }
  });
  const rememberSearch = (query: string) => {
    const next = [query, ...recentSearches.filter((item) => item !== query)].slice(0, 5);
    setRecentSearches(next);
    try { localStorage.setItem('discuss_searches', JSON.stringify(next)); } catch { /* Search still works without storage. */ }
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    clear();
    if (!isAuthenticated || !user?.id) return;
    hydrateNotifications().catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
    });
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void hydrateNotifications().catch(() => {});
    };
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== notificationSyncKey || !event.newValue) return;
      try {
        if (JSON.parse(event.newValue)?.userId === user.id) {
          void hydrateNotifications().catch(() => {});
        }
      } catch {
        // Ignore malformed browser storage events.
      }
    };
    const stopListeningForSoundPermission = listenForNotificationSoundPermission();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncUnreadCount().catch(() => {});
    }, 10000);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    window.addEventListener('storage', syncFromOtherTab);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      stopListeningForSoundPermission();
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      window.removeEventListener('storage', syncFromOtherTab);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [addToast, clear, hydrateNotifications, isAuthenticated, syncUnreadCount, user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
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

  useEffect(() => {
    if (!isMobileSearchOpen && !isSearchOpen && !isUserMenuOpen && !isNotifOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) {
        if (isNotifOpen && notifRef.current?.contains(document.activeElement)) {
          notificationButtonRef.current?.focus();
        }
        if (isUserMenuOpen && userMenuRef.current?.contains(document.activeElement)) {
          userMenuButtonRef.current?.focus();
        }
        if (isMobileSearchOpen && searchRef.current?.contains(document.activeElement)) {
          mobileSearchButtonRef.current?.focus();
        }
        setIsMobileSearchOpen(false);
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileSearchOpen, isSearchOpen, isUserMenuOpen, isNotifOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    rememberSearch(searchQuery.trim());
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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

  const search = parseSearchQuery(searchQuery);
  const keyword = search.keyword.toLowerCase();
  const filteredCommunities = (search.type === 'communities' && keyword ? communities : [])
    .filter(
      (c) =>
        c.displayName.toLowerCase().includes(keyword) ||
        c.name.toLowerCase().includes(keyword)
    )
    .slice(0, 3);

  const filteredPosts = (search.type === 'posts' && keyword ? posts : [])
    .filter((p) => p.title.toLowerCase().includes(keyword) || p.content?.toLowerCase().includes(keyword))
    .slice(0, 3);

  return (
    <header className="editorial-navbar">
      <div className="navbar-inner">
        {/* ZONE 1: BRAND LOGO */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Logo showTagline={false} size="md" className="header-brand" />
          <Link to="/explore" className="masthead-link">Cùng sở thích, cùng kết nối <ArrowUpRight size={13} /></Link>
        </div>

        {/* ZONE 2: SEARCH INPUT & AUTOCOMPLETE */}
        <div ref={searchRef} className={`${isMobileSearchOpen ? 'absolute inset-x-0 top-full z-50 border-b border-[var(--border-color)] bg-[var(--bg-nav)] px-3 py-3 shadow-[var(--surface-shadow)] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none' : 'hidden sm:relative'} min-w-0 sm:flex sm:flex-1 sm:max-w-xl`}>
          <form onSubmit={handleSearchSubmit} className="nav-search relative flex w-full items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Tìm nội dung, u/người dùng, c/cộng đồng..."
              aria-label="Tìm nội dung, u/ để tìm người dùng, c/ để tìm cộng đồng"
              className="w-full min-h-10 pl-10 pr-20 sm:pr-9 bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange-ink)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa nội dung tìm kiếm"
                className={`${isMobileSearchOpen ? 'right-11' : 'right-3'} absolute p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isMobileSearchOpen && (
              <button type="button" onClick={() => { setIsMobileSearchOpen(false); setIsSearchOpen(false); }} aria-label="Đóng tìm kiếm" className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] sm:hidden">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div data-ui="popover" className="absolute top-12 left-0 right-0 border p-3 z-50 text-left space-y-3">
              {searchQuery.trim() ? (
                <>
                  {filteredCommunities.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-muted)] px-2 mb-1.5">
                        Cộng đồng gợi ý
                      </div>
                      <div className="space-y-1">
                        {filteredCommunities.map((c) => (
                          <Link
                            key={c.id}
                            to={`/c/${c.name}`}
                            onClick={() => { setIsSearchOpen(false); setIsMobileSearchOpen(false); }}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Avatar src={c.avatarUrl} alt={c.displayName} size="xs" shape="rounded" />
                            <div className="truncate">
                              <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                                {c.displayName}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
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
                      <div className="text-xs font-semibold text-[var(--text-muted)] px-2 mb-1.5">
                        Bài viết
                      </div>
                      <div className="space-y-1">
                        {filteredPosts.map((p) => (
                          <Link
                            key={p.id}
                            to={postPath(p)}
                            onClick={() => { setIsSearchOpen(false); setIsMobileSearchOpen(false); }}
                            className="block p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                              {p.title}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                              {p.communityDisplayName} · {p.voteScore} điểm
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCommunities.length === 0 && filteredPosts.length === 0 && (
                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                      {search.keyword ? `Nhấn Enter để tìm ${search.type === 'people' ? 'người dùng' : search.type === 'communities' ? 'cộng đồng' : 'nội dung'} “${search.keyword}”` : 'Nhập từ khóa sau u/ hoặc c/ để tìm kiếm'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="border-t border-[var(--border-color)] pt-2">
                    <div className="text-xs font-semibold text-[var(--text-muted)] px-2 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tìm kiếm gần đây</span>
                    </div>
                    <div className="space-y-0.5">
                      {!recentSearches.length && <p className="px-2 py-2 text-xs text-[var(--text-muted)]">Chưa có tìm kiếm gần đây.</p>}
                      {recentSearches.map((recent) => (
                        <button
                          key={recent}
                          type="button"
                          onClick={() => {
                            setSearchQuery(recent);
                            rememberSearch(recent);
                            navigate(`/search?q=${encodeURIComponent(recent)}`);
                            setIsSearchOpen(false);
                            setIsMobileSearchOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors truncate"
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
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {isAuthenticated && user && (
            <Link to="/posts/create" className="navbar-create-post">
              <Plus size={18} aria-hidden="true" />
              Tạo bài viết
            </Link>
          )}
          <ThemeToggle />
          <button
            ref={mobileSearchButtonRef}
            type="button"
            onClick={() => {
              setIsMobileSearchOpen((open) => !open);
              setIsSearchOpen(!isMobileSearchOpen);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:hidden"
            aria-label={isMobileSearchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
            aria-expanded={isMobileSearchOpen}
          >
            {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {isAuthenticated && user ? (
            <>
              <button type="button"
                onClick={() => useChatStore.getState().openWindow()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative cursor-pointer"
                title="Tin nhắn riêng"
                aria-label={unreadMessages ? `Tin nhắn riêng, ${unreadMessages} chưa đọc` : "Tin nhắn riêng"}>
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />}
              </button>

              {/* Notifications Dropdown */}
              <div ref={notifRef} className="relative hidden sm:block">
                <button
                  ref={notificationButtonRef}
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && isAuthenticated) {
                      hydrateNotifications().catch((error: unknown) => {
                        addToast(error instanceof Error ? error.message : 'Không thể tải thông báo.', 'error');
                      });
                    }
                  }}
                  className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative cursor-pointer"
                  title="Thông báo"
                  aria-label={`Thông báo${unreadNotifs > 0 ? `, ${unreadNotifs} chưa đọc` : ''}`}
                  aria-expanded={isNotifOpen}
                  aria-controls={isNotifOpen ? "navbar-notifications" : undefined}
                >
                  <Bell className="w-5 h-5" />
                  <NotificationBadge count={unreadNotifs} />
                </button>

                {isNotifOpen && <NotificationPanel
                  onClose={() => setIsNotifOpen(false)}
                  onDismiss={() => {
                    setIsNotifOpen(false);
                    notificationButtonRef.current?.focus();
                  }}
                />}
              </div>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  ref={userMenuButtonRef}
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-[background-color,border-color] duration-[var(--duration-fast)] cursor-pointer"
                  aria-label="Mở menu tài khoản"
                  aria-expanded={isUserMenuOpen}
                  aria-controls={isUserMenuOpen ? 'navbar-account-menu' : undefined}
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[110px]">
                      {user.displayName}
                    </span>

                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>

                {isUserMenuOpen && (
                  <div id="navbar-account-menu" data-ui="popover" className="absolute right-0 top-12 w-64 border p-2 z-50 text-left space-y-1">
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{user.displayName}</div>
                      <div className="text-xs text-[var(--text-muted)]">@{user.username}</div>
                    </div>

                    <Link
                      to={`/u/${user.username}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[var(--color-orange)]" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      to="/saved"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Bài viết đã lưu</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Cài đặt hệ thống</span>
                    </Link>

                    {ADMIN_AVAILABLE && activeRole === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition-colors border-t border-[var(--border-color)]"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="pt-1 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition-colors cursor-pointer"
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
              <Link to="/login" className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
                Đăng nhập
              </Link>
              <Link to="/register" className="hidden min-h-10 items-center rounded-[var(--radius-control)] bg-[var(--action-bg)] px-3 text-sm font-semibold text-[var(--action-ink)] hover:bg-[var(--action-hover)] sm:inline-flex">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
