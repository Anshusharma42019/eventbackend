require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { initDatabase } = require('./database/init');
const { apiLimiter, loginLimiter, gateLimiter } = require('./src/middleware/rateLimiter');
const authRoutes = require('./src/routes/auth');
const passTypeRoutes = require('./src/routes/passTypes');
const bookingRoutes = require('./src/routes/bookings');
const entryRoutes = require('./src/routes/entry');
const reportRoutes = require('./src/routes/reports');
const uploadRoutes = require('./src/routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://eventbackend-blond.vercel.app',
      'https://eventmanagementfrontend-orcin.vercel.app/',
    ];
    
    // Allow all Vercel deployments
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting (commented for testing)
// app.use('/api/', apiLimiter);
// app.use('/api/auth/login', loginLimiter);
// app.use('/api/entry/', gateLimiter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Event Backend API is running!', status: 'OK' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pass-types', passTypeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/entry', entryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});