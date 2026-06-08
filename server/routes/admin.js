const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Support token as query param for CSV downloads (browser direct link)
const flexAuth = (req, res, next) => {
  if (req.query.token && !req.headers['authorization']) {
    req.headers['authorization'] = `Bearer ${req.query.token}`;
  }
  authMiddleware(req, res, next);
};

// All admin routes are protected
router.use(flexAuth);

// ─────────────────────────────────────────────
// GET /api/admin/stats – Dashboard KPIs
// ─────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const todayCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = ?").get(today).count;
  const weekCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) >= ?").get(weekAgo).count;
  const monthCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) >= ?").get(monthAgo).count;

  const byType = db.prepare("SELECT type, COUNT(*) as count FROM leads GROUP BY type").all();
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();

  const qualified = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status IN ('qualified','closed')").get().count;
  const conversionRate = total > 0 ? Math.round((qualified / total) * 100) : 0;

  // Last 30 days timeline
  const timeline = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM leads
    WHERE DATE(created_at) >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(monthAgo);

  // Recent leads
  const recent = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    total, todayCount, weekCount, monthCount,
    conversionRate, qualified,
    byType, byStatus, timeline, recent
  });
});

// ─────────────────────────────────────────────
// GET /api/admin/leads – All leads with filters
// ─────────────────────────────────────────────
router.get('/leads', (req, res) => {
  const { type, status, search, from, to, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];

  if (type && type !== 'all') { where.push('type = ?'); params.push(type); }
  if (status && status !== 'all') { where.push('status = ?'); params.push(status); }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (from) { where.push('DATE(created_at) >= ?'); params.push(from); }
  if (to) { where.push('DATE(created_at) <= ?'); params.push(to); }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM leads ${whereClause}`).get(...params);
  const leads = db.prepare(`SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({
    leads,
    total: totalRow.count,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(totalRow.count / parseInt(limit))
  });
});

// ─────────────────────────────────────────────
// GET /api/admin/leads/:id – Single lead
// ─────────────────────────────────────────────
router.get('/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// ─────────────────────────────────────────────
// PATCH /api/admin/leads/:id – Update lead
// ─────────────────────────────────────────────
router.patch('/leads/:id', (req, res) => {
  const { status, notes } = req.body;
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ─────────────────────────────────────────────
// DELETE /api/admin/leads/:id – Delete lead
// ─────────────────────────────────────────────
router.delete('/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Lead deleted' });
});

// ─────────────────────────────────────────────
// GET /api/admin/export/csv – CSV Export
// ─────────────────────────────────────────────
router.get('/export/csv', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();

  const headers = ['id','type','name','email','phone','company','message','product','event_date','duration','booking_date','booking_time','language','status','notes','source','created_at'];
  const csvRows = [
    headers.join(','),
    ...leads.map(lead =>
      headers.map(h => {
        const val = lead[h] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="technogrips-leads-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send('\uFEFF' + csvRows.join('\n')); // BOM for Excel
});

// ─────────────────────────────────────────────
// GET /api/admin/newsletter – Newsletter subscribers
// ─────────────────────────────────────────────
router.get('/newsletter', (req, res) => {
  const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  res.json(subscribers);
});

// ─────────────────────────────────────────────
// GET /api/admin/content – All CMS content
// ─────────────────────────────────────────────
router.get('/content', (req, res) => {
  const rows = db.prepare('SELECT * FROM page_content ORDER BY section, key').all();
  res.json(rows);
});

// ─────────────────────────────────────────────
// GET /api/admin/content/:section – Section content
// ─────────────────────────────────────────────
router.get('/content/:section', (req, res) => {
  const rows = db.prepare('SELECT * FROM page_content WHERE section = ? ORDER BY key').all(req.params.section);
  res.json(rows);
});

// ─────────────────────────────────────────────
// PUT /api/admin/content – Update a field
// ─────────────────────────────────────────────
router.put('/content', (req, res) => {
  const { section, key, value_de, value_en } = req.body;
  if (!section || !key) return res.status(400).json({ error: 'section and key required' });

  db.prepare(`
    UPDATE page_content SET value_de = ?, value_en = ?, updated_at = CURRENT_TIMESTAMP
    WHERE section = ? AND key = ?
  `).run(value_de, value_en, section, key);

  res.json({ success: true, section, key });
});

// ─────────────────────────────────────────────
// PUT /api/admin/content/batch – Update multiple fields
// ─────────────────────────────────────────────
router.put('/content/batch', (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });

  const stmt = db.prepare(`
    UPDATE page_content SET value_de = ?, value_en = ?, updated_at = CURRENT_TIMESTAMP
    WHERE section = ? AND key = ?
  `);

  const batchUpdate = db.transaction((items) => {
    for (const { section, key, value_de, value_en } of items) {
      stmt.run(value_de, value_en, section, key);
    }
  });

  batchUpdate(updates);
  res.json({ success: true, updated: updates.length });
});

module.exports = router;
