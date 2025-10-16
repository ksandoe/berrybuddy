const express = require('express');
const { supabaseAnon } = require('../supabase');

const router = express.Router();

function requireAnonClient(req, res) {
  if (!supabaseAnon) {
    res.status(500).json({ error: 'CONFIG_ERROR', message: 'Supabase publishable key is not configured. Set SUPABASE_PUBLISHABLE_KEY in .env.' });
    return false;
  }
  return true;
}

// POST /auth/otp/start { email, create_if_missing? }
// Sends a one-time code to the email. No redirect URL needed for code flow.
router.post('/otp/start', async (req, res, next) => {
  try {
    if (!requireAnonClient(req, res)) return;
    const { email, create_if_missing } = req.body || {};
    const { data, error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: create_if_missing !== false,
      },
    });
    if (error) return next(error);
    res.status(200).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /auth/otp/verify { email, token }
// Exchanges the code for a session (returns access_token & user)
router.post('/otp/verify', async (req, res, next) => {
  try {
    if (!requireAnonClient(req, res)) return;
    const { email, token } = req.body || {};
    const { data, error } = await supabaseAnon.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) return next(error);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
