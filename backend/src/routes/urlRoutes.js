// backend/src/routes/urlRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateShortCode } = require('../utils/shortCode');
const requireLogin = require('../middleware/requireLogin');

// --- Create a new short URL (Public, checks history if logged in) ---
router.post('/', async (req, res) => { // No requireLogin middleware here
    const { original_url } = req.body;

    // Determine userIdToSave (NULL if anonymous)
    let userIdToSave = null;
    if (req.session && req.session.userId) {
        userIdToSave = req.session.userId;
    }

    // --- Validation ---
    if (!original_url || typeof original_url !== 'string') {
        return res.status(400).json({ error: 'original_url (string) is required' });
    }
    try { new URL(original_url); } catch (e) { return res.status(400).json({ error: 'Invalid URL format' }); }
    // --- End Validation ---


    // --- Check for Existing URL *IF* User is Logged In ---
    if (userIdToSave !== null) {
        try {
            console.log(`Checking existing URL for user ${userIdToSave} and URL ${original_url}`);
            const existingResult = await db.query(
                'SELECT id, short_code, original_url FROM urls WHERE original_url = $1 AND user_id = $2',
                [original_url, userIdToSave]
            );

            if (existingResult.rows.length > 0) {
                // Found existing record for this user and URL
                const existingUrl = existingResult.rows[0];
                console.log(`--> Existing URL found: ${existingUrl.short_code}`);

                const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
                const fullShortUrl = `${baseUrl.replace(/\/$/, '')}/${existingUrl.short_code}`;

                // Return 200 OK with existing data
                return res.status(200).json({
                    id: existingUrl.id,
                    short_code: existingUrl.short_code,
                    original_url: existingUrl.original_url,
                    full_short_url: fullShortUrl,
                    existed: true // Add flag to indicate it already existed
                });
            }
            // No existing record found for this logged-in user, proceed to create...
            console.log(`--> No existing URL found for user ${userIdToSave}. Creating new one.`);

        } catch (checkErr) {
            console.error('Error checking for existing URL:', checkErr);
            // Don't fail the whole request, proceed to creation but log error
            // return res.status(500).json({ error: 'Failed to check for existing URL.' });
        }
    }
    // --- End Check for Existing URL ---


    // --- Create New URL Entry (If anonymous or no existing found for user) ---
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
                [userIdToSave, shortCode, original_url, 0] // Use userIdToSave (null or actual ID)
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

    // Construct the full short URL for the newly created entry
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fullShortUrl = `${baseUrl.replace(/\/$/, '')}/${insertedUrl.short_code}`;

    // Return 201 Created with the new data
    res.status(201).json({
        id: insertedUrl.id,
        short_code: insertedUrl.short_code,
        original_url: insertedUrl.original_url,
        full_short_url: fullShortUrl
        // existed: false (implied)
    });
});


// --- GET User's URL History (Protected) ---
// This route requires the user to be logged in (checks session)
router.get('/history', requireLogin, async (req, res) => {
    // requireLogin middleware ensures req.session.userId exists
    const userId = req.session.userId;

    try {
        // Fetch URLs only belonging to the logged-in user
        const historyResult = await db.query(
            `SELECT id, short_code, original_url, visit_count, created_at
             FROM urls
             WHERE user_id = $1  -- Filter by the user's ID from the session
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json(historyResult.rows); // Send the array of URL objects

    } catch (err) {
        console.error(`Error fetching URL history for user ${userId}:`, err);
        res.status(500).json({ error: 'Failed to retrieve URL history.' });
    }
});

// --- DELETE a URL History Item (Protected) ---
// Route uses URL parameter :id to specify which URL record to delete
router.delete('/:id', requireLogin, async (req, res) => {
  const urlId = req.params.id; // Get the ID from the URL path
  const userId = req.session.userId; // Get the logged-in user's ID from session

  // Basic validation for the ID parameter
  if (!urlId || isNaN(parseInt(urlId, 10))) {
     return res.status(400).json({ error: 'Invalid URL ID provided.' });
  }

  console.log(`Attempting delete for URL ID: ${urlId} by User ID: ${userId}`);

  try {
      // Execute DELETE query, ensuring the user_id matches the logged-in user
      // This prevents users from deleting URLs they don't own
      const deleteResult = await db.query(
          'DELETE FROM urls WHERE id = $1 AND user_id = $2',
          [urlId, userId]
      );

      // Check if any row was actually deleted
      if (deleteResult.rowCount === 0) {
          // If no rows were deleted, it means either the URL ID didn't exist
          // or it didn't belong to this user. Send 404 Not Found.
          console.log(`--> Delete failed: URL ID ${urlId} not found or not owned by user ${userId}.`);
          return res.status(404).json({ error: 'URL not found or you do not have permission to delete it.' });
      }

      // Deletion was successful
      console.log(`--> Successfully deleted URL ID: ${urlId} for user ${userId}.`);
      // Send 204 No Content status, common for successful DELETE requests
      res.status(204).send();

  } catch (err) {
      console.error(`Error deleting URL ID ${urlId} for user ${userId}:`, err);
      res.status(500).json({ error: 'Failed to delete URL.' });
  }
});


// --- Redirect Endpoint Handler Function (Public) ---
// Note: This function is EXPORTED but the route (app.get('/:shortCode', ...)) is defined in server.js
const handleRedirect = async (req, res) => {
    const { shortCode } = req.params;

    // Basic validation for shortCode format/length
    if (!shortCode || typeof shortCode !== 'string' || shortCode.length > 20) {
       return res.status(400).send('Invalid short code format');
    }

    const client = await db.pool.connect(); // Use connection pool for transactions
    try {
        await client.query('BEGIN');

        // Find the URL, lock the row to prevent race conditions on visit_count increment
        const selectResult = await client.query(
            'SELECT id, original_url FROM urls WHERE short_code = $1 FOR UPDATE',
            [shortCode]
        );

        if (selectResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Short URL not found'); // Use 404 for not found
        }

        const urlData = selectResult.rows[0];

        // Increment the visit count for the found URL
        await client.query(
            'UPDATE urls SET visit_count = visit_count + 1, updated_at = NOW() WHERE id = $1',
            [urlData.id]
        );

        await client.query('COMMIT'); // Commit the transaction

        // Perform the redirect (302 Found - typically used for temporary redirects like short URLs)
        res.redirect(302, urlData.original_url);

    } catch (err) {
        // Rollback transaction in case of any error during the process
        await client.query('ROLLBACK');
        console.error(`Error handling redirect for ${shortCode}:`, err);
        res.status(500).send('Internal Server Error'); // Generic error for the user
    } finally {
       // ALWAYS release the database client back to the pool
       client.release();
    }
};


// Export the router (for '/api/urls' routes) and the redirect handler (for root '/:shortCode' route)
module.exports = { router, handleRedirect };