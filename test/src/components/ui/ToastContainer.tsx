import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />,
    error: <AlertCircle className="w-4 h-4 text-[#EF4444]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
    info: <Info className="w-4 h-4 text-[#3B82F6]" />,
  };

  const borders = {
    success: 'border-[#22C55E]/40',
    error: 'border-[#EF4444]/40',
    warning: 'border-[#F59E0B]/40',
    info: 'border-[#3B82F6]/40',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#191A1C]/95 backdrop-blur-md border ${
              borders[toast.type]
            } shadow-xl shadow-black/40 text-xs text-[#F5F5F5]`}
          >
            <div className="flex items-center gap-2.5">
              <span className="shrink-0">{icons[toast.type]}</span>
              <p className="font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#70747C] hover:text-[#F5F5F5] p-1 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
