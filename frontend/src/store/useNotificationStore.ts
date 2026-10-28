import { create } from 'zustand';
import { NotificationItem } from '../types';
import { NOTIFICATIONS_AVAILABLE, NotificationPreferences, notificationService } from '../services';
import { demoNotifications } from '../mocks/demoContent';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppReplies: true,
  inAppMentions: true,
  inAppCommunityActivity: true,
  emailDigest: false,
  emailAnnouncements: true,
};

interface NotificationState {
  notifications: NotificationItem[];
  preferences: NotificationPreferences;
  hydrate: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  savePreferences: () => void;
  resetPreferences: () => void;
}

function getInitialPreferences(): NotificationPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const saved = localStorage.getItem('discuss_notification_preferences');
    return saved
      ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) as Partial<NotificationPreferences> }
      : DEFAULT_NOTIFICATION_PREFERENCES;
  } catch (error) {
    console.error('Unable to load notification preferences.', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: NOTIFICATIONS_AVAILABLE ? [] : demoNotifications.map((item) => ({ ...item })),
  preferences: getInitialPreferences(),

  hydrate: async () => {
    if (NOTIFICATIONS_AVAILABLE) set({ notifications: await notificationService.list() });
  },

  markRead: async (id) => {
    if (NOTIFICATIONS_AVAILABLE) await notificationService.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      ),
    }));
  },

  markAllRead: async () => {
    if (NOTIFICATIONS_AVAILABLE) await notificationService.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
    }));
  },

  updatePreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } })),

  savePreferences: () => {
    const preferences = useNotificationStore.getState().preferences;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('discuss_notification_preferences', JSON.stringify(preferences));
    }
  },

  resetPreferences: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'discuss_notification_preferences',
        JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES)
      );
    }
    set({ preferences: DEFAULT_NOTIFICATION_PREFERENCES });
  },
}));
