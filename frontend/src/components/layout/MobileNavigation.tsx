import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Compass, Home, Menu, MessageSquare, Plus, Settings, ShieldCheck, UserRound, Users, X, Bookmark, LogIn } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';
import NotificationBadge from '../ui/NotificationBadge';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { usePostStore } from '../../store/usePostStore';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] ${
    isActive ? 'text-[var(--color-orange-ink)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
  }`;

export const MobileNavigation: React.FC = () => {
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const { communities } = useCommunityStore();
  const openCreateModal = usePostStore((state) => state.openCreateModal);
  const unreadCount = useNotificationStore((state) => state.notifications.filter((item) => !item.isRead).length);
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeMoreMenu = () => {
    setIsMoreOpen(false);
    window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  const openMoreMenu = () => {
    setIsMoreOpen(true);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!isMoreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMoreMenu();
      if (event.key === 'Tab') {
        const menu = document.getElementById('mobile-navigation-menu');
        const controls = menu?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMoreOpen]);

  const joinedCommunities = communities.filter((community) =>
    ['OWNER', 'MODERATOR', 'MEMBER'].includes(community.currentUserRole || '')
  ).slice(0, 5);

  const createPost = () => {
    if (isAuthenticated) openCreateModal();
    else navigate('/login');
  };

  return (
    <>
      <AnimatePresence>{isMoreOpen && (
        <motion.div initial={quiet ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: quiet ? 0 : 0.15 }}>
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            className="fixed inset-0 z-40 bg-black/25 lg:hidden"
            onClick={closeMoreMenu}
            tabIndex={-1}
          />
          <motion.section
            initial={quiet ? false : { y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 35, duration: quiet ? 0 : undefined }}
            role="dialog" aria-modal="true"
            id="mobile-navigation-menu"
            aria-label="Điều hướng khác"
            className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 mx-auto max-h-[min(70vh,36rem)] max-w-xl overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-left shadow-[var(--surface-shadow)] transition-[opacity,transform] duration-[var(--duration-normal)] motion-reduce:transition-none lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Điều hướng</h2>
              <button ref={closeButtonRef} type="button" onClick={closeMoreMenu} aria-label="Đóng menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Các trang khác" className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {isAuthenticated && user ? (
                <>
                  <Link onClick={closeMoreMenu} to={`/user/${user.username}`} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><UserRound className="h-4 w-4" />Hồ sơ</Link>
                  <Link onClick={closeMoreMenu} to="/saved" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><Bookmark className="h-4 w-4" />Đã lưu</Link>
                  <Link onClick={closeMoreMenu} to="/messages" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><MessageSquare className="h-4 w-4" />Tin nhắn</Link>
                  <Link onClick={closeMoreMenu} to="/communities/mine" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><Users className="h-4 w-4" />Cộng đồng của tôi</Link>
                  <Link onClick={closeMoreMenu} to="/communities/create" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><Plus className="h-4 w-4" />Tạo cộng đồng</Link>
                  <Link onClick={closeMoreMenu} to="/settings" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><Settings className="h-4 w-4" />Cài đặt</Link>
                  {joinedCommunities.map((community) => (
                    <Link key={community.id} onClick={closeMoreMenu} to={`/community/${community.name}`} className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
                      <span className="truncate">c/{community.name}</span>
                    </Link>
                  ))}
                  {(activeRole === 'OWNER' || activeRole === 'MODERATOR' || activeRole === 'ADMIN') && (
                    <Link onClick={closeMoreMenu} to="/community/lap-trinh-viet-nam/moderation" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><ShieldCheck className="h-4 w-4" />Kiểm duyệt</Link>
                  )}
                  {activeRole === 'ADMIN' && <Link onClick={closeMoreMenu} to="/admin" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><ShieldCheck className="h-4 w-4" />Quản trị</Link>}
                </>
              ) : (
                <>
                  <Link onClick={closeMoreMenu} to="/login" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><LogIn className="h-4 w-4" />Đăng nhập</Link>
                  <Link onClick={closeMoreMenu} to="/register" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"><UserRound className="h-4 w-4" />Đăng ký</Link>
                </>
              )}
            </nav>
          </motion.section>
        </motion.div>
      )}</AnimatePresence>

      <nav aria-label="Điều hướng chính trên thiết bị di động" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--border-color)] bg-[var(--bg-nav)] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <NavLink to="/" end className={itemClass} aria-label="Trang chủ"><Home className="h-5 w-5" /><span>Trang chủ</span></NavLink>
        <NavLink to="/explore" className={itemClass} aria-label="Khám phá"><Compass className="h-5 w-5" /><span>Khám phá</span></NavLink>
        <button type="button" onClick={createPost} className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-[var(--color-orange-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]" aria-label={isAuthenticated ? 'Tạo bài viết' : 'Đăng nhập để tạo bài viết'}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--action-bg)] text-[var(--action-ink)]"><Plus className="h-5 w-5" /></span>
          <span>Đăng bài</span>
        </button>
        <NavLink to={isAuthenticated ? '/notifications' : '/login'} className={itemClass} aria-label={isAuthenticated ? `Thông báo, ${unreadCount} chưa đọc` : 'Đăng nhập'}><span className="relative"><Bell className="h-5 w-5" />{isAuthenticated && <NotificationBadge count={unreadCount} />}</span><span>Thông báo</span></NavLink>
        <button ref={moreButtonRef} type="button" onClick={() => isMoreOpen ? closeMoreMenu() : openMoreMenu()} aria-expanded={isMoreOpen} className={`${itemClass({ isActive: isMoreOpen })}`} aria-label="Mở thêm điều hướng">
          <Menu className="h-5 w-5" /><span>Thêm</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNavigation;
