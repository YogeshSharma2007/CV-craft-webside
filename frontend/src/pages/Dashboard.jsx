import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ThreeBackground from '../components/three/ThreeBackground';
import CVForm from '../components/cv/CVForm';
import CVPreview from '../components/cv/CVPreview';
import AdBanner from '../components/ads/AdBanner';
import api from '../utils/api';

export default function Dashboard() {
  const [cvData, setCvData] = useState(null);
  const [shareInfo, setShareInfo] = useState({ shareToken: '', shareEnabled: false });
  const [shareViewsCount, setShareViewsCount] = useState(0);

  // Fetch CV and Share records on load
  useEffect(() => {
    fetchCVData();
    fetchShareInfo();
  }, []);

  const fetchCVData = async () => {
    try {
      const res = await api.get('/cv/me');
      if (res.data) {
        setCvData(res.data);
      }
    } catch (err) {
      console.log('Starting with empty CV dataset.');
    }
  };

  const fetchShareInfo = async () => {
    try {
      const res = await api.get('/cv/me/share-info');
      setShareInfo(res.data);
      
      // Let's also check if there is CV views logged
      const cvRes = await api.get('/cv/me');
      if (cvRes.data) {
        // Find views count from user statistics (or default to mock/real calculation)
        // Wait, let's query backend or fall back
      }
    } catch (err) {
      console.log('No share information fetched.');
    }
  };

  const handleToggleShare = async () => {
    try {
      const newEnabledState = !shareInfo.shareEnabled;
      const res = await api.post('/cv/me/toggle-share', { share_enabled: newEnabledState });
      setShareInfo({ ...shareInfo, shareEnabled: res.data.shareEnabled });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update share preferences.');
    }
  };

  const handleCopyLink = () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000';
    const link = `${siteUrl}/cv/share/${shareInfo.shareToken}`;
    
    navigator.clipboard.writeText(link)
      .then(() => toast.success('Share link copied to clipboard!'))
      .catch(() => toast.error('Could not copy link. Copy manually: ' + link));
  };

  return (
    <>
      <ThreeBackground />
      
      {/* Top Banner placement */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 20px 0 20px' }}>
        <AdBanner slot="dashboard-header" />
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px 20px 60px 20px'
      }}>
        {/* Sharing Console Panel */}
        <div className="glass-panel" style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)'
        }}>
          <div>
            <h3 className="glow-text-blue" style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              PROFILE TRANSMISSION STATUS
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
              {shareInfo.shareEnabled 
                ? 'Your profile is broadcasting live. Copy key link to share.' 
                : 'Broadcasting is inactive. Your CV profile is private.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {shareInfo.shareEnabled && (
              <button 
                onClick={handleCopyLink} 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '10px' }}
              >
                COPY SHARE LINK
              </button>
            )}

            <button
              onClick={handleToggleShare}
              className="btn btn-primary"
              style={{ 
                padding: '8px 16px', 
                fontSize: '10px',
                background: shareInfo.shareEnabled ? 'linear-gradient(135deg, var(--neon-pink), var(--neon-purple))' : ''
              }}
            >
              {shareInfo.shareEnabled ? 'DISABLE SHARING' : 'ENABLE SHARING'}
            </button>
          </div>
        </div>

        {/* Form & Live Preview Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          {/* Creator form */}
          <div>
            <CVForm onSaveSuccess={() => { fetchCVData(); fetchShareInfo(); }} />
          </div>

          {/* Compiled Live Preview */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <h3 className="glow-text-purple" style={{ 
              fontSize: '13px', 
              letterSpacing: '1.5px', 
              marginBottom: '12px', 
              textTransform: 'uppercase',
              textAlign: 'center'
            }}>
              LIVE COMPILED PREVIEW
            </h3>
            <CVPreview data={cvData} />
          </div>
        </div>
      </div>
    </>
  );
}
