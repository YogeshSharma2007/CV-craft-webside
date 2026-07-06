import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';
import db from '../db/database.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = './uploads/photos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP image formats are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Sanitization helpers
const sanitize = (text) => {
  if (!text) return '';
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
};

const sanitizeArray = (arr) => {
  if (!arr) return [];
  let parsed = [];
  try {
    parsed = typeof arr === 'string' ? JSON.parse(arr) : arr;
  } catch (e) {
    return [];
  }
  
  if (!Array.isArray(parsed)) return [];

  return parsed.map(item => {
    const cleanItem = {};
    for (const key in item) {
      if (typeof item[key] === 'string') {
        cleanItem[key] = sanitize(item[key]);
      } else if (Array.isArray(item[key])) {
        cleanItem[key] = item[key].map(val => typeof val === 'string' ? sanitize(val) : val);
      } else {
        cleanItem[key] = item[key];
      }
    }
    return cleanItem;
  });
};

// 1. Get own CV data
router.get('/me', authenticateUser, (req, res) => {
  try {
    const cv = db.prepare('SELECT * FROM cv_data WHERE user_id = ?').get(req.user.id);
    if (!cv) {
      return res.status(404).json({ message: 'CV data not found.' });
    }
    
    // Parse JSON fields
    cv.skills = JSON.parse(cv.skills || '[]');
    cv.projects = JSON.parse(cv.projects || '[]');
    cv.experience = JSON.parse(cv.experience || '[]');
    cv.education = JSON.parse(cv.education || '[]');

    res.json(cv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving CV.' });
  }
});

// 2. Update own CV data
router.put('/me', authenticateUser, upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      bio,
      github_url,
      linkedin_url,
      skills,
      projects,
      experience,
      education
    } = req.body;

    // Check URL validations if provided
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (github_url && !urlRegex.test(github_url)) {
      return res.status(400).json({ message: 'Invalid GitHub URL format.' });
    }
    if (linkedin_url && !urlRegex.test(linkedin_url)) {
      return res.status(400).json({ message: 'Invalid LinkedIn URL format.' });
    }

    // Sanitize string inputs
    const cleanName = sanitize(name);
    const cleanAddress = sanitize(address);
    const cleanPhone = sanitize(phone);
    const cleanBio = sanitize(bio);
    const cleanGithub = sanitize(github_url);
    const cleanLinkedin = sanitize(linkedin_url);

    // Sanitize array inputs
    const cleanSkills = sanitizeArray(skills);
    const cleanProjects = sanitizeArray(projects);
    const cleanExperience = sanitizeArray(experience);
    const cleanEducation = sanitizeArray(education);

    // Check if CV exists
    const cv = db.prepare('SELECT id, photo_url FROM cv_data WHERE user_id = ?').get(req.user.id);
    let photoUrl = cv ? cv.photo_url : null;

    // If new file uploaded, set photoUrl
    if (req.file) {
      // Remove old photo if exists
      if (photoUrl) {
        const oldPath = path.join('.', photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      photoUrl = `uploads/photos/${req.file.filename}`;
    }

    if (cv) {
      db.prepare(`
        UPDATE cv_data 
        SET name = ?, address = ?, phone = ?, bio = ?, photo_url = ?, github_url = ?, linkedin_url = ?, 
            skills = ?, projects = ?, experience = ?, education = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).run(
        cleanName,
        cleanAddress,
        cleanPhone,
        cleanBio,
        photoUrl,
        cleanGithub,
        cleanLinkedin,
        JSON.stringify(cleanSkills),
        JSON.stringify(cleanProjects),
        JSON.stringify(cleanExperience),
        JSON.stringify(cleanEducation),
        req.user.id
      );
    } else {
      const cvId = 'cv-' + Math.random().toString(36).substr(2, 9);
      const shareToken = 'token-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO cv_data (id, user_id, name, address, phone, bio, photo_url, github_url, linkedin_url, skills, projects, experience, education, share_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        cvId,
        req.user.id,
        cleanName,
        cleanAddress,
        cleanPhone,
        cleanBio,
        photoUrl,
        cleanGithub,
        cleanLinkedin,
        JSON.stringify(cleanSkills),
        JSON.stringify(cleanProjects),
        JSON.stringify(cleanExperience),
        JSON.stringify(cleanEducation),
        shareToken
      );
    }

    res.json({ message: 'CV updated successfully.', photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating CV.' });
  }
});

// 3. Toggle CV Share Status
router.post('/me/toggle-share', authenticateUser, (req, res) => {
  try {
    const { share_enabled } = req.body;
    const enabled = share_enabled ? 1 : 0;
    
    const result = db.prepare('UPDATE cv_data SET share_enabled = ? WHERE user_id = ?').run(enabled, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'CV data not found.' });
    }

    res.json({ success: true, shareEnabled: enabled === 1, message: `CV sharing is now ${enabled === 1 ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling sharing status.' });
  }
});

// 4. Get share settings
router.get('/me/share-info', authenticateUser, (req, res) => {
  try {
    const cv = db.prepare('SELECT share_token, share_enabled FROM cv_data WHERE user_id = ?').get(req.user.id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found.' });
    }
    res.json({
      shareToken: cv.share_token,
      shareEnabled: cv.share_enabled === 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving sharing info.' });
  }
});

// 5. Get shared CV data (Public access, rate limited via global config)
router.get('/share/:token', (req, res) => {
  const { token } = req.params;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Validate token format using regex to ensure safety
  const tokenRegex = /^token-[a-z0-9]+-[a-z0-9]+$/;
  if (!tokenRegex.test(token)) {
    return res.status(404).json({ message: 'CV share link not found or invalid.' });
  }

  try {
    const cv = db.prepare('SELECT * FROM cv_data WHERE share_token = ?').get(token);
    if (!cv || cv.share_enabled === 0) {
      return res.status(404).json({ message: 'CV share link is not active or not found.' });
    }

    // Verify user is active (not banned/disabled)
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(cv.user_id);
    if (!user || user.is_active === 0) {
      return res.status(404).json({ message: 'CV is currently unavailable.' });
    }

    // Log the view (Anonymize IP address by stripping last digits)
    const anonymizeIp = (rawIp) => {
      if (!rawIp) return '0.0.0.0';
      if (rawIp === '::1' || rawIp === '127.0.0.1') return '127.0.0.1';
      const parts = rawIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
      return rawIp.substring(0, 15) + '...';
    };
    
    const anonIp = anonymizeIp(ip);
    const viewId = 'view-' + Math.random().toString(36).substr(2, 9);
    db.prepare('INSERT INTO share_views (id, cv_id, ip_address) VALUES (?, ?, ?)').run(viewId, cv.id, anonIp);

    // Parse JSON content
    cv.skills = JSON.parse(cv.skills || '[]');
    cv.projects = JSON.parse(cv.projects || '[]');
    cv.experience = JSON.parse(cv.experience || '[]');
    cv.education = JSON.parse(cv.education || '[]');

    // Strip sensitive fields (like database user_id)
    const publicCv = {
      name: cv.name,
      address: cv.address,
      phone: cv.phone,
      bio: cv.bio,
      photo_url: cv.photo_url,
      github_url: cv.github_url,
      linkedin_url: cv.linkedin_url,
      skills: cv.skills,
      projects: cv.projects,
      experience: cv.experience,
      education: cv.education
    };

    res.json(publicCv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving shared CV.' });
  }
});

// Error handling for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image size cannot exceed 2MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

export default router;
