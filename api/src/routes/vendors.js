const express = require('express');
const { supabase } = require('../supabase');
const router = express.Router();

// GET /vendors
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const from = offset;
    const to = offset + limit - 1;
    const berryId = req.query.berry_id || null;

    // Optional: filter vendors by berry via price table relationship
    let vendorIdsFilter = null;
    if (berryId) {
      const { data: priceRows, error: berrErr } = await supabase
        .from('price')
        .select('vendor_id')
        .eq('berry_id', berryId);
      if (berrErr) return next(berrErr);
      const ids = Array.from(new Set((priceRows || []).map(r => r.vendor_id))).filter(Boolean);
      if (ids.length === 0) return res.json([]);
      vendorIdsFilter = ids;
    }

    let vq = supabase.from('vendor').select('*');
    if (vendorIdsFilter) {
      vq = vq.in('vendor_id', vendorIdsFilter);
    }
    const { data: vendors, error } = await vq.range(from, to);

    if (error) return next(error);
    const list = vendors || [];
    if (list.length === 0) return res.json([]);

    const vendorIds = list.map(v => v.vendor_id);

    // Fetch reviews for aggregation
    const { data: reviews, error: revErr } = await supabase
      .from('review')
      .select('vendor_id, rating, created_at')
      .in('vendor_id', vendorIds);
    if (revErr) return next(revErr);

    // Fetch prices for last update recency
    const { data: prices, error: priceErr } = await supabase
      .from('price')
      .select('vendor_id, reported_at')
      .in('vendor_id', vendorIds);
    if (priceErr) return next(priceErr);

    const revAgg = new Map();
    for (const r of reviews || []) {
      const key = r.vendor_id;
      const a = revAgg.get(key) || { sum: 0, count: 0, lastReviewAt: null };
      a.sum += (r.rating || 0);
      a.count += 1;
      a.lastReviewAt = !a.lastReviewAt || new Date(r.created_at) > new Date(a.lastReviewAt) ? r.created_at : a.lastReviewAt;
      revAgg.set(key, a);
    }

    const priceAgg = new Map();
    for (const p of prices || []) {
      const key = p.vendor_id;
      const curr = priceAgg.get(key);
      const t = p.reported_at;
      if (!curr || (t && new Date(t) > new Date(curr))) {
        priceAgg.set(key, t);
      }
    }

    const enriched = list.map(v => {
      const r = revAgg.get(v.vendor_id);
      const quality_score = r && r.count > 0 ? Number((r.sum / r.count).toFixed(2)) : null;
      const lastReviewAt = r ? r.lastReviewAt : null;
      const lastPriceAt = priceAgg.get(v.vendor_id) || null;
      const last_update = [lastReviewAt, lastPriceAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;
      return { ...v, quality_score, last_update };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /vendors/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.' });
    }
    const { id } = req.params;

    const { data: vendor, error: vErr } = await supabase
      .from('vendor')
      .select('*')
      .eq('vendor_id', id)
      .maybeSingle();
    if (vErr) return next(vErr);
    if (!vendor) return res.status(404).json({ error: 'NotFound', message: 'Vendor not found' });

    // Aggregate quality score and last update
    const [{ data: revs }, { data: prices }] = await Promise.all([
      supabase.from('review').select('rating, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('price').select('reported_at').eq('vendor_id', id).order('reported_at', { ascending: false }).limit(20),
    ]);

    let quality_score = null;
    if (revs && revs.length) {
      const sum = revs.reduce((s, r) => s + (r.rating || 0), 0);
      quality_score = Number((sum / revs.length).toFixed(2));
    }
    const lastReviewAt = revs && revs.length ? revs[0].created_at : null;
    const lastPriceAt = prices && prices.length ? prices[0].reported_at : null;
    const last_update = [lastReviewAt, lastPriceAt]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null;

    // Recent reviews and photos
    const [{ data: recentReviews, error: rErr }, { data: recentPhotos, error: pErr }] = await Promise.all([
      supabase.from('review').select('*').eq('vendor_id', id).order('created_at', { ascending: false }).limit(5),
      supabase.from('photo').select('*').eq('vendor_id', id).order('uploaded_at', { ascending: false }).limit(5),
    ]);
    if (rErr) return next(rErr);
    if (pErr) return next(pErr);

    res.json({
      ...vendor,
      quality_score,
      last_update,
      recent_reviews: recentReviews || [],
      recent_photos: recentPhotos || [],
      specials: [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
