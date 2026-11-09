import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  const shouldReduceMotion = useReducedMotion();
  const labels = { success: 'Thành công', error: 'Có lỗi xảy ra', warning: 'Cần chú ý', info: 'Thông tin' };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-[var(--toast-success)]" />,
    error: <AlertCircle className="h-5 w-5 text-[var(--toast-error)]" />,
    warning: <AlertTriangle className="h-5 w-5 text-[var(--toast-warning)]" />,
    info: <Info className="h-5 w-5 text-[var(--toast-info)]" />,
  };

  return (
    <div
      className="toast-viewport"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={shouldReduceMotion ? false : { opacity: 0, x: 16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: shouldReduceMotion ? 0 : 0.12 } }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            className={`semantic-toast semantic-toast--${toast.type}`}
          >
            <span className="toast-status-icon" aria-hidden="true">
              {icons[toast.type]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="toast-label">{labels[toast.type]}</p>
              <p className="toast-message">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              type="button"
              className="toast-close"
              aria-label="Đóng thông báo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
