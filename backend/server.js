import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load Environment Configuration
dotenv.config();

// Initialize DB schema (runs seeding check automatically)
import './db/database.js';

// Import Routers
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import cvRouter from './routes/cv.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Global Rate Limiter: Max 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Payload size limit (10KB for JSON body to protect against payload size attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static files (Uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/cv', cvRouter);
app.use('/api/admin', adminRouter);

// Health Check API
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'CV Craft Backend API v2.0 running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] CV Craft Backend running on port ${PORT}`);
  console.log(`[Server] Access URL: http://localhost:${PORT}`);
});
