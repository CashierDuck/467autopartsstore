// routes for loading the parts catalog from the NIU database

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT number, description, price, weight, pictureURL FROM parts WHERE price > 0'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching catalog:', err.message);
    res.status(500).json({ error: 'Could not load catalog.' });
  }
});

router.get('/search', async (req, res) => {
  const q = req.query.q;

  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT number, description, price, weight, pictureURL FROM parts WHERE description LIKE ? AND price > 0',
      ['%' + q.trim() + '%']
    );
    res.json(rows);
  } catch (err) {
    console.error('Error searching catalog:', err.message);
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
