import React, { useEffect } from 'react';

export default function AdBanner({ slot = 'default', layout = 'auto', format = 'auto' }) {
  const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT || 'YOUR_GOOGLE_ADS_CLIENT_ID_HERE';

  useEffect(() => {
    try {
      // Trigger AdSense push if script is loaded
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense script not loaded yet or blocked:', e.message);
    }
  }, []);

  return (
    <div 
      className="ad-banner-container no-print" 
      aria-label="Advertisement"
      style={{
        width: '100%',
        margin: '20px auto',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: '90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px'
      }}
    >
      {/* Real AdSense Ins Tag */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '90px' }}
        data-ad-client={adClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>

      {/* Cyberpunk Elegant Preview Placeholder for Dev/Mock Testing */}
      <div style={{
        width: '100%',
        maxWidth: '728px',
        height: '90px',
        background: 'rgba(124, 58, 237, 0.05)',
        border: '1px dashed rgba(124, 58, 237, 0.3)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(124, 58, 237, 0.6)',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '11px',
        letterSpacing: '1.5px',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 1,
        backdropFilter: 'blur(4px)'
      }}>
        <span style={{ fontSize: '8px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.5 }}>Advertisement</span>
        <span>Google AdSense Slot — {slot}</span>
        <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>Client: {adClientId}</span>
      </div>
    </div>
  );
}
