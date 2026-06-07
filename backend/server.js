const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { configureCloudinary } = require('./config/cloudinary');

// Initialize database & cloud storage connection
connectDB();
configureCloudinary();

const app = express();
const server = http.createServer(app);

// ──────────────────────────────────────────────
// Security Headers (Helmet)
// ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary images
  contentSecurityPolicy: false // Disabled – handled by frontend build
}));

// ──────────────────────────────────────────────
// Trust Proxy (required for Render/Heroku)
// ──────────────────────────────────────────────
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// CORS Configuration
// ──────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ──────────────────────────────────────────────
// Global Rate Limiting (express-rate-limit)
// ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

// Stricter limiter for auth routes (also applied inside authRoutes via custom middleware)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});
app.use('/api/auth/', authLimiter);

// ──────────────────────────────────────────────
// Body Parsing
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──────────────────────────────────────────────
// Initialize Socket.io
// ──────────────────────────────────────────────
initSocket(server);

// ──────────────────────────────────────────────
// Serve Static Uploads (fallback local storage)
// ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/claim', require('./routes/claimsRoutes'));
app.use('/api/claims', require('./routes/claimsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ngo', require('./routes/ngoRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/maps', require('./routes/mapRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/freshness', require('./routes/freshnessRoutes'));

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'FoodBridge API is running',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode < 500 ? err.message : 'Internal Server Error')
    : err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('[Server Error]', err.stack);
  }

  res.status(statusCode).json({ success: false, message });
});

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
