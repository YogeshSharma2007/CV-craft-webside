import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ThreeBackground from '../components/three/ThreeBackground';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

export default function Settings() {
  const { user, update2FASettings } = useAuthStore();
  
  // States
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/user/settings');
      setTwoFaEnabled(res.data.twoFaEnabled);
      update2FASettings(res.data.twoFaEnabled);
    } catch (err) {
      toast.error('Failed to load user settings.');
    }
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    try {
      const endpoint = twoFaEnabled ? '/user/2fa/disable' : '/user/2fa/enable';
      const res = await api.post(endpoint);
      toast.success(res.data.message);
      setTwoFaEnabled(!twoFaEnabled);
      update2FASettings(!twoFaEnabled);
    } catch (err) {
      toast.error('Failed to update 2FA configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(newPassword)) {
      toast.error('New password must contain at least 8 characters, one uppercase, one lowercase and one number.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/user/change-password', {
        currentPassword,
        newPassword
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to update password.';
      toast.error(errMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <ThreeBackground />
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px 80px 20px',
        minHeight: '80vh'
      }}>
        <h1 className="glow-text-purple" style={{ fontSize: '24px', marginBottom: '8px' }}>USER SECURITY CONFIG</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '30px' }}>
          Configure login authentications, passwords, and two-factor options
        </p>

        {/* 2FA Configuration Panel */}
        <div className="glass-panel" style={{
          marginBottom: '24px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)'
        }}>
          <h3 className="glow-text-blue" style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Two-Factor Authentication (2FA)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: '20px' }}>
            Elevate account protection. When active, logins will request a single-use numeric code delivered to your registered mailbox.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              Status: <span style={{ color: twoFaEnabled ? 'var(--neon-blue)' : 'var(--neon-pink)' }}>
                {twoFaEnabled ? 'ACTIVE (SECURED)' : 'INACTIVE (STANDARD)'}
              </span>
            </span>
            <button
              onClick={handleToggle2FA}
              disabled={loading}
              className="btn btn-primary"
              style={{
                fontSize: '10px',
                padding: '8px 16px',
                background: twoFaEnabled ? 'linear-gradient(135deg, var(--neon-pink), var(--neon-purple))' : ''
              }}
            >
              {loading ? 'PROCESSING...' : twoFaEnabled ? 'DEACTIVATE 2FA' : 'ACTIVATE 2FA'}
            </button>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="glass-panel">
          <h3 className="glow-text-purple" style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
            Change Account Password
          </h3>
          
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
                style={{
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.9)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                style={{
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.9)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                style={{
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.9)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary"
              style={{
                marginTop: '10px',
                fontSize: '11px',
                opacity: passwordLoading ? 0.7 : 1
              }}
            >
              {passwordLoading ? 'UPDATING KEY...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
