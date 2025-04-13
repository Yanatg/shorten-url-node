// src/server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default

// Middleware
app.use(cors()); // Allow requests from your Vue frontend (configure origins later for security)
app.use(express.json()); // Parse JSON request bodies

// Basic Route (Test)
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Backend is running!' });
});

// TODO: Add routes for URL shortening, redirection, history, QR codes

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});