import React from 'react';
import AdBanner from '../ads/AdBanner';

export default function Footer() {
  return (
    <footer className="no-print" style={{
      marginTop: 'auto',
      borderTop: '1px solid rgba(124, 58, 237, 0.15)',
      background: 'rgba(5, 5, 16, 0.9)',
      padding: '20px 40px 40px 40px',
      textAlign: 'center',
      zIndex: 10
    }}>
      {/* Footer Banner ad */}
      <div style={{ maxWidth: '800px', margin: '0 auto 20px auto' }}>
        <AdBanner slot="footer-banner" />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>
        <span>&copy; 2026 CV CRAFT. PROJECT FILE ENCRYPTED.</span>
        <span style={{ fontFamily: "'Orbitron', sans-serif" }}>
          POWERED BY <strong style={{ color: 'var(--neon-purple)' }}>NODE + SQLITE</strong>
        </span>
      </div>
    </footer>
  );
}
