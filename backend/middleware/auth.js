import jwt from 'jsonwebtoken';
import db from '../db/database.js';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026');
    
    if (decoded.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden. User access required.' });
    }

    // Verify user exists and is active in database
    const user = db.prepare('SELECT id, email, is_active, two_fa_enabled FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    
    if (user.is_active === 0) {
      return res.status(403).json({ message: 'This account has been deactivated or banned.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cvcraft_super_secret_session_key_2026');

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    // Verify admin exists in database
    const admin = db.prepare('SELECT id, username FROM admins WHERE id = ?').get(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Admin account invalid.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin session token.' });
  }
};
