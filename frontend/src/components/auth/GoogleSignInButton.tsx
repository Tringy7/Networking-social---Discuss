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
              theme: 'filled_black';
              size: 'large';
              text: 'signin_with';
              shape: 'pill';
              width: number;
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
  const [configurationError, setConfigurationError] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setConfigurationError(true);
      return;
    }

    let interval: number | undefined;
    const renderButton = () => {
      const googleIdentity = window.google?.accounts.id;
      const container = containerRef.current;
      if (!googleIdentity || !container) return false;

      googleIdentity.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
      });
      container.replaceChildren();
      googleIdentity.renderButton(container, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: Math.min(container.clientWidth || 360, 360),
      });
      return true;
    };

    if (!renderButton()) {
      interval = window.setInterval(() => {
        if (renderButton() && interval !== undefined) {
          window.clearInterval(interval);
        }
      }, 200);
    }

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [onCredential]);

  if (configurationError) {
    return (
      <p className="text-center text-xs text-[var(--text-secondary)]">
        Đăng nhập Google cần cấu hình <code>VITE_GOOGLE_CLIENT_ID</code>.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-11 w-full flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    />
  );
};

export default GoogleSignInButton;
