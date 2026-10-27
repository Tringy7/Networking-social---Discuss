import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ToastContainer from './components/ui/ToastContainer';
import { useAuthStore } from './store/useAuthStore';
import { useToastStore } from './store/useToastStore';
import { useCommunityStore } from './store/useCommunityStore';
import { usePostStore } from './store/usePostStore';

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const clearSession = useAuthStore((state) => state.clearSession);
  const addToast = useToastStore((state) => state.addToast);
  const hydrateCommunities = useCommunityStore((state) => state.hydrate);
  const hydratePosts = usePostStore((state) => state.hydrate);

  React.useEffect(() => {
    let active = true;

    hydrate().catch((error: unknown) => {
      if (active) {
        addToast(
          error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.',
          'error'
        );
      }
    });
    hydrateCommunities().catch((error: unknown) => {
      if (active) {
        addToast(
          error instanceof Error ? error.message : 'Không thể tải danh sách cộng đồng.',
          'error'
        );
      }
    });
    hydratePosts().catch((error: unknown) => {
      if (active) {
        addToast(error instanceof Error ? error.message : 'Không thể tải bài viết.', 'error');
      }
    });

    const handleExpiredSession = (event: Event) => {
      clearSession();
      const detail = (event as CustomEvent<unknown>).detail;
      addToast(
        detail instanceof Error ? detail.message : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'warning'
      );
    };

    window.addEventListener('auth:expired', handleExpiredSession);
    return () => {
      active = false;
      window.removeEventListener('auth:expired', handleExpiredSession);
    };
  }, [addToast, clearSession, hydrate, hydrateCommunities, hydratePosts]);

  return (
    <BrowserRouter>
      <>
        <AppRoutes />
        <ToastContainer />
      </>
    </BrowserRouter>
  );
}
