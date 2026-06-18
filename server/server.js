require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Security Middleware ──────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow CDN resources
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://technogrips.at', 'https://www.technogrips.at']
    : '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Zu viele Anfragen. Bitte warten.' }
});

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Zu viele Formular-Übermittlungen.' }
});

app.use('/api/', apiLimiter);
app.use('/api/leads/', leadLimiter);

// ── Static Files ─────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/media', require('./routes/media'));

// ── Public Content API (CMS) ─────────────────
const db = require('./db');
app.get('/api/content', (req, res) => {
  const rows = db.prepare('SELECT section, key, value_de, value_en FROM page_content ORDER BY section, key').all();
  const content = {};
  for (const row of rows) {
    if (!content[row.section]) content[row.section] = {};
    content[row.section][row.key] = { de: row.value_de, en: row.value_en };
  }
  res.json(content);
});

// ── Public Sections Visibility (no auth needed) ───────
app.get('/api/sections', (req, res) => {
  const rows = db.prepare('SELECT page, section_key, visible, sort_order FROM page_sections').all();
  const result = {};
  for (const r of rows) {
    if (!result[r.page]) result[r.page] = {};
    result[r.page][r.section_key] = { visible: r.visible === 1, sort_order: r.sort_order };
  }
  res.json(result);
});

// ── Health Check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Page Routes ─────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});
app.get('/leistungen', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/leistungen/index.html'));
});
app.get('/supertechno-50', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/supertechno-50/index.html'));
});
app.get('/kran-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/kran-test/index.html'));
});
app.get('/ueber-uns', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ueber-uns/index.html'));
});
app.get('/kontakt', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/kontakt/index.html'));
});
// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
// 404 fallback
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Error Handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Start Server ─────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  🎬 ────────────────────────────────────────');
  console.log('     Technogrips Vienna – Server gestartet!');
  console.log('  ────────────────────────────────────────────');
  console.log(`  🌐 Frontend:  http://localhost:${PORT}`);
  console.log(`  🔧 Admin:     http://localhost:${PORT}/admin`);
  console.log(`  📡 API:       http://localhost:${PORT}/api/health`);
  console.log('  ────────────────────────────────────────────');
  console.log('');
});

module.exports = app;
