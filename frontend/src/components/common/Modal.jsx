import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  closeOnBackdrop = false,
  closeOnEscape = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={closeOnBackdrop ? onClose : undefined} 
        aria-hidden="true" 
      />
      <div className={`relative w-full ${maxWidth} bg-[#1a1a1b] text-[#d7dadc] rounded-2xl shadow-2xl border border-[#343536] overflow-hidden z-10 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#343536] flex items-center justify-between bg-[#16181a]">
          <h3 className="text-base font-bold text-[#d7dadc] truncate">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
