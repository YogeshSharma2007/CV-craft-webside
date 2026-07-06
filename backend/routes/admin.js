import express from 'express';
import db from '../db/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// 1. Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
    const totalCVs = db.prepare('SELECT COUNT(*) as count FROM cv_data').get().count;
    const totalShareViews = db.prepare('SELECT COUNT(*) as count FROM share_views').get().count;
    
    // New users this week
    const newUsersWeek = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= datetime('now', '-7 days')
    `).get().count;

    res.json({
      totalUsers,
      activeUsers,
      totalCVs,
      totalShareViews,
      newUsersWeek
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving dashboard stats.' });
  }
});

// 2. User list with search, pagination
router.get('/users', (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const offset = (page - 1) * limit;

  try {
    let usersQuery = 'SELECT id, email, is_active, last_login_at, last_login_ip, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    const params = [];

    if (search) {
      usersQuery += ' WHERE email LIKE ?';
      countQuery += ' WHERE email LIKE ?';
      params.push(`%${search}%`);
    }

    usersQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    const countResult = db.prepare(countQuery).get(...params);
    const users = db.prepare(usersQuery).all(...params, limit, offset);

    res.json({
      users,
      pagination: {
        total: countResult.count,
        page,
        limit,
        pages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving users list.' });
  }
});

// 3. View single user's detailed data + CV
router.get('/users/:id', (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT id, email, is_active, last_login_at, last_login_ip, created_at FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const cv = db.prepare('SELECT * FROM cv_data WHERE user_id = ?').get(id);
    if (cv) {
      cv.skills = JSON.parse(cv.skills || '[]');
      cv.projects = JSON.parse(cv.projects || '[]');
      cv.experience = JSON.parse(cv.experience || '[]');
      cv.education = JSON.parse(cv.education || '[]');
    }

    const alerts = db.prepare('SELECT * FROM login_alerts WHERE user_id = ? ORDER BY alerted_at DESC LIMIT 10').all(id);

    res.json({
      user,
      cv,
      alerts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving user details.' });
  }
});

// 4. Toggle User Activation State (Ban/Unban)
router.patch('/users/:id/toggle', (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newActiveState = user.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newActiveState, id);

    res.json({
      success: true,
      isActive: newActiveState === 1,
      message: `User account has been successfully ${newActiveState === 1 ? 'activated' : 'deactivated/banned'}.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling user status.' });
  }
});

// 5. Delete User Account (cascades automatically via SQL foreign keys)
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ success: true, message: 'User and all associated CV and security log records have been deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

// 6. View share view logs
router.get('/share-views', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT sv.id, sv.viewed_at, sv.ip_address, cv.name as cv_name, u.email as user_email
      FROM share_views sv
      JOIN cv_data cv ON sv.cv_id = cv.id
      JOIN users u ON cv.user_id = u.id
      ORDER BY sv.viewed_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching share view logs.' });
  }
});

// 7. 30-day user growth data
router.get('/growth', (req, res) => {
  try {
    // Count new users daily for last 30 days
    const data = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching growth data.' });
  }
});

// 8. View login alerts
router.get('/login-alerts', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT la.id, la.ip_address, la.user_agent, la.alerted_at, la.is_new_device, u.email
      FROM login_alerts la
      JOIN users u ON la.user_id = u.id
      ORDER BY la.alerted_at DESC
      LIMIT 100
    `).all();
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching login alerts.' });
  }
});

export default router;
