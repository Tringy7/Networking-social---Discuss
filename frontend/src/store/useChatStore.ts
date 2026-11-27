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
  update: { sequence: number; id: number };
  connect: () => () => void;
  refresh: () => Promise<void>;
  clear: () => void;
}>(set => {
  let revision = 0;
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
    update: { sequence: 0, id: 0 },
    connect: () => {
      let stream: EventSource;
      let timer: number | undefined;
      let delay = 1000;
      let active = true;
      const refresh = () => useChatStore.getState().refresh();
      const sync = (id: number) => {
        void refresh().catch(() => {});
        set(state => ({ update: { sequence: state.update.sequence + 1, id } }));
      };
      const open = () => {
        stream = chatService.subscribeToChatEvents();
        stream.addEventListener('ready', () => {
          delay = 1000;
          set({ connection: 'connected' });
          sync(0);
        });
        stream.addEventListener('chat', event => sync(Number((event as MessageEvent<string>).data)));
        stream.onerror = () => {
          stream.close();
          if (!active || timer !== undefined) return;
          set({ connection: 'disconnected' });
          timer = window.setTimeout(async () => {
            try { await refresh(); } catch { /* Wait for the next reconnect attempt. */ }
            timer = undefined;
            delay = Math.min(delay * 2, 30_000);
            if (active) open();
          }, delay);
        };
      };
      open();
      void refresh().catch(() => {});
      return () => {
        active = false;
        window.clearTimeout(timer);
        stream.close();
      };
    },
    refresh: async () => {
      const request = ++revision;
      const threads = await chatService.listConversations();
      if (request === revision) set({ threads });
    },
    clear: () => {
      revision++;
      set({ threads: [], window: 'closed', target: {}, connection: 'connecting', update: { sequence: 0, id: 0 } });
    },
  };
});
