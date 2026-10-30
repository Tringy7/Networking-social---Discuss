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

  const accents = {
    success: 'bg-[var(--toast-success)]',
    error: 'bg-[var(--toast-error)]',
    warning: 'bg-[var(--toast-warning)]',
    info: 'bg-[var(--toast-info)]',
  };

  return (
    <div
      className="pointer-events-none fixed right-3 top-20 z-[100] flex w-[calc(100%-1.5rem)] max-w-xs flex-col gap-2 sm:right-5 sm:top-20"
      aria-live="polite"
      aria-relevant="additions"
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
            className={`semantic-toast semantic-toast--${toast.type} pointer-events-auto relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 shadow-[var(--toast-shadow)]`}
            style={{
              backgroundColor: 'var(--toast-bg)',
              borderColor: 'var(--toast-border)',
              color: 'var(--toast-text)',
            }}
          >
            <span className={`absolute inset-y-0 left-0 w-0.5 ${accents[toast.type]}`} />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--toast-icon-bg)]">
              {icons[toast.type]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="toast-label">{labels[toast.type]}</p>
              <p className="break-words text-sm font-medium leading-snug text-[var(--toast-text)]">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
