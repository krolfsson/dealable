'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
    // Inaktivera Google Analytics
    window.location.reload();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '540px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(128, 0, 255, 0.15)',
        padding: '1.5rem',
        zIndex: 9999,
        border: '1px solid rgba(168, 85, 247, 0.15)',
        animation: 'slideUp 0.4s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>🍪</span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: '0.35rem',
            }}
          >
            Vi använder cookies
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              color: '#666',
              lineHeight: 1.5,
            }}
          >
            Vi använder cookies för att analysera trafik och förbättra din upplevelse. 
            Genom att klicka &quot;Acceptera&quot; godkänner du vår användning av cookies.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          marginTop: '1rem',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={declineCookies}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: '50px',
            border: '1.5px solid rgba(168, 85, 247, 0.3)',
            background: 'transparent',
            color: '#7c3aed',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Avböj
        </button>
        <button
          onClick={acceptCookies}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: '50px',
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: 'white',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Acceptera ✓
        </button>
      </div>
    </div>
  );
}