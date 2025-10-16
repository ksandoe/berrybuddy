const express = require('express');
const { supabase } = require('../supabase');

const router = express.Router();

function requireSupabase(req, res) {
  if (!supabase) {
    res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  if (!requireSupabase(req, res)) return;
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authorization header required' });
  }
  next();
}

// GET /reviews (public)
router.get('/', async (req, res, next) => {
  try {
    if (!requireSupabase(req, res)) return;
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const from = offset;
    const to = offset + limit - 1;

    const { data, error } = await supabase
      .from('review')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return next(error);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /reviews (reported_by = current user)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      vendor_id,
      berry_id,
      rating,
      quality_rating,
      freshness_rating,
      value_rating,
      review_text,
      visited_date,
    } = req.body || {};

    const payload = {
      vendor_id,
      berry_id,
      rating,
      quality_rating,
      freshness_rating,
      value_rating,
      review_text,
      visited_date,
      reported_by: userId,
    };

    const { data, error } = await supabase
      .from('review')
      .insert(payload)
      .select('*')
      .single();

    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /reviews/:id (owner-only)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('review')
      .select('review_id, reported_by')
      .eq('review_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.reported_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const {
      rating,
      quality_rating,
      freshness_rating,
      value_rating,
      review_text,
      visited_date,
    } = req.body || {};
    const update = {
      ...(rating !== undefined ? { rating } : {}),
      ...(quality_rating !== undefined ? { quality_rating } : {}),
      ...(freshness_rating !== undefined ? { freshness_rating } : {}),
      ...(value_rating !== undefined ? { value_rating } : {}),
      ...(review_text !== undefined ? { review_text } : {}),
      ...(visited_date !== undefined ? { visited_date } : {}),
    };

    const { data, error } = await supabase
      .from('review')
      .update(update)
      .eq('review_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /reviews/:id (owner-only)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('review')
      .select('review_id, reported_by')
      .eq('review_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.reported_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const { data, error } = await supabase
      .from('review')
      .delete()
      .eq('review_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
