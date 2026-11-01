import React, { forwardRef, useId } from 'react';
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
      'aria-describedby': describedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `field-${generatedId}`;
    const messageId = inputId ? `${inputId}-message` : undefined;
    const message = error || helperText;
    const ariaDescribedBy = [describedBy, message ? messageId : undefined].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-[var(--text-primary)]">
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
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={ariaDescribedBy}
            className={`w-full min-h-10 bg-[var(--bg-surface)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-[var(--radius-control)] text-sm transition-[background-color,border-color,box-shadow] duration-[var(--duration-fast)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon || (showClear && value) ? 'pr-10' : 'pr-3.5'}
              py-2
              ${
                error
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                  : 'border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange-ink)]'
              }
              ${className}`}
            {...props}
          />
          {showClear && value && onClear && (
            <button
              type="button"
              onClick={onClear}
                aria-label="Xóa nội dung"
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
          <p id={messageId} className="text-sm text-[var(--color-danger)] font-medium">{error}</p>
        ) : helperText ? (
          <p id={messageId} className="text-sm text-[var(--text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
