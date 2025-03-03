const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PORT } = require('./config');
const apiRoutes = require('./routes');
const { testConnection, initDatabase } = require('./models/db');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

// Root route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Magic Inventory API is running' });
});

// Mount API router
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (isConnected) {
      // Initialize database tables
      await initDatabase();

      // Start server
      app.listen(PORT, () => {
        console.log(`Magic Inventory API server running on port ${PORT}`);
        console.log(`API base URL: http://localhost:${PORT}/api`);
      });
    } else {
      console.error('Failed to start server due to database connection issues');
      console.error('Please check your database configuration in .env file');
    }
  } catch (error) {
    console.error('Server initialization error:', error);
  }
};

startServer();
