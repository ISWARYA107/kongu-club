require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const adminRoutes = require('./src/routes/adminRoutes');
const coordinatorRoutes = require('./src/routes/coordinatorRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const publicRoutes = require('./src/routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Kongu Clubs API is running' });
});

// ==================== ROUTES ====================
app.use('/api/admin', adminRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', publicRoutes); // /api/clubs, /api/clubs/:id, /api/events/club/:id, /api/events/approved

// 404 fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.listen(PORT, () => {
  console.log('🚀 Kongu Clubs Management API running!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
});
