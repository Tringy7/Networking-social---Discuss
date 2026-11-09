import React, { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID
  ;

export default function GoogleSignInButton({ onCredential, text = 'signin_with', disabled = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let checkInterval = null;

    const renderGsiButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential && onCredential) {
              onCredential(response.credential);
            }
          },
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: 360,
          logo_alignment: 'left',
        });
        return true;
      } catch (err) {
        console.error('Lỗi khởi tạo Google Sign-In:', err);
        return false;
      }
    };

    if (!renderGsiButton()) {
      checkInterval = setInterval(() => {
        if (renderGsiButton()) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [text, onCredential]);

  return (
    <div className={`w-full flex justify-center items-center min-h-[44px] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}
