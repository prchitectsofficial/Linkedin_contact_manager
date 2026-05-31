const express  = require('express');
const rdsPool  = require('../dbRDS');
const router   = express.Router();

// ── POST /api/brands ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      brand, client, designation, email, contact, company,
      website, linkedin, opinion, handler,
      conn_sent, conn_est, pitch_sent, linkedin_follow,
      email_outreach, email_from, pitch_response,
    } = req.body;

    if (!brand || !brand.trim())
      return res.status(400).json({ error: 'Brand name is required' });

    // Check duplicate
    const [existing] = await rdsPool.query(
      'SELECT id FROM bmi.brands WHERE brand = ?', [brand.trim()]
    );
    if (existing.length)
      return res.status(409).json({ error: `Brand "${brand}" already exists` });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await rdsPool.query(`
      INSERT INTO bmi.brands
        (brand, client, designation, email, contact, company,
         website, linkedin, opinion, handler,
         conn_sent, conn_est, est_date,
         pitch_sent, linkedin_follow, email_outreach,
         email_from, pitch_response, createdon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      brand.trim(), client || '', designation || '', email || '',
      contact || '', company || '', website || '', linkedin || '',
      opinion || '', handler || '',
      conn_sent ? 1 : 0,
      conn_est  ? 1 : 0,
      now,
      pitch_sent      ? 1 : 0,
      linkedin_follow ? 1 : 0,
      email_outreach  ? 1 : 0,
      email_from || '', pitch_response || '', now,
    ]);

    res.json({ success: true, message: `Brand "${brand}" added successfully` });
  } catch (err) {
    console.error('POST /brands error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
