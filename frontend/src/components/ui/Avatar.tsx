import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  shape = 'circle',
  className = '',
  isOnline,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-3xl font-bold',
  };

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-card)]';
  const initials = alt
    ? alt
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'D';

  return (
    <div className={`relative inline-block shrink-0 ${sizes[size]} ${rounded} ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={`block w-full h-full object-cover border-0 ${rounded}`}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] font-semibold ${rounded}`}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-main)] ${
            isOnline ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]'
          }`}
        />
      )}
    </div>
  );
};

export default Avatar;
