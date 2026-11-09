import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] select-none whitespace-nowrap cursor-pointer';

    const sizes = {
      sm: 'min-h-8 text-sm px-3 py-1.5',
      md: 'min-h-10 text-sm px-4 py-2',
      lg: 'min-h-12 text-base px-6 py-3',
    };

    const variants = {
      primary:
        'bg-[var(--action-bg)] hover:bg-[var(--action-hover)] text-[var(--action-ink)]',
      secondary:
        'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-hover)]',
      outline:
        'bg-transparent hover:bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] hover:border-[var(--color-orange-ink)]',
      ghost:
        'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      danger:
        'bg-[var(--color-danger)] hover:brightness-95 text-[var(--color-danger-ink)]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
