import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ThreeBackground from '../components/three/ThreeBackground';
import OTPModal from '../components/auth/OTPModal';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

export default function AuthPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin, adminLogin: storeAdminLogin } = useAuthStore();

  const isRegister = location.pathname === '/register';
  const isAdmin = location.pathname === '/admin/login';

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA variables
  const [showOTP, setShowOTP] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // Validation checks
        if (password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
          toast.error('Password requirements: min 8 characters, with 1 uppercase, 1 lowercase and 1 number.');
          setLoading(false);
          return;
        }

        const res = await api.post('/auth/register', { email, password });
        toast.success(res.data.message || 'Registration complete! You can now log in.');
        navigate('/login');
      } else if (isAdmin) {
        // Admin log in
        const res = await api.post('/auth/admin/login', { username, password });
        storeAdminLogin(res.data.token, res.data.admin);
        toast.success('Admin connection established.');
        navigate('/admin');
      } else {
        // Standard user login
        const res = await api.post('/auth/login', { email, password });
        
        if (res.data.otpRequired) {
          setTempToken(res.data.tempToken);
          setShowOTP(true);
        } else {
          storeLogin(res.data.token, res.data.user);
          toast.success('Successfully authenticated.');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerifySuccess = (token, user) => {
    setShowOTP(false);
    storeLogin(token, user);
    navigate('/dashboard');
  };

  return (
    <>
      <ThreeBackground />

      {/* OTP verification overlays if triggered */}
      {showOTP && (
        <OTPModal
          tempToken={tempToken}
          onVerifySuccess={handleOTPVerifySuccess}
          onCancel={() => setShowOTP(false)}
        />
      )}

      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '650px',
          minHeight: '480px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 0 15px var(--neon-purple-glow)'
        }}>
          <h2 className="glow-text-purple" style={{
  fontSize: '18px',
  textAlign: 'center',
  marginBottom: '12px',
  letterSpacing: '1.5px'
}}>
  {isRegister ? 'ASSEMBLE BRAND PROFILE' : isAdmin ? 'ADMIN TERMINAL AUTH' : 'Create your CV from login'}
</h2>
<p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px', fontSize: '13px' }}>
  Welcome to CV Craft – a premium platform to build, share, and manage your professional CV effortlessly.
</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isAdmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Admin Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. you@domain.com"
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
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Security Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '10px',
                fontSize: '11px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'RUNNING CIPHER CONFLICT...' : isRegister ? 'COMPILE ACCOUNT' : 'DECRYPT LOGIN'}
            </button>
          </form>

          {/* Helper navigation links */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '16px'
          }}>
            {isAdmin ? (
              <Link to="/login" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>
                Return to standard login panel
              </Link>
            ) : isRegister ? (
              <span>
                Already registered?{' '}
                <Link to="/login" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>
                  Decrypt Login
                </Link>
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span>
                  New to platform?{' '}
                  <Link to="/register" style={{ color: 'var(--neon-purple)', textDecoration: 'none' }}>
                    Assemble Profile
                  </Link>
                </span>
                <Link to="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '9px', textTransform: 'uppercase' }}>
                  System Administrator Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
