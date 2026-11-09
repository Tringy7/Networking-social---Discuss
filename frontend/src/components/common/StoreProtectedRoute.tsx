import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const StoreProtectedRoute: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authStatus = useAuthStore((state) => state.authStatus);
  const retrySessionInitialization = useAuthStore((state) => state.retrySessionInitialization);

  if (isAuthenticated) return <Outlet />;
  if (authStatus === 'INITIALIZING') {
    return (
      <div className="py-24 text-center text-sm text-[var(--text-secondary)]">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }
  if (authStatus === 'ERROR') {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Không thể kết nối để xác minh phiên đăng nhập.
        </p>
        <button
          type="button"
          onClick={() => void retrySessionInitialization()}
          className="rounded-full bg-[var(--color-orange)] px-4 py-2 text-sm font-semibold text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default StoreProtectedRoute;
