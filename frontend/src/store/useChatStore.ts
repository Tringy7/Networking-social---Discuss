import { create } from 'zustand';
import { chatService, type ChatThread } from '../services/chatService';

export const useChatStore = create<{
  threads: ChatThread[];
  window: 'closed' | 'open' | 'minimized';
  target: Record<string, string>;
  launch: number;
  connection: 'connecting' | 'connected' | 'disconnected';
  openWindow: (peer?: string) => void;
  minimizeWindow: () => void;
  closeWindow: () => void;
  selectTarget: (target: Record<string, string>) => void;
  update: { sequence: number; id: number; latestOnly: boolean };
  connect: () => () => void;
  refresh: () => Promise<void>;
  clear: () => void;
}>(set => {
  let revision = 0;
  let fullRefresh: Promise<void> | undefined;
  return {
    threads: [],
    window: 'closed',
    target: {},
    launch: 0,
    connection: 'connecting',
    openWindow: peer => set(state => ({ window: 'open', target: peer ? { to: peer } : state.target, launch: state.launch + (peer ? 1 : 0) })),
    minimizeWindow: () => set({ window: 'minimized' }),
    closeWindow: () => set(state => ({ window: 'closed', target: {}, launch: state.launch + 1 })),
    selectTarget: target => set({ target }),
    update: { sequence: 0, id: 0, latestOnly: false },
    connect: () => {
      let stream: EventSource;
      let timer: number | undefined;
      let delay = 1000;
      let syncTimer: number | undefined;
      const pendingIds = new Set<number>();
      const pendingHistory = new Set<number>();
      let latestOnly = true;
      let refreshing = false;
      let active = true;
      const refresh = () => useChatStore.getState().refresh();
      const scheduleSync = () => {
        if (!active || refreshing || syncTimer !== undefined || pendingIds.size === 0) return;
        syncTimer = window.setTimeout(async () => {
          syncTimer = undefined;
          const ids = [...pendingIds];
          pendingIds.clear();
          const historyIds = [...pendingHistory];
          const newestOnly = latestOnly;
          pendingHistory.clear();
          latestOnly = true;
          refreshing = true;
          if (historyIds.length) {
            const id = historyIds.length === 1 ? historyIds[0] : 0;
            set(state => ({ update: { sequence: state.update.sequence + 1, id, latestOnly: newestOnly } }));
          }
          try {
            if (ids.includes(0)) {
              await refresh();
            } else {
              await fullRefresh?.catch(() => {});
              if (!active) return;
              const request = revision;
              const refreshThread = async (id: number) => {
                const thread = await chatService.getConversation(id).catch(error => {
                  if (!active || request !== revision) throw error;
                  return chatService.getConversation(id);
                });
                if (active && request === revision) {
                  set(state => ({
                    threads: [...state.threads.filter(item => item.id !== id), thread]
                      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id),
                  }));
                }
              };
              await Promise.allSettled(ids.map(refreshThread));
            }
          } catch {
            // A later event or reconnect will reconcile the chat list.
          } finally {
            refreshing = false;
            scheduleSync();
          }
        }, 150);
      };
      const sync = (id: number, kind: 'history' | 'message' | 'read' = 'history') => {
        pendingIds.add(id);
        if (kind !== 'read') pendingHistory.add(id);
        if (kind === 'history') latestOnly = false;
        scheduleSync();
      };
      const open = () => {
        stream = chatService.subscribeToChatEvents();
        stream.addEventListener('ready', () => {
          delay = 1000;
          set({ connection: 'connected' });
          sync(0);
        });
        stream.addEventListener('chat', event => sync(Number((event as MessageEvent<string>).data)));
        stream.addEventListener('chat-message', event => sync(Number((event as MessageEvent<string>).data), 'message'));
        stream.addEventListener('chat-read', event => sync(Number((event as MessageEvent<string>).data), 'read'));
        stream.onerror = () => {
          stream.close();
          if (!active || timer !== undefined) return;
          set({ connection: 'disconnected' });
          timer = window.setTimeout(async () => {
            delay = Math.min(delay * 2, 30_000);
            try {
              // EventSource hides HTTP status. The authenticated request refreshes expired cookies via apiClient.
              await refresh();
            } catch {
              // The stream will retry after backoff if connectivity is still unavailable.
            } finally {
              timer = undefined;
              if (active) open();
            }
          }, delay);
        };
      };
      open();
      void refresh().catch(() => {});
      return () => {
        active = false;
        window.clearTimeout(timer);
        window.clearTimeout(syncTimer);
        stream.close();
      };
    },
    refresh: () => {
      const request = ++revision;
      const loading = chatService.listConversations().then(threads => {
        if (request === revision) set({ threads });
      }).finally(() => {
        if (fullRefresh === loading) fullRefresh = undefined;
      });
      fullRefresh = loading;
      return loading;
    },
    clear: () => {
      revision++;
      fullRefresh = undefined;
      set({ threads: [], window: 'closed', target: {}, connection: 'connecting', update: { sequence: 0, id: 0, latestOnly: false } });
    },
  };
});
