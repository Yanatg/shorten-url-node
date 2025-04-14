// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db'); // Your db connection module
require('dotenv').config(); // To access JWT_SECRET

const router = express.Router();
const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// --- Registration ---
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // --- Basic Input Validation ---
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required and must be strings.' });
    }
    // Basic email format check (consider a more robust library like 'validator' for production)
    if (!/\S+@\S+\.\S+/.test(email)) {
         return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 6) { // Enforce minimum password length
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    // --- End Validation ---

    try {
        // 1. Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already in use.' }); // 409 Conflict
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Insert the new user
        const newUserResult = await db.query(
            'INSERT INTO users (email, password, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, email, created_at',
            [email, hashedPassword]
        );

        const newUser = newUserResult.rows[0];

        // 4. Optionally: Generate a JWT immediately upon registration (or require login)
        // For simplicity, let's just return success message here. User will login separately.
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: newUser.id,
                email: newUser.email,
                created_at: newUser.created_at
            }
        });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

// --- Login ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // 1. Find user by email
        const userResult = await db.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];

        // 2. Compare submitted password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 3. Credentials valid - Store user ID in session
        req.session.userId = user.id; // <-- STORE USER ID IN SESSION
        req.session.email = user.email; // <-- Optionally store other non-sensitive info

        // Ensure session is saved before sending response (optional but safer)
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Internal server error during login.' });
            }

            // 4. Send success response (no token needed now)
            res.status(200).json({
                message: 'Login successful!',
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// --- Add a Logout Route ---
router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => { // Destroys the session
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: 'Could not log out, please try again.'});
        }
        // Also clear the cookie on the client side
        res.clearCookie('connect.sid'); // Use the default cookie name, or the name you configured
        res.status(200).json({ message: 'Logout successful' });
    });
});

 // --- Add a route to check current session status ---
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        // User is logged in
        res.status(200).json({
            isLoggedIn: true,
            user: {
                id: req.session.userId,
                email: req.session.email
            }
        });
    } else {
        // User is not logged in
        res.status(200).json({ isLoggedIn: false });
    }
});

module.exports = router;