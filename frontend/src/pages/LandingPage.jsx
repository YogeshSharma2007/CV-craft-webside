import React from 'react';
import { Link } from 'react-router-dom';
import ThreeBackground from '../components/three/ThreeBackground';
import AdBanner from '../components/ads/AdBanner';
import useAuthStore from '../context/authStore';

export default function LandingPage() {
  const { token } = useAuthStore();

  return (
    <>
      <ThreeBackground />
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        {/* Main Hero Header */}
        <h1 className="glow-text-purple" style={{
          fontSize: '46px',
          fontWeight: 900,
          letterSpacing: '3px',
          lineHeight: '1.2',
          maxWidth: '800px',
          marginBottom: '20px'
        }}>
          BUILD FUTURISTIC ONE-PAGE DIGITAL PROFILE
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          maxWidth: '550px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Assemble a professional web-viewable CV with real-time particle starfield rendering, content theft blocking, and robust email verification.
        </p>

        {/* CTA Button */}
        <Link 
          to={token ? '/dashboard' : '/login'} 
          className="btn btn-primary"
          style={{
            fontSize: '12px',
            padding: '14px 36px',
            textDecoration: 'none'
          }}
        >
          {token ? 'GO TO DASHBOARD' : 'Make Your Free CV'}
        </Link>

        {/* Ad Banner GA3 */}
        <div style={{ width: '100%', maxWidth: '800px', marginTop: '40px' }}>
          <AdBanner slot="landing-hero" />
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          maxWidth: '1100px',
          width: '100%',
          marginTop: '60px'
        }}>
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div className="glow-text-blue" style={{ fontSize: '16px', marginBottom: '12px' }}>01 / GLOWING NEON LAYOUT</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Designed using high-contrast neon lines, glassmorphic cards, and a dark interstellar canvas backdrop.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div className="glow-text-purple" style={{ fontSize: '16px', marginBottom: '12px' }}>02 / DATA INTENSITY CONTROLS</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Protect logs, toggle public access tokens, and view anonymized visit statistics from one central console.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div className="glow-text-blue" style={{ fontSize: '16px', marginBottom: '12px' }}>03 / SECURITY BLOCK SYSTEM</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Secures source files against page downloads (Ctrl+S), clipboard copy, and blurs document view if DevTools is active.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div className="glow-text-purple" style={{ fontSize: '16px', marginBottom: '12px' }}>04 / DUAL-FACTOR EMAIL OTP</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Optional 2FA verification. Generates cryptographically secure single-use codes delivered directly to your mailbox.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
