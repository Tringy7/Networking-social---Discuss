import React, { forwardRef } from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onClear,
      showClear,
      value,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            value={value}
            className={`w-full bg-[var(--bg-surface)] border-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl text-sm transition-all duration-200 outline-none
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon || (showClear && value) ? 'pr-10' : 'pr-3.5'}
              py-3
              ${
                error
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange)] focus:ring-2 focus:ring-[var(--color-orange-soft)]'
              }
              ${className}`}
            {...props}
          />
          {showClear && value && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!showClear && rightIcon && (
            <div className="absolute right-3.5 text-[var(--text-secondary)] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#EF4444] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
