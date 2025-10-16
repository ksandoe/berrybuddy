const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

module.exports = router;
