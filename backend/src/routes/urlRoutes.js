// backend/src/routes/urlRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateShortCode } = require('../utils/shortCode');
const { Pool } = require('pg');

// Create a new short URL
router.post('/', async (req, res) => {
  const { original_url } = req.body;
  
  if (!original_url) {
    return res.status(400).json({ error: 'original_url is required' });
  }

  const userId = 1;

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
        [userId, shortCode, original_url, 0]
      );
      insertedUrl = result.rows[0];
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'urls_short_code_key') {
        console.warn(`Collision detected for short_code ${shortCode}, retrying...`);
      } else {
        console.error('Database error inserting URL:', err);
        return res.status(500).json({ error: 'Failed to create short URL' });
      }
    }
  }

  if (!insertedUrl) {
     return res.status(500).json({ error: 'Failed to generate unique short code after multiple attempts' });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const fullShortUrl = `${baseUrl}/${insertedUrl.short_code}`;

  res.status(201).json({
    id: insertedUrl.id,
    short_code: insertedUrl.short_code,
    original_url: insertedUrl.original_url,
    full_short_url: fullShortUrl
  });
});

// --- Redirect Endpoint ---

const handleRedirect = async (req, res) => {
    const { shortCode } = req.params;

    if (!shortCode) {
       return res.status(400).send('Short code required');
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Find the URL and lock the row for update to prevent race conditions on visit_count
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

        // Perform the redirect
        res.redirect(302, urlData.original_url);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error handling redirect:', err);
        res.status(500).send('Internal Server Error');
    } finally {
       client.release();
    }
};

// Export router or handlers
module.exports = { router, handleRedirect };
