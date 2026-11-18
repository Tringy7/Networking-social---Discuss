import React from 'react';
import { MotionConfig } from 'framer-motion';
import { useSettingsStore } from './store/useSettingsStore';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ToastContainer from './components/ui/ToastContainer';
import { useAuthStore } from './store/useAuthStore';
import { useToastStore } from './store/useToastStore';

export default function App() {
  const animationIntensity = useSettingsStore((state) => state.settings.animationIntensity);
  const clearSession = useAuthStore((state) => state.clearSession);
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const addToast = useToastStore((state) => state.addToast);

  React.useEffect(() => {
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
      window.removeEventListener('auth:expired', handleExpiredSession);
    };
  }, [addToast, clearSession]);

  React.useEffect(() => {
    void initializeSession();
  }, [initializeSession]);


  return (
    <MotionConfig reducedMotion={animationIntensity === 'full' ? 'user' : 'always'}>
    <BrowserRouter>
      <>
        {authStatus === 'INITIALIZING' ? (
          <main
            className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] text-sm text-[var(--text-secondary)]"
            role="status"
            aria-live="polite"
          >
            Đang khôi phục phiên đăng nhập...
          </main>
        ) : (
          <AppRoutes />
        )}
        <ToastContainer />
      </>
    </BrowserRouter>
    </MotionConfig>
  );
}
