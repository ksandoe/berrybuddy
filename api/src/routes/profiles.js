const express = require('express');
const { supabase } = require('../supabase');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authorization header required' });
  }
  next();
}

// GET /profiles/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('app_profile')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) return next(error);
    if (!data) {
      return res.status(404).json({ error: 'NotFound', message: 'Profile not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /profiles/me (upsert)
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, display_name, location_city, location_state } = req.body || {};

    const payload = {
      id: userId,
      // Only include fields that are defined to avoid overwriting with null unintentionally
      ...(email !== undefined ? { email } : {}),
      ...(display_name !== undefined ? { display_name } : {}),
      ...(location_city !== undefined ? { location_city } : {}),
      ...(location_state !== undefined ? { location_state } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('app_profile')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /profiles?ids=a,b,c
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
    }
    const idsParam = (req.query.ids || '').toString().trim();
    if (!idsParam) {
      return res.json([]);
    }
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json([]);

    const { data, error } = await supabase
      .from('app_profile')
      .select('id, display_name')
      .in('id', ids);

    if (error) return next(error);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
