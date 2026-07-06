import React, { useState, useEffect } from 'react';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function OTPModal({ tempToken, onVerifySuccess, onCancel }) {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer cooldown logic
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        tempToken,
        otp
      });
      toast.success('Login verified successfully!');
      onVerifySuccess(res.data.token, res.data.user);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP code.';
      toast.error(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await api.post('/auth/resend-otp', { tempToken });
      toast.success(res.data.message || 'OTP resent successfully!');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error resending OTP.';
      toast.error(errMsg);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(5, 5, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '420px',
        border: '1px solid var(--neon-purple)',
        boxShadow: '0 0 20px var(--neon-purple-glow)',
        padding: '30px',
        textAlign: 'center'
      }}>
        <h3 className="glow-text-purple" style={{ fontSize: '18px', marginBottom: '10px' }}>
          2FA VERIFICATION REQUIRED
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: '24px' }}>
          We have dispatched a 6-digit verification code to your registered email address. Enter the code below to sign in.
        </p>

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span style={{ margin: '0 4px', color: 'var(--neon-purple)' }}>-</span>}
              renderInput={(props) => <input {...props} />}
              inputStyle={{
                width: '40px',
                height: '45px',
                fontSize: '18px',
                background: 'rgba(5, 5, 16, 0.9)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: '6px',
                color: '#fff',
                textAlign: 'center',
                outline: 'none',
                fontFamily: "'Orbitron', sans-serif"
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '11px' }}
            >
              {verifying ? 'VERIFYING SECURITY KEY...' : 'VERIFY CODE'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--neon-blue)',
                  fontSize: '11px',
                  fontFamily: "'Orbitron', sans-serif",
                  cursor: resendCooldown > 0 ? 'default' : 'pointer'
                }}
              >
                {resendCooldown > 0 ? `RESEND IN ${resendCooldown}s` : 'RESEND OTP'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--neon-pink)',
                  fontSize: '11px',
                  fontFamily: "'Orbitron', sans-serif",
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
