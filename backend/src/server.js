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
// CORS (ensure options allow credentials if needed later)
app.use(cors({
  origin: 'http://localhost:5173', // Or your frontend URL (better from env var)
  credentials: true // Allow cookies to be sent/received
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-for-session', // Use a strong secret! Reuse JWT or add SESSION_SECRET to .env
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
      httpOnly: true, // Prevent client-side JS from accessing the cookie
      maxAge: 1000 * 60 * 60 * 24 * 7 // Cookie expiry: 7 days
      // sameSite: 'lax' // Or 'strict'. Helps prevent CSRF. 'lax' is often a good default.
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
