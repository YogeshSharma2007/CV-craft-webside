import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../db/database.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get settings
router.get('/settings', authenticateUser, (req, res) => {
  try {
    const user = db.prepare('SELECT email, two_fa_enabled, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      email: user.email,
      twoFaEnabled: user.two_fa_enabled === 1,
      createdAt: user.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user settings.' });
  }
});

// Enable 2FA
router.post('/2fa/enable', authenticateUser, (req, res) => {
  try {
    db.prepare('UPDATE users SET two_fa_enabled = 1 WHERE id = ?').run(req.user.id);
    res.json({ success: true, message: 'Two-Factor Authentication (2FA) is now enabled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error enabling 2FA.' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateUser, (req, res) => {
  try {
    db.prepare('UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL, two_fa_expires_at = NULL WHERE id = ?').run(req.user.id);
    res.json({ success: true, message: 'Two-Factor Authentication (2FA) has been disabled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error disabling 2FA.' });
  }
});

// Change password
router.post(
  '/change-password',
  authenticateUser,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check current password
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password you entered is incorrect.' });
      }

      // Hash new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 12);

      // Update password
      db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
        .run(hashedNewPassword, req.user.id);

      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error changing password.' });
    }
  }
);

export default router;
