import React, { useEffect, useRef, useState } from 'react';

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type: 'standard';
              theme: 'outline' | 'filled_black';
              size: 'large';
              text: 'signin_with';
              shape: 'rectangular';
              width: number;
              locale: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onCredential: (credential: string) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  disabled = false,
  onCredential,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const disabledRef = useRef(disabled);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatus('unavailable');
      return;
    }

    let initialized = false;
    let lastWidth = 0;
    let lastDark: boolean | undefined;
    const renderButton = () => {
      const googleIdentity = window.google?.accounts.id;
      const container = containerRef.current;
      if (!googleIdentity || !container) return false;

      const width = Math.min(Math.floor(container.clientWidth), 400);
      if (width <= 0) return false;
      const dark = document.documentElement.classList.contains('dark');
      if (!initialized) {
        googleIdentity.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential && !disabledRef.current) onCredential(response.credential);
          },
        });
        initialized = true;
      }
      if (width === lastWidth && dark === lastDark) return true;
      lastWidth = width;
      lastDark = dark;
      container.replaceChildren();
      googleIdentity.renderButton(container, {
        type: 'standard',
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width,
        locale: 'vi',
      });
      setStatus('ready');
      return true;
    };

    const interval = window.setInterval(() => {
      if (renderButton()) window.clearInterval(interval);
    }, 200);
    renderButton();
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!initialized) setStatus('unavailable');
    }, 12000);
    const resizeObserver = new ResizeObserver(renderButton);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    const themeObserver = new MutationObserver(renderButton);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [onCredential]);

  return (
    <div className="auth-social" aria-disabled={disabled} inert={disabled}>
      <div ref={containerRef} className="w-full flex justify-center" style={status === 'unavailable' ? { display: 'none' } : undefined} />
      {status !== 'ready' && (
        <p role="status" className="auth-social-message">
          {status === 'loading' ? 'Đang tải đăng nhập Google…' : 'Đăng nhập Google hiện chưa khả dụng. Vui lòng dùng tên đăng nhập.'}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
