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
const authMiddleware = require('./middleware/auth');

function getContentHandler(req, res) {
  const rows = db.prepare('SELECT * FROM page_content ORDER BY section, key').all();
  if (req.query.format === 'array') {
    return res.json(rows);
  }
  const content = {};
  for (const row of rows) {
    if (!content[row.section]) content[row.section] = {};
    content[row.section][row.key] = {
      de: row.value_de || '',
      en: row.value_en || '',
      fr: row.value_fr || row.value_en || row.value_de || '',
      cs: row.value_cs || row.value_en || row.value_de || ''
    };
  }
  res.json(content);
}

function putContentHandler(req, res) {
  const input = req.body;
  if (input.updates && Array.isArray(input.updates)) {
    const updateStmt = db.prepare('UPDATE page_content SET value_de = ?, value_en = ?, value_fr = ?, value_cs = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ?');
    const insertStmt = db.prepare('INSERT INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    const batch = db.transaction((items) => {
      for (const item of items) {
        const info = updateStmt.run(item.value_de ?? '', item.value_en ?? '', item.value_fr ?? '', item.value_cs ?? '', item.section, item.key);
        if (info.changes === 0) {
          insertStmt.run(item.section, item.key, item.label || item.key, item.value_de ?? '', item.value_en ?? '', item.value_fr ?? '', item.value_cs ?? '', item.type || 'text');
        }
      }
    });
    batch(input.updates);
    return res.json({ success: true, updated: input.updates.length });
  }

  if (input.section && input.key) {
    const updateStmt = db.prepare('UPDATE page_content SET value_de = ?, value_en = ?, value_fr = ?, value_cs = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ?');
    const info = updateStmt.run(input.value_de ?? '', input.value_en ?? '', input.value_fr ?? '', input.value_cs ?? '', input.section, input.key);
    if (info.changes === 0) {
      db.prepare('INSERT INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(input.section, input.key, input.label || input.key, input.value_de ?? '', input.value_en ?? '', input.value_fr ?? '', input.value_cs ?? '', input.type || 'text');
    }
    return res.json({ success: true });
  }

  res.status(400).json({ error: 'Invalid payload' });
}

app.get('/api/content', getContentHandler);
app.get('/api/content.php', getContentHandler);
app.put('/api/content', authMiddleware, putContentHandler);
app.put('/api/content.php', authMiddleware, putContentHandler);

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
app.get('/tracking', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/tracking/index.html'));
});
app.get('/ueber-uns', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ueber-uns/index.html'));
});
app.get('/kontakt', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/kontakt/index.html'));
});
app.get('/impressum', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/impressum/index.html'));
});
app.get('/datenschutz', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/datenschutz/index.html'));
});
app.get('/agb', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/agb/index.html'));
});
// Aliases
app.get('/imprint', (req, res) => res.redirect(301, '/impressum'));
app.get('/privacy', (req, res) => res.redirect(301, '/datenschutz'));
app.get('/terms', (req, res) => res.redirect(301, '/agb'));
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
if (require.main === module) {
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
}

module.exports = app;
