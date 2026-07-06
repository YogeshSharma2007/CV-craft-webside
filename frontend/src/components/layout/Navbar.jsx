import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { token, user, logout, adminToken, adminLogout } = useAuthStore();

  const handleUserLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="no-print" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      background: 'rgba(5, 5, 16, 0.75)',
      borderBottom: '1px solid rgba(124, 58, 237, 0.25)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span className="glow-text-purple" style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>
          CV CRAFT
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {adminToken ? (
          <>
            <Link to="/admin" style={{ color: 'var(--neon-blue)', fontSize: '11px', fontFamily: "'Orbitron', sans-serif", textDecoration: 'none', letterSpacing: '1px' }}>
              ADMIN TERMINAL
            </Link>
            <button
              onClick={adminLogout}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '9px' }}
            >
              LOGOUT
            </button>
          </>
        ) : token ? (
          <>
            <Link to="/dashboard" style={{ color: '#fff', fontSize: '11px', fontFamily: "'Orbitron', sans-serif", textDecoration: 'none', letterSpacing: '1px' }}>
              DASHBOARD
            </Link>
            <Link to="/settings" style={{ color: '#fff', fontSize: '11px', fontFamily: "'Orbitron', sans-serif", textDecoration: 'none', letterSpacing: '1px' }}>
              SETTINGS
            </Link>
            <button
              onClick={handleUserLogout}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '9px' }}
            >
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', fontSize: '11px', fontFamily: "'Orbitron', sans-serif", textDecoration: 'none', letterSpacing: '1px' }}>
              LOGIN
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '10px', textDecoration: 'none' }}>
              GET STARTED
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
