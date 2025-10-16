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

// GET /prices (public)
router.get('/', async (req, res, next) => {
  try {
    if (!requireSupabase(req, res)) return;
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const from = offset;
    const to = offset + limit - 1;

    const { data, error } = await supabase
      .from('price')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return next(error);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /prices (reported_by = current user)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { vendor_id, berry_id, price_per_unit, unit_type, reported_at } = req.body || {};

    const payload = {
      vendor_id,
      berry_id,
      price_per_unit,
      unit_type,
      reported_at: reported_at || new Date().toISOString(),
      reported_by: userId,
    };

    const { data, error } = await supabase
      .from('price')
      .insert(payload)
      .select('*')
      .single();

    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /prices/:id (owner-only)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('price')
      .select('price_id, reported_by')
      .eq('price_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.reported_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const { price_per_unit, unit_type, reported_at } = req.body || {};
    const update = {
      ...(price_per_unit !== undefined ? { price_per_unit } : {}),
      ...(unit_type !== undefined ? { unit_type } : {}),
      ...(reported_at !== undefined ? { reported_at } : {}),
    };

    const { data, error } = await supabase
      .from('price')
      .update(update)
      .eq('price_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /prices/:id (owner-only)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('price')
      .select('price_id, reported_by')
      .eq('price_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.reported_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const { data, error } = await supabase
      .from('price')
      .delete()
      .eq('price_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
