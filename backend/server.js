const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const contactsRouter = require('./routes/contacts');
const brandsRouter   = require('./routes/brands');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'https://apps.accunite.com',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/contacts', contactsRouter);
app.use('/api/brands',   brandsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use('/linkedin-contact-manager', express.static(path.join(__dirname, '../frontend/dist')));
  app.get('/linkedin-contact-manager/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✓ LinkedIn Contact Manager backend running on port ${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api/health\n`);
});
