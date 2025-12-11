require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');
const { apiLimiter, loginLimiter, gateLimiter } = require('./src/middleware/rateLimiter');
const authRoutes = require('./src/routes/auth');
const passTypeRoutes = require('./src/routes/passTypes');
const bookingRoutes = require('./src/routes/bookings');
const entryRoutes = require('./src/routes/entry');
const reportRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://eventbackend-6byp.vercel.app', 'https://eventmanagementfrontend-psi.vercel.app', 'https://eventmanagementfrontend-cbicfl8rz-kritikas-projects-f0fe89de.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting (commented for testing)
// app.use('/api/', apiLimiter);
// app.use('/api/auth/login', loginLimiter);
// app.use('/api/entry/', gateLimiter);

// Initialize database
initDatabase();

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Event Backend API is running!', status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pass-types', passTypeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/entry', entryRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});