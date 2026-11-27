import { create } from 'zustand';
import { NotificationItem } from '../types';
import { notificationService } from '../services';
import { useAuthStore } from './useAuthStore';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  page: number;
  hasMore: boolean;
  hydrate: () => Promise<void>;
  loadMore: () => Promise<void>;
  clear: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
}

let sessionRevision = 0;
let queue: Promise<void> = Promise.resolve();
let syncing: Promise<void> | undefined;
const currentUserId = () => useAuthStore.getState().user?.id;
export const notificationSyncKey = 'discuss:notifications-changed';

function enqueue(task: (isCurrent: () => boolean) => Promise<void>) {
  const userId = currentUserId();
  const revision = sessionRevision;
  const isCurrent = () => !!userId && userId === currentUserId() && revision === sessionRevision;
  const result = queue.then(async () => {
    if (isCurrent()) await task(isCurrent);
  });
  queue = result.catch(() => {});
  return result;
}

function notifyOtherTabs() {
  try {
    localStorage.setItem(notificationSyncKey, JSON.stringify({
      userId: currentUserId(), change: window.crypto?.randomUUID?.() ?? Math.random(),
    }));
  } catch {
    // Polling also reconciles tabs when browser storage is unavailable.
  }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  page: 0,
  hasMore: false,

  hydrate: () => {
    if (syncing) return syncing;
    const refresh = enqueue(async (isCurrent) => {
      const [pages, count] = await Promise.all([
        Promise.all(Array.from({ length: get().page + 1 }, (_, page) => notificationService.getNotifications(page))),
        notificationService.getUnreadNotificationCount(),
      ]);
      if (!isCurrent()) return;
      const lastPage = pages.findIndex(page => page.last);
      const page = lastPage === -1 ? pages.length - 1 : lastPage;
      const items = pages.slice(0, page + 1).flatMap(result => result.content);
      set({
        notifications: [...new Map(items.map(item => [item.id, item])).values()],
        unreadCount: count.unreadCount,
        page,
        hasMore: !pages[page].last,
      });
    });
    syncing = refresh.finally(() => {
      if (syncing === pending) syncing = undefined;
    });
    const pending = syncing;
    return pending;
  },

  loadMore: () => enqueue(async (isCurrent) => {
    if (!get().hasMore) return;
    const page = get().page + 1;
    const result = await notificationService.getNotifications(page);
    if (isCurrent()) {
      set(state => ({
        notifications: [...new Map([...state.notifications, ...result.content].map(item => [item.id, item])).values()],
        page, hasMore: !result.last,
      }));
    }
  }),

  clear: () => {
    sessionRevision++;
    syncing = undefined;
    queue = Promise.resolve();
    set({ notifications: [], unreadCount: 0, page: 0, hasMore: false });
  },

  markRead: async (id) => {
    await enqueue(async (isCurrent) => {
      await notificationService.markNotificationAsRead(id);
      if (!isCurrent()) return;
      set(state => ({
        notifications: state.notifications.map(item => item.id === id ? { ...item, isRead: true } : item),
        unreadCount: Math.max(0, state.unreadCount - Number(state.notifications.some(item => item.id === id && !item.isRead))),
      }));
      notifyOtherTabs();
    });
    void get().hydrate().catch(() => {});
  },

  markAllRead: async () => {
    await enqueue(async (isCurrent) => {
      await notificationService.markAllNotificationsAsRead();
      if (!isCurrent()) return;
      set(state => ({
        notifications: state.notifications.map(item => ({ ...item, isRead: true })),
        unreadCount: 0,
      }));
      notifyOtherTabs();
    });
    void get().hydrate().catch(() => {});
  },

  deleteReadNotifications: async () => {
    await enqueue(async (isCurrent) => {
      await notificationService.deleteReadNotifications();
      if (!isCurrent()) return;
      set(state => ({
        notifications: state.notifications.filter(item => !item.isRead),
        page: 0,
        hasMore: false,
      }));
      notifyOtherTabs();
    });
    void get().hydrate().catch(() => {});
  },
}));
