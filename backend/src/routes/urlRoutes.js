// backend/src/routes/urlRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateShortCode } = require('../utils/shortCode');
const requireLogin = require('../middleware/requireLogin');

router.post('/', async (req, res) => {
    const { original_url } = req.body;

    let userIdToSave = null;
    if (req.session && req.session.userId) {
        userIdToSave = req.session.userId;
    }

    if (!original_url || typeof original_url !== 'string') {
        return res.status(400).json({ error: 'original_url (string) is required' });
    }
    try { new URL(original_url); } catch (e) { return res.status(400).json({ error: 'Invalid URL format' }); }

    if (userIdToSave !== null) {
        try {
            console.log(`Checking existing URL for user ${userIdToSave} and URL ${original_url}`);
            const existingResult = await db.query(
                'SELECT id, short_code, original_url FROM urls WHERE original_url = $1 AND user_id = $2',
                [original_url, userIdToSave]
            );

            if (existingResult.rows.length > 0) {
                const existingUrl = existingResult.rows[0];
                console.log(`--> Existing URL found: ${existingUrl.short_code}`);

                const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
                const fullShortUrl = `${baseUrl.replace(/\/$/, '')}/${existingUrl.short_code}`;

                return res.status(200).json({
                    id: existingUrl.id,
                    short_code: existingUrl.short_code,
                    original_url: existingUrl.original_url,
                    full_short_url: fullShortUrl,
                    existed: true
                });
            }
            console.log(`--> No existing URL found for user ${userIdToSave}. Creating new one.`);

        } catch (checkErr) {
            console.error('Error checking for existing URL:', checkErr);
        }
    }


    let shortCode;
    let insertedUrl = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!insertedUrl && attempts < maxAttempts) {
        attempts++;
        shortCode = generateShortCode();
        try {
            const result = await db.query(
                `INSERT INTO urls (user_id, short_code, original_url, visit_count, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id, short_code, original_url`,
                [userIdToSave, shortCode, original_url, 0]
            );
            insertedUrl = result.rows[0];
            console.log(`--> New URL created: ${shortCode} for user ${userIdToSave || 'Anonymous'}`);
        } catch (err) {
            if (err.code === '23505') {
                console.warn(`Collision detected for short_code ${shortCode}, retrying...`);
            } else {
                 console.error('Database error inserting URL:', err);
                 if (err.code === '23502' && err.column === 'user_id') {
                     return res.status(500).json({ error: 'Internal server configuration error prevents anonymous URL creation.' });
                 }
                return res.status(500).json({ error: 'Failed to create short URL due to database error.' });
            }
        }
    }

    if (!insertedUrl) {
        return res.status(500).json({ error: 'Failed to generate unique short code after multiple attempts' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fullShortUrl = `${baseUrl.replace(/\/$/, '')}/${insertedUrl.short_code}`;

    res.status(201).json({
        id: insertedUrl.id,
        short_code: insertedUrl.short_code,
        original_url: insertedUrl.original_url,
        full_short_url: fullShortUrl
    });
});

router.get('/history', requireLogin, async (req, res) => {
    const userId = req.session.userId;

    try {
        const historyResult = await db.query(
            `SELECT id, short_code, original_url, visit_count, created_at
             FROM urls
             WHERE user_id = $1  -- Filter by the user's ID from the session
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json(historyResult.rows);

    } catch (err) {
        console.error(`Error fetching URL history for user ${userId}:`, err);
        res.status(500).json({ error: 'Failed to retrieve URL history.' });
    }
});

router.delete('/:id', requireLogin, async (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.userId;

  if (!urlId || isNaN(parseInt(urlId, 10))) {
     return res.status(400).json({ error: 'Invalid URL ID provided.' });
  }

  console.log(`Attempting delete for URL ID: ${urlId} by User ID: ${userId}`);

  try {
      const deleteResult = await db.query(
          'DELETE FROM urls WHERE id = $1 AND user_id = $2',
          [urlId, userId]
      );

      if (deleteResult.rowCount === 0) {
          console.log(`--> Delete failed: URL ID ${urlId} not found or not owned by user ${userId}.`);
          return res.status(404).json({ error: 'URL not found or you do not have permission to delete it.' });
      }

      console.log(`--> Successfully deleted URL ID: ${urlId} for user ${userId}.`);
      res.status(204).send();

  } catch (err) {
      console.error(`Error deleting URL ID ${urlId} for user ${userId}:`, err);
      res.status(500).json({ error: 'Failed to delete URL.' });
  }
});


const handleRedirect = async (req, res) => {
    const { shortCode } = req.params;

    if (!shortCode || typeof shortCode !== 'string' || shortCode.length > 20) {
       return res.status(400).send('Invalid short code format');
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const selectResult = await client.query(
            'SELECT id, original_url FROM urls WHERE short_code = $1 FOR UPDATE',
            [shortCode]
        );

        if (selectResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Short URL not found');
        }

        const urlData = selectResult.rows[0];

        await client.query(
            'UPDATE urls SET visit_count = visit_count + 1, updated_at = NOW() WHERE id = $1',
            [urlData.id]
        );

        await client.query('COMMIT');

        res.redirect(302, urlData.original_url);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error handling redirect for ${shortCode}:`, err);
        res.status(500).send('Internal Server Error');
    } finally {
       client.release();
    }
};

module.exports = { router, handleRedirect };