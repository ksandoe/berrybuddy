const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
let supabaseAnon = null;
if (!url || !secretKey) {
  // Do not throw; allow app to start so /health works. Other routes will error with clear message.
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
} else {
  supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

if (!url || !publishableKey) {
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY (auth routes may fail)');
} else {
  supabaseAnon = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

module.exports = { supabase, supabaseAnon };
