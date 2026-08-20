const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

let transporter = null;
const getTransporter = () => {
  if (!transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

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
  const replies = db.prepare('SELECT * FROM lead_replies WHERE lead_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ...lead, replies });
});

// ─────────────────────────────────────────────
// POST /api/admin/leads/:id/reply – Send email reply
// ─────────────────────────────────────────────
router.post('/leads/:id/reply', async (req, res) => {
  const { recipient, subject, message } = req.body;
  const leadId = req.params.id;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (!recipient || !message) {
    return res.status(400).json({ error: 'Empfänger und Nachricht sind erforderlich' });
  }

  const sentBy = req.user?.username || 'admin';
  const sub = subject || 'Re: Ihre Anfrage bei Technogrips Vienna';

  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({
        from: '"Technogrips Vienna" <office@technogrips-vienna.at>',
        to: recipient,
        bcc: 'office@technogrips-vienna.at',
        subject: sub,
        text: message,
        html: `<div style="font-family:sans-serif; background:#111; color:#eee; padding:20px; border-radius:10px;">
          <h2 style="color:#e5c500;">TECHNOGRIPS VIENNA</h2>
          <div style="margin:20px 0; white-space:pre-wrap; font-size:15px; line-height:1.6;">${message}</div>
          <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
          <p style="color:#888; font-size:12px;">Technogrips Vienna · Gerhard Deimel · office@technogrips-vienna.at</p>
        </div>`
      });
      // Also send direct copy to office@technogrips-vienna.at
      await t.sendMail({
        from: '"Technogrips System" <webmaster@technogrips-vienna.at>',
        to: 'office@technogrips-vienna.at',
        subject: `[Admin-Antwort Kopie] ${sub}`,
        text: `Gesendet an: ${recipient}\n\n${message}`
      });
    } catch (e) {
      console.error('Email send error:', e.message);
    }
  }

  const info = db.prepare('INSERT INTO lead_replies (lead_id, recipient, subject, message, sent_by, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(leadId, recipient, sub, message, sentBy, 'sent');

  db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ? AND status = 'new'").run(leadId);

  const reply = db.prepare('SELECT * FROM lead_replies WHERE id = ?').get(info.lastInsertRowid);
  res.json({ success: true, message: 'Antwort gesendet und gespeichert (Kopie an office@technogrips-vienna.at)', reply });
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
  const { section, key, value_de, value_en, value_fr, value_cs } = req.body;
  if (!section || !key) return res.status(400).json({ error: 'section and key required' });

  db.prepare(`
    UPDATE page_content SET 
      value_de = ?, 
      value_en = ?, 
      value_fr = ?, 
      value_cs = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE section = ? AND key = ?
  `).run(value_de ?? '', value_en ?? '', value_fr ?? '', value_cs ?? '', section, key);

  res.json({ success: true, section, key });
});

// ─────────────────────────────────────────────
// PUT /api/admin/content/batch – Update multiple fields
// ─────────────────────────────────────────────
router.put('/content/batch', (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });

  const stmt = db.prepare(`
    UPDATE page_content SET 
      value_de = ?, 
      value_en = ?, 
      value_fr = ?, 
      value_cs = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE section = ? AND key = ?
  `);

  const batchUpdate = db.transaction((items) => {
    for (const item of items) {
      stmt.run(
        item.value_de ?? '', 
        item.value_en ?? '', 
        item.value_fr ?? '', 
        item.value_cs ?? '', 
        item.section, 
        item.key
      );
    }
  });

  batchUpdate(updates);
  res.json({ success: true, updated: updates.length });
});

module.exports = router;
