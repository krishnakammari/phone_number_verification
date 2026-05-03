const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Create Express app
const app = express();

// Connect to MongoDB
// Only connect if MONGODB_URI is provided (to prevent crashing locally if not set)
if (process.env.MONGODB_URI) {
  connectDB();
}

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files for frontend

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

module.exports = app;
