import React, { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface EntityBannerProps {
  src?: string;
  alt: string;
  variant: 'user' | 'community';
  position?: CSSProperties['objectPosition'];
  fallback?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Shared cover frame for profiles, communities and settings previews. */
export default function EntityBanner({ src, alt, variant, position = 'center', fallback, children, className = '' }: EntityBannerProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const [loadedSrc, setLoadedSrc] = useState<string>();
  const hasImage = Boolean(src && src !== failedSrc);

  return <div className={`entity-banner entity-banner--${variant} ${hasImage ? '' : 'entity-banner--empty'} ${className}`}>
    {hasImage ? <img
      src={src}
      alt={alt}
      className={`entity-banner-image ${loadedSrc === src ? 'is-loaded' : ''}`}
      style={{ objectPosition: position }}
      onLoad={() => setLoadedSrc(src)}
      onError={() => setFailedSrc(src)}
      decoding="async"
    /> : fallback}
    {children}
  </div>;
}
