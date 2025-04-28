const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const mealRoutes = require('./routes/mealRoutes');

const app = express();

// Middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Meal Calories Tracker API' });
});

// 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;