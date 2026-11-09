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
      'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none whitespace-nowrap cursor-pointer';

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    const variants = {
      primary:
        'bg-[var(--color-orange)] hover:bg-[var(--color-orange-hover)] text-white shadow-sm hover:shadow-md hover:shadow-[var(--color-orange-soft)] focus-visible:ring-2 focus-visible:ring-[var(--color-orange)]/50',
      secondary:
        'bg-[#1E232F] hover:bg-[#252B3A] text-[#F1F3F7] border border-[#262C3A] hover:border-[#343C4E]',
      outline:
        'bg-transparent hover:bg-[var(--color-orange-soft)] text-[var(--color-orange)] border border-[var(--color-orange)] hover:border-[var(--color-orange-hover)]',
      ghost:
        'bg-transparent hover:bg-[#1E232F] text-[#959DAA] hover:text-[#F1F3F7]',
      danger:
        'bg-[#EF4444] hover:bg-[#DC2626] text-white focus-visible:ring-2 focus-visible:ring-red-500/50',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
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
