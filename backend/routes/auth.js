import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import db from '../db/database.js';
import { sendOTPEmail, sendLoginAlertEmail } from '../services/mailer.js';

const router = express.Router();

// Rate limiter for auth endpoints: max 10 requests per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to check for new IP or Device/User-Agent
const checkLoginAlert = async (user, currentIp, currentUA) => {
  const anonymizeIp = (ip) => {
    if (!ip) return '0.0.0.0';
    if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1';
    // Anonymize last octet for IPv4 or block for IPv6
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return ip.substring(0, 15) + '...';
  };

  const currentAnonIp = anonymizeIp(currentIp);
  const lastAnonIp = anonymizeIp(user.last_login_ip);

  let isNewIp = user.last_login_ip && currentAnonIp !== lastAnonIp;
  let isNewUA = false;

  // Query previous alerts or check UA history
  if (user.last_login_ip) {
    const prevAlert = db.prepare('SELECT user_agent FROM login_alerts WHERE user_id = ? ORDER BY alerted_at DESC LIMIT 1').get(user.id);
    if (prevAlert && prevAlert.user_agent !== currentUA) {
      isNewUA = true;
    } else if (!prevAlert && currentUA) {
      // First UA record, let's say it's fine, or check if it differs from typical
    }
  }

  if (isNewIp || isNewUA) {
    const alertId = 'alert-' + Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO login_alerts (id, user_id, ip_address, user_agent, is_new_device) VALUES (?, ?, ?, ?, ?)')
      .run(alertId, user.id, currentAnonIp, currentUA || 'Unknown', (isNewIp || isNewUA) ? 1 : 0);

    // Send email alert
    await sendLoginAlertEmail(user.email, currentAnonIp, currentUA || 'Unknown Browser');
  }
};

// 1. User Register
router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 12);
      const userId = 'usr-' + Math.random().toString(36).substr(2, 9);

      // Insert User
      db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)')
        .run(userId, email, hashedPassword);

      // Initialize empty CV for this user
      const cvId = 'cv-' + Math.random().toString(36).substr(2, 9);
      const shareToken = 'token-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
      
      db.prepare(`
        INSERT INTO cv_data (id, user_id, name, address, phone, bio, skills, projects, experience, education, share_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        cvId,
        userId,
        '', // Name
        '', // Address
        '', // Phone
        '', // Bio
        JSON.stringify([]), // Skills
        JSON.stringify([]), // Projects
        JSON.stringify([]), // Experience
        JSON.stringify([]), // Education
        shareToken
      );

      res.status(201).json({ message: 'User registered successfully. You can now login.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// 2. User Login
router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      if (user.is_active === 0) {
        return res.status(403).json({ message: 'This account has been deactivated or banned.' });
      }

      // Check password
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      // Check if 2FA enabled
      if (user.two_fa_enabled === 1) {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const hashedOtp = bcrypt.hashSync(otp, 8); // temporary hash for OTP verification
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

        // Update user record with OTP
        db.prepare('UPDATE users SET two_fa_secret = ?, two_fa_expires_at = ? WHERE id = ?')
          .run(hashedOtp, expiresAt, user.id);

        // Send OTP
        await sendOTPEmail(user.email, otp);

        // Generate temporary 2FA token (valid only for OTP verification, not access)
        const tempToken = jwt.sign(
          { tempId: user.id, email: user.email, intent: '2fa_verify' },
          process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026',
          { expiresIn: '15m' }
        );

        return res.json({
          otpRequired: true,
          tempToken,
          message: 'Two-Factor authentication code has been sent to your email.'
        });
      }

      // No 2FA: Log alert checks
      await checkLoginAlert(user, ip, userAgent);

      // Update login records
      db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?')
        .run(new Date().toISOString(), ip, user.id);

      // Generate access token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          twoFaEnabled: user.two_fa_enabled === 1
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// 3. Verify OTP
router.post(
  '/verify-otp',
  authRateLimiter,
  [
    body('tempToken').notEmpty().withMessage('Session token is missing.'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken, otp } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    try {
      // Decode tempToken
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026');
      } catch (err) {
        return res.status(400).json({ message: 'Session expired. Please log in again.' });
      }

      if (decoded.intent !== '2fa_verify') {
        return res.status(400).json({ message: 'Invalid session state.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.tempId);
      if (!user || user.is_active === 0) {
        return res.status(400).json({ message: 'User invalid or inactive.' });
      }

      // Check OTP expiry
      if (!user.two_fa_secret || !user.two_fa_expires_at) {
        return res.status(400).json({ message: 'No active OTP verification session found.' });
      }

      if (new Date() > new Date(user.two_fa_expires_at)) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // Verify OTP
      const isMatch = bcrypt.compareSync(otp, user.two_fa_secret);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid OTP code.' });
      }

      // Clear OTP secret
      db.prepare('UPDATE users SET two_fa_secret = NULL, two_fa_expires_at = NULL WHERE id = ?')
        .run(user.id);

      // Check login security alert
      await checkLoginAlert(user, ip, userAgent);

      // Update login records
      db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?')
        .run(new Date().toISOString(), ip, user.id);

      // Generate access token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          twoFaEnabled: true
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during OTP verification.' });
    }
  }
);

// 4. Resend OTP
router.post(
  '/resend-otp',
  authRateLimiter,
  [
    body('tempToken').notEmpty().withMessage('Session token is missing.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken } = req.body;

    try {
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026');
      } catch (err) {
        return res.status(400).json({ message: 'Session expired. Please log in again.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.tempId);
      if (!user || user.is_active === 0) {
        return res.status(400).json({ message: 'User invalid or inactive.' });
      }

      // Rate limit resend: check expires_at to prevent fast spamming (allow resend every 60s)
      if (user.two_fa_expires_at) {
        const remainingMs = new Date(user.two_fa_expires_at).getTime() - Date.now();
        // Since original was 10 min, if they try within 9 minutes (60 seconds elapsed), let's calculate
        // 10 minutes = 600,000ms. 9 minutes remaining = 540,000ms remaining.
        // So if remainingMs > 9 * 60 * 1000, then less than 60s has passed since generation.
        if (remainingMs > 9 * 60 * 1000) {
          return res.status(429).json({ message: 'Please wait at least 60 seconds before requesting a new OTP.' });
        }
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = bcrypt.hashSync(otp, 8);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare('UPDATE users SET two_fa_secret = ?, two_fa_expires_at = ? WHERE id = ?')
        .run(hashedOtp, expiresAt, user.id);

      await sendOTPEmail(user.email, otp);

      res.json({ message: 'New OTP has been sent to your email.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during OTP resend.' });
    }
  }
);

// 5. Admin Login
router.post(
  '/admin/login',
  authRateLimiter,
  [
    body('username').notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
      if (!admin) {
        return res.status(400).json({ message: 'Invalid admin credentials.' });
      }

      const isMatch = bcrypt.compareSync(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid admin credentials.' });
      }

      // Sign admin token
      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026',
        { expiresIn: '1d' }
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during admin login.' });
    }
  }
);

export default router;
