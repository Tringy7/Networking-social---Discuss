import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  compactOnMobile?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  showTagline = false,
  size = 'md',
  className = '',
  onClick,
  compactOnMobile = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-sm font-black',
    md: 'w-9 h-9 text-lg font-black',
    lg: 'w-12 h-12 text-2xl font-black',
  };

  const textSizes = {
    sm: 'text-base font-extrabold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl font-extrabold',
  };

  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="DISCUSS, về trang chủ"
      className={`inline-flex items-center gap-2.5 group select-none whitespace-nowrap ${className}`}
    >
      <div
        className={`rounded-full bg-[var(--color-orange)] text-white flex items-center justify-center shadow-md shadow-[var(--color-orange)]/25 transition-transform duration-200 group-hover:scale-105 shrink-0 ${iconSizes[size]}`}
      >
        <span>D</span>
      </div>
      <div className={`${compactOnMobile ? 'hidden sm:flex' : 'flex'} flex-col text-left`}>
        <div className={`tracking-tight text-white flex items-center ${textSizes[size]}`}>
          <span>DISCUSS</span>
          <span className="text-[var(--color-orange)] ml-0.5">.</span>
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-wider uppercase text-[#9A9DA3] font-medium -mt-1 hidden sm:block">
            Reddit Style Community
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
