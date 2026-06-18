const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Multer setup ───────────────────────────────
const uploadDir = path.join(__dirname, '../../public/assets/images/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
    const unique = Date.now() + '-' + safe;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// ══════════════════════════════════════════════
// MEDIA ROUTES
// ══════════════════════════════════════════════

// GET /api/media – List all media
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM media';
  const params = [];
  const where = [];
  if (category && category !== 'all') { where.push('category = ?'); params.push(category); }
  if (search) { where.push('(original_name LIKE ? OR alt_text LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY uploaded_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/media/categories – List all distinct categories
router.get('/categories', (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM media ORDER BY category').all().map(r => r.category);
  res.json(cats);
});

// POST /api/media/upload – Upload one or more images
router.post('/upload', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Keine Dateien empfangen' });
  const category = req.body.category || 'uploads';
  const ins = db.prepare(`
    INSERT OR IGNORE INTO media (filename, original_name, mime_type, size_bytes, path, url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const inserted = [];
  for (const f of req.files) {
    const url = `/assets/images/uploads/${f.filename}`;
    ins.run(f.filename, f.originalname, f.mimetype, f.size, f.path, url, category);
    inserted.push({ filename: f.filename, url, original_name: f.originalname, size_bytes: f.size });
  }
  res.json({ success: true, files: inserted });
});

// PATCH /api/media/:id – Update alt text or category
router.patch('/:id', (req, res) => {
  const { alt_text, category } = req.body;
  const row = db.prepare('SELECT id FROM media WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  const updates = [];
  const params = [];
  if (alt_text !== undefined) { updates.push('alt_text = ?'); params.push(alt_text); }
  if (category)               { updates.push('category = ?'); params.push(category); }
  if (!updates.length) return res.status(400).json({ error: 'Nichts zu aktualisieren' });
  params.push(req.params.id);
  db.prepare(`UPDATE media SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// DELETE /api/media/:id – Delete image from DB + filesystem
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  // Only delete from filesystem if it's in uploads dir (don't delete original assets)
  if (row.path && row.path.includes('uploads') && fs.existsSync(row.path)) {
    try { fs.unlinkSync(row.path); } catch(e) { /* ignore */ }
  }
  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Bild gelöscht' });
});

// DELETE /api/media/asset – Delete any asset by path (with safety check)
router.delete('/asset/delete', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const row = db.prepare('SELECT * FROM media WHERE url = ?').get(url);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  // Remove from DB
  db.prepare('DELETE FROM media WHERE url = ?').run(url);
  // Remove file from filesystem
  const filePath = path.join(__dirname, '../../public', url);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch(e) { /* ignore */ }
  }
  res.json({ success: true });
});

// ══════════════════════════════════════════════
// PAGE SECTIONS ROUTES
// ══════════════════════════════════════════════

// GET /api/media/sections/:page – All sections for a page
router.get('/sections/:page', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM page_sections WHERE page = ? ORDER BY sort_order ASC'
  ).all(req.params.page);
  res.json(rows);
});

// PATCH /api/media/sections/:page/:section_key – Toggle visibility
router.patch('/sections/:page/:section_key', (req, res) => {
  const { visible } = req.body;
  if (visible === undefined) return res.status(400).json({ error: 'visible required' });
  db.prepare(`
    UPDATE page_sections SET visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE page = ? AND section_key = ?
  `).run(visible ? 1 : 0, req.params.page, req.params.section_key);
  res.json({ success: true });
});

// PUT /api/media/sections – Batch update section visibility
router.put('/sections', (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });
  const stmt = db.prepare(`
    UPDATE page_sections SET visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE page = ? AND section_key = ?
  `);
  const batch = db.transaction((rows) => { for (const r of rows) stmt.run(r.visible ? 1 : 0, r.page, r.section_key); });
  batch(updates);
  res.json({ success: true, updated: updates.length });
});

// PUT /api/media/sections/order – Update section sort_order
router.put('/sections/order', (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'orders array required' });
  const stmt = db.prepare(`
    UPDATE page_sections SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE page = ? AND section_key = ?
  `);
  const batch = db.transaction((rows) => { 
    for (const r of rows) stmt.run(r.sort_order, r.page, r.section_key); 
  });
  batch(orders);
  res.json({ success: true, updated: orders.length });
});

// GET /api/media/sections-public – Public endpoint for frontend to check visibility
router.get('/sections-public', (req, res) => {
  // This endpoint is accessible without auth for frontend use
  const rows = db.prepare('SELECT page, section_key, visible, sort_order FROM page_sections').all();
  const result = {};
  for (const r of rows) {
    if (!result[r.page]) result[r.page] = {};
    result[r.page][r.section_key] = { visible: r.visible === 1, sort_order: r.sort_order };
  }
  res.json(result);
});

module.exports = router;
