const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://swipcard.netlify.app',
  'http://localhost:3000'
].filter(Boolean);

// CORS configuration - single middleware to handle everything
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Precise matching or suffix matching for subdomains/platforms
    const isAllowed = allowedOrigins.some(allowed =>
      origin === allowed ||
      origin === allowed.replace(/^https?:\/\//, '') ||
      origin.replace(/^https?:\/\//, '') === allowed.replace(/^https?:\/\//, '')
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Routes
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Email connection test endpoint (Temporary)
app.get('/api/test-email-connection', async (req, res) => {
  try {
    const { verifyEmailConfig } = require('./utils/emailService');
    const result = await verifyEmailConfig();
    res.json({
      ...result,
      env: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? 'Set' : 'Missing',
        pass: process.env.SMTP_PASS ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`💡 To free it: lsof -ti:${PORT} | xargs kill -9`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

module.exports = app;
