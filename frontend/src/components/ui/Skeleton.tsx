import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
}) => {
  const variants = {
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-[var(--radius-control)]',
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-[var(--bg-elevated)] ${variants[variant]} ${className}`}
    />
  );
};

export default Skeleton;
