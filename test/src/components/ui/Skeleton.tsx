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
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-[#222426] border border-[#303235]/40 ${variants[variant]} ${className}`}
    />
  );
};

export default Skeleton;
