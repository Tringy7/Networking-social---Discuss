import React, { cloneElement, useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', className = '' }) => {
  const tooltipId = useId();
  const describedBy = [children.props['aria-describedby'], tooltipId].filter(Boolean).join(' ');
  const trigger = cloneElement(children, { 'aria-describedby': describedBy });

  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {trigger}
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-[70] w-max max-w-56 -translate-x-1/2 rounded-[var(--radius-control)] bg-[var(--text-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--bg-main)] opacity-0 shadow-[var(--surface-shadow)] transition-opacity duration-[var(--duration-fast)] group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${side === 'top' ? 'bottom-[calc(100%+0.5rem)]' : 'top-[calc(100%+0.5rem)]'}`}
      >
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
