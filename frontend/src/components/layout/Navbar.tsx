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
  ArrowUpRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, activeRole } = useAuthStore();
  const { communities } = useCommunityStore();
  const { posts, openCreateModal } = usePostStore();
  const { notifications, hydrate: hydrateNotifications, markRead } = useNotificationStore();
  const addToast = useToastStore((state) => state.addToast);

  const [searchQuery, setSearchQuery] = useState('');
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
      if (event.key === 'Escape') {
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
    <header className="editorial-navbar">
      <div className="navbar-inner">
        {/* ZONE 1: BRAND LOGO */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Logo showTagline={false} size="md" />
          <Link to="/explore" className="masthead-link">Cùng sở thích, cùng kết nối <ArrowUpRight size={13} /></Link>
        </div>

        {/* ZONE 2: SEARCH INPUT & AUTOCOMPLETE */}
        <div ref={searchRef} className={`${isMobileSearchOpen ? 'absolute inset-x-0 top-full z-50 border-b border-[var(--border-color)] bg-[var(--bg-nav)] px-3 py-3 shadow-[var(--surface-shadow)] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none' : 'hidden sm:relative'} sm:flex sm:flex-1 sm:max-w-xl`}>
          <form onSubmit={handleSearchSubmit} className="nav-search relative flex w-full items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Tìm kiếm bài viết, cộng đồng, tác giả..."
              aria-label="Tìm kiếm bài viết, cộng đồng, tác giả"
              className="w-full h-10 pl-10 pr-20 sm:pr-9 bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange-ink)] rounded-full text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                            to={`/community/${c.name}`}
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
                            to={`/post/${p.id}`}
                            onClick={() => { setIsSearchOpen(false); setIsMobileSearchOpen(false); }}
                            className="block p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                              {p.title}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                              {p.communityDisplayName} · {p.heartCount} lượt thích
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCommunities.length === 0 && filteredPosts.length === 0 && (
                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                      Không tìm thấy kết quả phù hợp cho "{searchQuery}"
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-muted)] px-2 mb-1.5 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--color-orange)]" />
                      <span>Chủ đề thảo luận</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      {[...new Set(posts.flatMap((post) => post.tags || []))].slice(0, 8).map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSearchQuery(tag);
                              rememberSearch(tag);
                              navigate(`/search?q=${encodeURIComponent(tag)}&type=all`);
                              setIsSearchOpen(false);
                              setIsMobileSearchOpen(false);
                            }}
                            className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
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
                            navigate(`/search?q=${encodeURIComponent(recent)}&type=all`);
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
          <button
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
              {/* Create Post Button */}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateModal()}
                className="navbar-create-post cursor-pointer"
              >
                Tạo bài viết
              </Button>

              {/* Messages Shortcut */}
              <Link
                to="/messages"
                className="hidden sm:flex p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative cursor-pointer"
                title="Tin nhắn riêng"
                aria-label="Tin nhắn riêng"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-orange)]" />
              </Link>

              {/* Notifications Dropdown */}
              <div ref={notifRef} className="relative hidden sm:block">
                <button
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
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-[var(--color-orange)] text-white text-xs font-semibold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div data-ui="popover" className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] space-y-3 border p-4 text-left sm:w-96">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">Thông báo</h4>
                      {unreadNotifs > 0 && (
                        <span className="rounded-full bg-[var(--color-orange-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-orange)]">
                          {unreadNotifs} mới
                        </span>
                      )}
                      <Link
                        to="/notifications"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs text-[var(--color-orange)] hover:underline"
                      >
                        Xem tất cả
                      </Link>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-[var(--text-secondary)]">
                      Chưa có thông báo mới.
                        </p>
                      ) : notifications.slice(0, 5).map((n) => (
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
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-[background-color,border-color] duration-[var(--duration-fast)] cursor-pointer"
                  aria-label="Mở menu tài khoản"
                  aria-expanded={isUserMenuOpen}
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[110px]">
                      {user.displayName}
                    </span>
                    <span className="text-xs text-[var(--color-orange)] font-medium leading-none">
                      {user.karma} karma
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>

                {isUserMenuOpen && (
                  <div data-ui="popover" className="absolute right-0 top-12 w-64 border p-2 z-50 text-left space-y-1">
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{user.displayName}</div>
                      <div className="text-xs text-[var(--text-muted)]">@{user.username}</div>
                    </div>

                    <Link
                      to={`/user/${user.username}`}
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

                    {activeRole === 'ADMIN' && (
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
