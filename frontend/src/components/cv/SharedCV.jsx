import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CVPreview from './CVPreview';
import ThreeBackground from '../three/ThreeBackground';
import AdBanner from '../ads/AdBanner';
import api from '../../utils/api';

export default function SharedCV() {
  const { token } = useParams();
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedCV = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/cv/share/${token}`);
        setCvData(res.data);
      } catch (err) {
        const errMsg = err.response?.data?.message || 'CV share link is inactive or not found.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchSharedCV();
    }
  }, [token]);

  return (
    <>
      <ThreeBackground />
      
      {/* Header ad banner */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 20px' }}>
        <AdBanner slot="shared-header" />
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '20px auto',
        padding: '0 20px 40px 20px',
        minHeight: '80vh'
      }}>
        {loading ? (
          <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <div className="glow-text-purple" style={{ fontSize: '18px', marginBottom: '10px' }}>COMMUNICATING DATA STREAM</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Retrieving secure CV file...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            border: '1px solid rgba(236, 72, 153, 0.4)'
          }}>
            <div className="glow-text-blue" style={{ color: 'var(--neon-pink)', fontSize: '20px', marginBottom: '10px' }}>
              404 NOT FOUND
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
              {error}
            </p>
            <Link to="/" className="btn btn-primary" style={{ fontSize: '11px', textDecoration: 'none' }}>
              GO HOME
            </Link>
          </div>
        ) : (
          <div>
            {/* Nav back banner */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(10, 10, 34, 0.5)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '8px',
              padding: '12px 20px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                You are viewing a secure profile hosted on <strong>CV Craft</strong>.
              </span>
              <Link 
                to="/" 
                style={{
                  color: 'var(--neon-blue)',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  textDecoration: 'none',
                  border: '1px solid var(--neon-blue)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: 'rgba(59, 130, 246, 0.05)'
                }}
              >
                CREATE YOUR OWN
              </Link>
            </div>

            {/* The protected CV */}
            <CVPreview data={cvData} />

            {/* Bottom ad banner */}
            <div style={{ marginTop: '20px' }}>
              <AdBanner slot="shared-footer" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
