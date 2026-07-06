import React, { useEffect, useState } from 'react';

// Custom Glowing SVG Icons
const GitHubIcon = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" style={{ filter: 'drop-shadow(0 0 4px var(--neon-blue))' }}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedInIcon = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" style={{ filter: 'drop-shadow(0 0 4px var(--neon-purple))' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const LocationIcon = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" style={{ filter: 'drop-shadow(0 0 2px var(--neon-blue))', marginRight: '4px', verticalAlign: 'middle' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const PhoneIcon = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" style={{ filter: 'drop-shadow(0 0 2px var(--neon-purple))', marginRight: '4px', verticalAlign: 'middle' }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" style={{ marginLeft: '4px', verticalAlign: 'middle', opacity: 0.8 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

export default function CVPreview({ data }) {
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  // Content Protection Handlers
  useEffect(() => {
    // 1. Right Click Prevent
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Keyboard shortcut blocks
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && ['c', 'p', 's', 'a', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 3. Copy prevent
    const handleCopy = (e) => e.preventDefault();
    document.addEventListener('copy', handleCopy);

    // 4. DevTools Detection (Blur mechanism)
    const devtoolsThreshold = 160;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > devtoolsThreshold;
      const heightThreshold = window.outerHeight - window.innerHeight > devtoolsThreshold;
      if (widthThreshold || heightThreshold) {
        setDevtoolsOpen(true);
      } else {
        setDevtoolsOpen(false);
      }
    };

    window.addEventListener('resize', checkDevTools);
    // Periodically run check
    const interval = setInterval(checkDevTools, 1000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(interval);
    };
  }, []);

  if (!data || (!data.name && !data.bio)) {
    return (
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        borderStyle: 'dashed'
      }}>
        <div className="glow-text-blue" style={{ fontSize: '18px', marginBottom: '10px' }}>COMPILING TERMINAL ACTIVE</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>
          Fill in the details in the CV Creator console to assemble your futuristic digital CV here.
        </p>
      </div>
    );
  }

  // Parse photo absolute URL
  const photoUrl = data.photo_url
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/${data.photo_url}`
    : '';

  return (
    <div 
      className={`cv-protected glass-panel ${devtoolsOpen ? 'devtools-detected' : ''}`}
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0 0 25px rgba(124, 58, 237, 0.15)',
        border: '1px solid rgba(124, 58, 237, 0.35)',
        padding: '40px'
      }}
    >
      {/* Print blocked overlay */}
      <div className="no-print-overlay">
        <h2>SECURITY ALERT</h2>
        <p>Printing or exporting this CV is not allowed by the publisher.</p>
        <p style={{ fontSize: '12px', marginTop: '10px', color: 'var(--neon-pink)' }}>cvcraft.com protection</p>
      </div>

      {/* Floating CSS Watermark */}
      <div className="watermark-overlay"></div>
      <div className="watermark-text">CVCRAFT.COM</div>

      {/* Header section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        marginBottom: '30px'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 className="glow-text-purple" style={{ fontSize: '32px', marginBottom: '8px', letterSpacing: '2px' }}>
            {data.name || 'YOUR NAME'}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            lineHeight: '1.6',
            marginBottom: '16px',
            textAlign: 'justify'
          }}>
            {data.bio || 'Your professional statement and career objectives...'}
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            {data.address && (
              <span>
                <LocationIcon />
                {data.address}
              </span>
            )}
            {data.phone && (
              <span>
                <PhoneIcon />
                {data.phone}
              </span>
            )}
          </div>
        </div>

        {/* Profile Image with Glowing Border */}
        {photoUrl && (
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            padding: '4px',
            background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-blue))',
            boxShadow: '0 0 15px var(--neon-purple-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#050510'
            }}>
              <img 
                src={photoUrl} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(data.github_url || data.linkedin_url) && (
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '30px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(124, 58, 237, 0.15)'
        }}>
          {data.github_url && (
            <a 
              href={data.github_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--neon-blue)',
                textDecoration: 'none',
                fontSize: '12px',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              <GitHubIcon />
              GITHUB
            </a>
          )}
          {data.linkedin_url && (
            <a 
              href={data.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--neon-purple)',
                textDecoration: 'none',
                fontSize: '12px',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              <LinkedInIcon />
              LINKEDIN
            </a>
          )}
        </div>
      )}

      {/* Section: Skills */}
      {data.skills && data.skills.length > 0 && (
        <div style={{ marginBottom: '35px' }}>
          <h3 className="glow-text-blue" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>
            SKILLS INDEX
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {data.skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontFamily: "'Orbitron', sans-serif",
                  padding: '5px 12px',
                  borderRadius: '4px',
                  boxShadow: '0 0 6px rgba(124, 58, 237, 0.1)'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section: Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '35px' }}>
          <h3 className="glow-text-purple" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>
            EXPERIENCE LOG
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid rgba(59, 130, 246, 0.3)', paddingLeft: '20px', marginLeft: '10px' }}>
            {data.experience.map((exp, index) => (
              <div key={index} style={{ position: 'relative' }}>
                {/* Timeline node dot */}
                <div style={{
                  position: 'absolute',
                  left: '-26px',
                  top: '4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--neon-blue)',
                  boxShadow: '0 0 6px var(--neon-blue-glow)'
                }}></div>
                
                <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                  {exp.role} <span style={{ color: 'var(--neon-blue)', fontWeight: 400 }}>@ {exp.company}</span>
                </h4>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Orbitron', sans-serif", margin: '4px 0 8px 0' }}>
                  {exp.duration}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', textAlign: 'justify' }}>
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: '35px' }}>
          <h3 className="glow-text-blue" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>
            DEPLOYED PROJECTS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {data.projects.map((proj, index) => (
              <div 
                key={index}
                style={{
                  padding: '16px',
                  background: 'rgba(10, 10, 34, 0.4)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'border-color 0.2s ease-in-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#fff', fontFamily: "'Orbitron', sans-serif" }}>{proj.name}</h4>
                  {proj.link && (
                    <a 
                      href={proj.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--neon-blue)', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                      <ExternalLinkIcon />
                    </a>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 className="glow-text-purple" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>
            ACADEMIC HISTORY
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.education.map((edu, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(124, 58, 237, 0.1)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{edu.degree}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{edu.institution}</p>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--neon-purple)', fontFamily: "'Orbitron', sans-serif" }}>
                  {edu.year}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
