const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Configs
const { initDatabase } = require('./config/db');
const { initSocket } = require('./config/socket');

// Express App
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded static files locally
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes mapping
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Academic Collaboration Server is running.' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Database initialization then start server
async function startServer() {
  try {
    // Initialize PostgreSQL Database
    await initDatabase();
    
    // Connect Socket.IO server
    initSocket(server);

    // Start listening
    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`Server started successfully on port ${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
      console.log(`Real-Time Socket: ws://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
