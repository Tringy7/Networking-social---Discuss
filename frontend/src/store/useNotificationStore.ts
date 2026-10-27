import { create } from 'zustand';
import { NotificationItem } from '../types';
import { notificationService } from '../services';

interface NotificationState {
  notifications: NotificationItem[];
  hydrate: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  hydrate: async () => {
    const notifications = await notificationService.list();
    set({ notifications });
  },

  markRead: async (id) => {
    await notificationService.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      ),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
    }));
  },
}));
