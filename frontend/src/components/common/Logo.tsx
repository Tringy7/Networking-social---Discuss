import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  compactOnMobile?: boolean;
}

export default function Logo({ showTagline = false, size = 'md', className = '', onClick, compactOnMobile = false }: LogoProps) {
  return (
    <Link to="/" onClick={onClick} aria-label="DISCUSS, về trang chủ"
      className={`discuss-logo discuss-logo--${size} ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" className="discuss-mark" aria-hidden="true">
        <path d="M3 4h18v16H11l-8 7V4Z" fill="currentColor" />
        <path d="M24 10h5v18l-7-5h-8v-1h10V10Z" fill="currentColor" />
        <path d="M8 10h8M8 14h5" stroke="var(--bg-main)" strokeWidth="2" />
      </svg>
      <span className={compactOnMobile ? 'hidden sm:block' : ''}>
        <span className="discuss-wordmark">DISCUSS<span className="logo-period">.</span></span>
        {showTagline && <span className="logo-tagline">Kết nối qua từng góc nhìn.</span>}
      </span>
    </Link>
  );
}
