import React from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { authLoading, authStatus, authError, isAuthenticated, hydrate } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  if (isAuthenticated) return <Outlet />;

  if (authLoading || authStatus === 'initializing') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-orange)]" />
        <p className="text-sm text-[var(--text-secondary)]">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          {authError || 'Không thể xác minh phiên đăng nhập. Vui lòng thử lại.'}
        </p>
        <button
          type="button"
          className="rounded-lg bg-[var(--color-orange)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-orange-hover)]"
          onClick={() => {
            void hydrate().catch((error: unknown) =>
              addToast(
                error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.',
                'error'
              )
            );
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
