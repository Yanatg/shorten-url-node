// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
require('dotenv').config();

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required and must be strings.' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
         return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already in use.' }); // 409 Conflict
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserResult = await db.query(
            'INSERT INTO users (email, password, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, email, created_at',
            [email, hashedPassword]
        );

        const newUser = newUserResult.rows[0];

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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const userResult = await db.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        req.session.userId = user.id;
        req.session.email = user.email;
        
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Internal server error during login.' });
            }

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


router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: 'Could not log out, please try again.'});
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});


router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.status(200).json({
            isLoggedIn: true,
            user: {
                id: req.session.userId,
                email: req.session.email
            }
        });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
});

module.exports = router;