// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const urlRoutes = require('./routes/urlRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/urls', urlRoutes.router);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Backend is running!' });
});

// Redirect handler for the root path using short codes
app.get('/:shortCode', urlRoutes.handleRedirect);

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
