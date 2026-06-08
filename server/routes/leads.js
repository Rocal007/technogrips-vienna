const express = require('express');
const db = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter (lazy init)
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

// Send lead notification email
const notifyAdmin = async (lead) => {
  const t = getTransporter();
  if (!t || !process.env.ADMIN_EMAIL) return;

  const typeLabels = {
    contact: '📧 Kontaktanfrage',
    product: '🎥 Produktanfrage',
    catalog: '📖 Katalog-Download',
    booking: '📅 Beratungs-Buchung',
    newsletter: '📰 Newsletter'
  };

  try {
    await t.sendMail({
      from: `"${process.env.FROM_NAME || 'Technogrips Vienna'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🎬 Neuer Lead: ${typeLabels[lead.type] || lead.type} – ${lead.name || lead.email}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1e; color: #fff; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 16px 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #000;">🎬 Neuer Lead – Technogrips Vienna</h1>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; color: #9ca3af; width: 40%;">Typ</td><td style="padding: 8px; color: #fff; font-weight: 600;">${typeLabels[lead.type]}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">Name</td><td style="padding: 8px; color: #fff;">${lead.name || '–'}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">E-Mail</td><td style="padding: 8px; color: #f59e0b;">${lead.email}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">Telefon</td><td style="padding: 8px; color: #fff;">${lead.phone || '–'}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">Produkt</td><td style="padding: 8px; color: #fff;">${lead.product || '–'}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">Datum</td><td style="padding: 8px; color: #fff;">${lead.event_date || lead.booking_date || '–'}</td></tr>
            <tr><td style="padding: 8px; color: #9ca3af;">Nachricht</td><td style="padding: 8px; color: #fff;">${lead.message || '–'}</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #111827; border-radius: 8px; text-align: center;">
            <a href="http://localhost:3000/admin" style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700;">Im Admin Panel ansehen</a>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('📧 Email notification failed:', err.message);
  }
};

// Validate email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// INSERT lead helper
const insertLead = (data) => {
  const stmt = db.prepare(`
    INSERT INTO leads (type, name, email, phone, company, message, product, event_date, duration, booking_date, booking_time, language, source, ip, user_agent)
    VALUES (@type, @name, @email, @phone, @company, @message, @product, @event_date, @duration, @booking_date, @booking_time, @language, @source, @ip, @user_agent)
  `);
  const result = stmt.run(data);
  return db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
};

// ─────────────────────────────────────────────
// POST /api/leads/contact – Kontaktformular
// ─────────────────────────────────────────────
router.post('/contact', async (req, res) => {
  const { name, email, phone, company, message, language } = req.body;

  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });
  if (!message) return res.status(400).json({ error: 'Nachricht erforderlich' });

  const lead = insertLead({
    type: 'contact', name, email,
    phone: phone || null, company: company || null, message,
    product: null, event_date: null, duration: null,
    booking_date: null, booking_time: null,
    language: language || 'de',
    source: 'contact-form',
    ip: req.ip, user_agent: req.get('user-agent')
  });

  notifyAdmin(lead);
  res.status(201).json({ success: true, message: 'Vielen Dank! Wir melden uns bald.', id: lead.id });
});

// ─────────────────────────────────────────────
// POST /api/leads/product – Produktanfrage
// ─────────────────────────────────────────────
router.post('/product', async (req, res) => {
  const { name, email, phone, company, product, event_date, duration, message, language } = req.body;

  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });
  if (!product) return res.status(400).json({ error: 'Produkt erforderlich' });

  const lead = insertLead({
    type: 'product', name, email,
    phone: phone || null, company: company || null, message: message || null,
    product, event_date: event_date || null, duration: duration || null,
    booking_date: null, booking_time: null,
    language: language || 'de',
    source: 'product-inquiry',
    ip: req.ip, user_agent: req.get('user-agent')
  });

  notifyAdmin(lead);
  res.status(201).json({ success: true, message: 'Anfrage erhalten! Wir senden Ihnen ein Angebot.', id: lead.id });
});

// ─────────────────────────────────────────────
// POST /api/leads/catalog – Katalog-Download
// ─────────────────────────────────────────────
router.post('/catalog', async (req, res) => {
  const { name, email, language } = req.body;

  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });

  const lead = insertLead({
    type: 'catalog', name: name || null, email,
    phone: null, company: null, message: null,
    product: null, event_date: null, duration: null,
    booking_date: null, booking_time: null,
    language: language || 'de',
    source: 'catalog-download',
    ip: req.ip, user_agent: req.get('user-agent')
  });

  notifyAdmin(lead);
  // Return the catalog download URL (Supertechno PDF)
  res.status(201).json({
    success: true,
    message: 'Katalog wird heruntergeladen...',
    downloadUrl: 'https://www.supertechno.com/download.php?fid=1069',
    id: lead.id
  });
});

// ─────────────────────────────────────────────
// POST /api/leads/booking – Beratungs-Buchung
// ─────────────────────────────────────────────
router.post('/booking', async (req, res) => {
  const { name, email, phone, company, booking_date, booking_time, message, language } = req.body;

  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });
  if (!booking_date) return res.status(400).json({ error: 'Datum erforderlich' });

  const lead = insertLead({
    type: 'booking', name, email,
    phone: phone || null, company: company || null, message: message || null,
    product: null, event_date: null, duration: null,
    booking_date, booking_time: booking_time || null,
    language: language || 'de',
    source: 'consultation-booking',
    ip: req.ip, user_agent: req.get('user-agent')
  });

  notifyAdmin(lead);
  res.status(201).json({ success: true, message: 'Buchung bestätigt! Wir kontaktieren Sie zur Terminbestätigung.', id: lead.id });
});

// ─────────────────────────────────────────────
// POST /api/leads/newsletter – Newsletter
// ─────────────────────────────────────────────
router.post('/newsletter', async (req, res) => {
  const { name, email, language } = req.body;

  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });

  // Check newsletter_subscribers table too
  try {
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email, name, language) VALUES (?, ?, ?)').run(email, name || null, language || 'de');
  } catch (e) {}

  const lead = insertLead({
    type: 'newsletter', name: name || null, email,
    phone: null, company: null, message: null,
    product: null, event_date: null, duration: null,
    booking_date: null, booking_time: null,
    language: language || 'de',
    source: 'newsletter',
    ip: req.ip, user_agent: req.get('user-agent')
  });

  notifyAdmin(lead);
  res.status(201).json({ success: true, message: 'Erfolgreich angemeldet!', id: lead.id });
});

module.exports = router;
