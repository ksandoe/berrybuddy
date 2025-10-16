const express = require('express');
const { supabase } = require('../supabase');
const router = express.Router();

// GET /berries
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const from = offset;
    const to = offset + limit - 1;

    const { data, error } = await supabase
      .from('berry')
      .select('*')
      .range(from, to);

    if (error) return next(error);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
