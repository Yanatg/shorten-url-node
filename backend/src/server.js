// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const db = require('./db');
const urlRoutes = require('./routes/urlRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-for-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// API routes
app.use('/api/urls', urlRoutes.router);

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes.router);
app.get('/:shortCode', urlRoutes.handleRedirect);

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
