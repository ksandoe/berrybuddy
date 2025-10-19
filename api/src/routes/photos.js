const express = require('express');
const multer = require('multer');
const path = require('path');
const { supabase } = require('../supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

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

// GET /photos (public)
router.get('/', async (req, res, next) => {
  try {
    if (!requireSupabase(req, res)) return;
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const from = offset;
    const to = offset + limit - 1;

    const { data, error } = await supabase
      .from('photo')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .range(from, to);

    if (error) return next(error);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /photos (uploaded_by = current user)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { review_id, vendor_id, berry_id, photo_url, thumbnail, caption } = req.body || {};

    const payload = {
      review_id,
      vendor_id,
      berry_id,
      photo_url,
      thumbnail,
      caption,
      uploaded_by: userId,
    };

    const { data, error } = await supabase
      .from('photo')
      .insert(payload)
      .select('*')
      .single();

    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /photos/:id (owner-only)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('photo')
      .select('photo_id, uploaded_by')
      .eq('photo_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.uploaded_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const { review_id, vendor_id, berry_id, photo_url, thumbnail, caption } = req.body || {};
    const update = {
      ...(review_id !== undefined ? { review_id } : {}),
      ...(vendor_id !== undefined ? { vendor_id } : {}),
      ...(berry_id !== undefined ? { berry_id } : {}),
      ...(photo_url !== undefined ? { photo_url } : {}),
      ...(thumbnail !== undefined ? { thumbnail } : {}),
      ...(caption !== undefined ? { caption } : {}),
    };

    const { data, error } = await supabase
      .from('photo')
      .update(update)
      .eq('photo_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /photos/:id (owner-only)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('photo')
      .select('photo_id, uploaded_by')
      .eq('photo_id', id)
      .maybeSingle();
    if (fetchErr) return next(fetchErr);
    if (!existing || existing.uploaded_by !== userId) {
      return res.status(404).json({ error: 'NotFound', message: 'Not found or not owner' });
    }

    const { data, error } = await supabase
      .from('photo')
      .delete()
      .eq('photo_id', id)
      .select('*')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /photos/upload (owner-only; multipart form-data)
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!requireSupabase(req, res)) return;
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in server env' });
    }
    const userId = req.user.id;
    const { vendor_id, berry_id, review_id, caption } = req.body || {};
    if (!vendor_id) {
      return res.status(400).json({ error: 'BadRequest', message: 'vendor_id is required' });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'BadRequest', message: 'file is required' });
    }

    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const now = new Date();
    const key = `${vendor_id}/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,'0')}/${now.getTime()}-${Math.random().toString(36).slice(2)}${ext}`;

    const { data: upData, error: upErr } = await supabase
      .storage
      .from('berries')
      .upload(key, file.buffer, { contentType: file.mimetype || 'image/jpeg', upsert: false });
    if (upErr) {
      console.error('Storage upload failed:', upErr);
      return res.status(500).json({ error: 'StorageUploadFailed', message: upErr.message || String(upErr) });
    }

    const { data: pub } = supabase.storage.from('berries').getPublicUrl(key);
    const publicUrl = pub?.publicUrl || null;

    const payload = {
      review_id: review_id || null,
      vendor_id,
      berry_id: berry_id || null,
      photo_url: publicUrl,
      thumbnail: null,
      caption: caption || null,
      uploaded_by: userId,
    };

    const { data, error } = await supabase
      .from('photo')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      console.error('Photo insert failed:', error);
      return res.status(500).json({ error: 'PhotoInsertFailed', message: error.message || String(error) });
    }
    return res.status(201).json(data);
  } catch (err) {
    console.error('Unhandled upload error:', err);
    next(err);
  }
});

module.exports = router;
