import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'article' | 'div' | 'section';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  as = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) => React.createElement(
  as,
  {
    ...props,
    className: [
      'rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
      interactive && 'transition-[background-color,border-color] duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)]',
      className,
    ].filter(Boolean).join(' '),
  },
  children
);

export default Card;
