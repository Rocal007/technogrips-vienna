require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(process.env.DB_PATH || './data/leads.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('contact','product','catalog','booking','newsletter')),
      name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      message TEXT,
      product TEXT,
      event_date TEXT,
      duration TEXT,
      booking_date TEXT,
      booking_time TEXT,
      language TEXT DEFAULT 'de',
      status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','closed','spam')),
      notes TEXT,
      source TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      language TEXT DEFAULT 'de',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Trigger to update updated_at
    CREATE TRIGGER IF NOT EXISTS leads_updated_at
      AFTER UPDATE ON leads
      BEGIN
        UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    -- Index for common queries
    CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

    -- CMS Content table
    CREATE TABLE IF NOT EXISTS page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      key TEXT NOT NULL,
      label TEXT,
      value_de TEXT,
      value_en TEXT,
      type TEXT DEFAULT 'text',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(section, key)
    );

    -- Sektions-Sichtbarkeit pro Seite
    CREATE TABLE IF NOT EXISTS page_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      section_key TEXT NOT NULL,
      label TEXT,
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page, section_key)
    );

    -- Medien-Verwaltung
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
      path TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      alt_text TEXT DEFAULT '',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database schema initialized');
};

// Seed admin user if not exists
const seedAdmin = () => {
  const bcrypt = require('bcryptjs');
  const adminUsername = process.env.ADMIN_USERNAME || 'joachim.nauen@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'technogrips-vienna';
  
  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(adminUsername);
  const hash = bcrypt.hashSync(adminPassword, 10);
  
  if (!existing) {
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(adminUsername, hash);
    console.log(`✅ Admin user created (username: ${adminUsername})`);
  } else {
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, adminUsername);
    console.log(`✅ Admin user password updated/verified (username: ${adminUsername})`);
  }
  
  // Clean up legacy default admin if username has changed
  if (adminUsername !== 'admin') {
    db.prepare('DELETE FROM admin_users WHERE username = ?').run('admin');
  }
};

// Seed default CMS content
const seedContent = () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO page_content (section, key, label, value_de, value_en, type)
    VALUES (@section, @key, @label, @value_de, @value_en, @type)
  `);

  const defaults = [
    // ── HERO ──────────────────────────────────────────────────
    { section:'hero', key:'badge',      label:'Badge-Text',     type:'text',
      value_de:'Wien, Österreich – Professioneller Operator-Service',
      value_en:'Vienna, Austria – Professional Operator Service' },
    { section:'hero', key:'headline1',  label:'Headline Zeile 1', type:'text',
      value_de:'Der Kran.', value_en:'The Crane.' },
    { section:'hero', key:'headline2',  label:'Headline Zeile 2 (Gold)', type:'text',
      value_de:'Der Operator.', value_en:'The Operator.' },
    { section:'hero', key:'headline3',  label:'Headline Zeile 3', type:'text',
      value_de:'Ihr Shot.', value_en:'Your Shot.' },
    { section:'hero', key:'subline',    label:'Unterzeile / Beschreibung', type:'textarea',
      value_de:'Wir stellen professionelle Supertechno Teleskop-Kamerakrane mit erfahrenen Operators zur Verfügung – für Film-, TV- und Eventproduktionen in Wien und ganz Österreich.',
      value_en:'We provide professional Supertechno telescopic camera cranes with experienced operators – for film, TV and event productions in Vienna and all of Austria.' },
    { section:'hero', key:'cta_primary',   label:'Button 1 Text', type:'text',
      value_de:'Kostenlos anfragen', value_en:'Free Quote' },
    { section:'hero', key:'cta_secondary',  label:'Button 2 Text', type:'text',
      value_de:'Katalog herunterladen', value_en:'Download Catalog' },
    { section:'hero', key:'bg_image', label:'Hintergrundbild', type:'image',
      value_de:'/assets/images/crane_50.png', value_en:'/assets/images/crane_50.png' },
    { section:'hero', key:'stat1_num',  label:'Stat 1 Zahl', type:'text', value_de:'20+', value_en:'20+' },
    { section:'hero', key:'stat1_label',label:'Stat 1 Label', type:'text', value_de:'Jahre Erfahrung', value_en:'Years Experience' },
    { section:'hero', key:'stat2_num',  label:'Stat 2 Zahl', type:'text', value_de:'500+', value_en:'500+' },
    { section:'hero', key:'stat2_label',label:'Stat 2 Label', type:'text', value_de:'Produktionen', value_en:'Productions' },
    { section:'hero', key:'stat3_num',  label:'Stat 3 Zahl', type:'text', value_de:'50+', value_en:'50+' },
    { section:'hero', key:'stat3_label',label:'Stat 3 Label', type:'text', value_de:'Supertechno', value_en:'Supertechno' },
    { section:'hero', key:'stat4_num',  label:'Stat 4 Zahl', type:'text', value_de:'24/7', value_en:'24/7' },
    { section:'hero', key:'stat4_label',label:'Stat 4 Label', type:'text', value_de:'Verfügbarkeit', value_en:'Availability' },

    // ── SERVICES ──────────────────────────────────────────────
    { section:'services', key:'section_label', label:'Abschnitts-Label', type:'text',
      value_de:'Was wir bieten', value_en:'What We Offer' },
    { section:'services', key:'headline', label:'Überschrift', type:'text',
      value_de:'Unser Service', value_en:'Our Services' },
    { section:'services', key:'subline',  label:'Unterzeile', type:'text',
      value_de:'Von der Buchung bis zum letzten Shot – wir stellen alles bereit.',
      value_en:'From booking to the last shot – we provide everything.' },
    { section:'services', key:'s1_title', label:'Service 1 Titel', type:'text',
      value_de:'Kran-Vermietung', value_en:'Crane Rental' },
    { section:'services', key:'s1_desc',  label:'Service 1 Text', type:'textarea',
      value_de:'Supertechno 50+ Teleskop-Kamerakran für jeden Produktionsumfang. Tages- und Wochenmiete möglich.',
      value_en:'Supertechno 50+ telescopic camera crane for every production scale. Daily and weekly rental available.' },
    { section:'services', key:'s2_title', label:'Service 2 Titel', type:'text',
      value_de:'Operator-Service', value_en:'Operator Service' },
    { section:'services', key:'s2_desc',  label:'Service 2 Text', type:'textarea',
      value_de:'Wir sind zu mieten und bedienen den Kran selbst. Mit über 20 Jahren Erfahrung bringen wir den Shot sicher ins Ziel.',
      value_en:"We're available for hire and operate the crane ourselves. With over 20 years of experience, we deliver the shot safely." },
    { section:'services', key:'s3_title', label:'Service 3 Titel', type:'text',
      value_de:'Technischer Support', value_en:'Technical Support' },
    { section:'services', key:'s3_desc',  label:'Service 3 Text', type:'textarea',
      value_de:'Technische Beratung und Betreuung für Ihre Produktion. Wir arbeiten mit allen gängigen Remote-Head-Systemen.',
      value_en:'Technical consultation and support for your production. We work with all common remote head systems.' },

    // ── PRODUKT ───────────────────────────────────────────────
    { section:'product', key:'section_label', label:'Abschnitts-Label', type:'text',
      value_de:'Das Produkt', value_en:'The Product' },
    { section:'product', key:'subline', label:'Unterzeile', type:'text',
      value_de:'Das professionelle Teleskop-Kamerakransystem – mit Operator-Service aus Wien.',
      value_en:'The professional telescopic camera crane system – with operator service from Vienna.' },
    { section:'product', key:'tagline', label:'Tagline (Gold)', type:'text',
      value_de:'Das vielseitigste Teleskop-Kamerakransystem.', value_en:'The most versatile telescopic camera crane system.' },
    { section:'product', key:'description', label:'Beschreibungstext', type:'textarea',
      value_de:'Der Supertechno 50+ ist das meistverwendete Teleskop-Kamerakransystem weltweit. Er ist Indoor und Outdoor einsetzbar und bietet mit dem Techno S-Head präzise Kamerasteuerung für jeden Shot – von der engen Studio-Aufnahme bis zum großen Outdoor-Event.',
      value_en:"The Supertechno 50+ is the world's most widely used telescopic camera crane system. It works indoors and outdoors, and with the Techno S-Head provides precise camera control for every shot – from tight studio work to large outdoor events." },
    { section:'product', key:'spec_reach',   label:'Spec: Reichweite', type:'text', value_de:'15,11m', value_en:'15.11m' },
    { section:'product', key:'spec_payload', label:'Spec: Nutzlast',   type:'text', value_de:'100kg', value_en:'100kg' },
    { section:'product', key:'spec_pan',     label:'Spec: Schwenk',    type:'text', value_de:'360°', value_en:'360°' },
    { section:'product', key:'spec_use',     label:'Spec: Einsatz',    type:'text', value_de:'In/Out', value_en:'In/Out' },
    { section:'product', key:'spec_head',    label:'Spec: Remote-Head',type:'text', value_de:'S-Head', value_en:'S-Head' },
    { section:'product', key:'use1_title',   label:'Einsatz 1 Titel',  type:'text', value_de:'Film & Kino', value_en:'Film & Cinema' },
    { section:'product', key:'use1_desc',    label:'Einsatz 1 Text',   type:'textarea',
      value_de:'Bewährt in nationalen und internationalen Kinoproduktionen. Ideale Reichweite für Establishing Shots und Crane-Moves.',
      value_en:'Proven in national and international cinema productions. Ideal reach for establishing shots and crane moves.' },
    { section:'product', key:'use2_title',   label:'Einsatz 2 Titel',  type:'text', value_de:'TV & Werbung', value_en:'TV & Commercials' },
    { section:'product', key:'use2_desc',    label:'Einsatz 2 Text',   type:'textarea',
      value_de:'Ideal für zeitkritische TV-Produktionen und Werbeaufnahmen. Schnelle Einrichtung am Set.',
      value_en:'Ideal for time-critical TV productions and commercial shoots. Fast setup on set.' },
    { section:'product', key:'use3_title',   label:'Einsatz 3 Titel',  type:'text', value_de:'Events & Konzerte', value_en:'Events & Concerts' },
    { section:'product', key:'use3_desc',    label:'Einsatz 3 Text',   type:'textarea',
      value_de:'Spektakuläre Shots bei Konzerten, Sportevents und Messen. Maximale Flexibilität dank Outdoor-Eignung.',
      value_en:'Spectacular shots at concerts, sports events and trade fairs. Maximum flexibility thanks to outdoor suitability.' },
    { section:'product', key:'use4_title',   label:'Einsatz 4 Titel',  type:'text', value_de:'Sport', value_en:'Sports' },
    { section:'product', key:'use4_desc',    label:'Einsatz 4 Text',   type:'textarea',
      value_de:'Live-Übertragungen von Sport-Events, Motorsport und Action-Aufnahmen. Dynamische Fahrten und präzise Verfolgung in Höchstgeschwindigkeit.',
      value_en:'Live sports broadcasting, motorsports and action shots. Dynamic moves and precise tracking at maximum speed.' },

    // ── ÜBER UNS ──────────────────────────────────────────────
    { section:'about', key:'section_label', label:'Abschnitts-Label', type:'text',
      value_de:'Warum Technogrips', value_en:'Why Technogrips' },
    { section:'about', key:'headline', label:'Überschrift', type:'text',
      value_de:'Wien-basiert. Weltweit erfahren.', value_en:'Vienna-based. World-class experience.' },
    { section:'about', key:'intro',    label:'Einleitungstext', type:'textarea',
      value_de:'Als Operator-Team mit Sitz in Wien bieten wir nicht nur das Equipment – wir sind das Equipment. Unser Service umfasst die vollständige Betreuung von der Planung bis zum letzten Shot.',
      value_en:"As an operator team based in Vienna, we don't just provide the equipment – we are the equipment. Our service covers complete support from planning to the last shot." },
    { section:'about', key:'usp1_title', label:'USP 1 Titel', type:'text',
      value_de:'Operator inklusive', value_en:'Operator Included' },
    { section:'about', key:'usp1_desc',  label:'USP 1 Text', type:'textarea',
      value_de:'Kein Kran ohne Bedienung. Wir stellen den Operator und bedienen das System professionell.',
      value_en:'No crane without operation. We provide the operator and professionally handle the system.' },
    { section:'about', key:'usp2_title', label:'USP 2 Titel', type:'text',
      value_de:'24/7 Verfügbarkeit', value_en:'24/7 Availability' },
    { section:'about', key:'usp2_desc',  label:'USP 2 Text', type:'textarea',
      value_de:'Filmproduktionen kennen keine Bürozeiten. Wir auch nicht – kurzfristige Buchungen möglich.',
      value_en:"Film productions don't know office hours. Neither do we – short-notice bookings possible." },
    { section:'about', key:'usp3_title', label:'USP 3 Titel', type:'text',
      value_de:'Wien & ganz Österreich', value_en:'Vienna & all of Austria' },
    { section:'about', key:'usp3_desc',  label:'USP 3 Text', type:'textarea',
      value_de:'Unser Standort ist Wien – wir sind österreichweit und auf Anfrage auch international tätig.',
      value_en:'Based in Vienna – we operate throughout Austria and internationally on request.' },
    { section:'about', key:'usp4_title', label:'USP 4 Titel', type:'text',
      value_de:'Versichert & zertifiziert', value_en:'Insured & Certified' },
    { section:'about', key:'usp4_desc',  label:'USP 4 Text', type:'textarea',
      value_de:'Vollständige Betriebshaftpflichtversicherung. Alle Sicherheitsstandards werden eingehalten.',
      value_en:'Full liability insurance. All safety standards are maintained.' },
    { section:'about', key:'badge_num',   label:'Erfahrungs-Badge Zahl', type:'text', value_de:'20+', value_en:'20+' },
    { section:'about', key:'badge_label', label:'Erfahrungs-Badge Label', type:'text',
      value_de:'Jahre Erfahrung', value_en:'Years Experience' },

    // ── KONTAKT / FOOTER ──────────────────────────────────────
    { section:'contact', key:'headline', label:'Kontakt Überschrift', type:'text',
      value_de:'Lassen Sie uns sprechen', value_en:"Let's Talk" },
    { section:'contact', key:'subline',  label:'Kontakt Unterzeile', type:'textarea',
      value_de:'Schildern Sie Ihr Projekt – wir melden uns innerhalb von 24 Stunden mit einem Angebot.',
      value_en:"Describe your project – we'll get back to you within 24 hours with a quote." },
    { section:'contact', key:'phone',    label:'Telefonnummer', type:'text', value_de:'+43 1 234 5678', value_en:'+43 1 234 5678' },
    { section:'contact', key:'email',    label:'E-Mail Adresse', type:'text', value_de:'info@technogrips.at', value_en:'info@technogrips.at' },
    { section:'contact', key:'location', label:'Standort Text', type:'text', value_de:'Wien, Österreich', value_en:'Vienna, Austria' },

    // ── NEWSLETTER ────────────────────────────────────────────
    { section:'newsletter', key:'headline', label:'Newsletter Überschrift', type:'text',
      value_de:'Bleiben Sie informiert', value_en:'Stay Informed' },
    { section:'newsletter', key:'subline',  label:'Newsletter Unterzeile', type:'textarea',
      value_de:'Neuigkeiten über neue Krane, Produktionstipps und exklusive Angebote direkt in Ihr Postfach.',
      value_en:'News about new cranes, production tips and exclusive offers directly in your inbox.' },

    // ── HOME TEASERS ──────────────────────────────────────────
    { section:'home', key:'services_teaser_title', label:'Services Teaser Titel', type:'text',
      value_de:'Was wir bieten', value_en:'What We Offer' },
    { section:'home', key:'services_teaser_desc', label:'Services Teaser Text', type:'textarea',
      value_de:'Kran-Vermietung, Operator-Service und technische Beratung – alles aus einer Hand für Ihre Filmproduktion.',
      value_en:'Crane rental, operator service and technical consulting – everything from one source for your film production.' },
    { section:'home', key:'product_teaser_title', label:'Produkt Teaser Titel', type:'text',
      value_de:'Supertechno 50+', value_en:'Supertechno 50+' },
    { section:'home', key:'product_teaser_desc', label:'Produkt Teaser Text', type:'textarea',
      value_de:'Das meistgefragte Teleskop-Kamerakransystem der Welt – mit 15,11m Reichweite, 100kg Nutzlast und dem präzisen Techno S-Head.',
      value_en:'The world\'s most requested telescopic camera crane system – with 15.11m reach, 100kg payload and the precise Techno S-Head.' },
    { section:'home', key:'about_teaser_title', label:'Über uns Teaser Titel', type:'text',
      value_de:'Wien-basiert. Weltweit erfahren.', value_en:'Vienna-based. World-class experience.' },
    { section:'home', key:'about_teaser_desc', label:'Über uns Teaser Text', type:'textarea',
      value_de:'Über 20 Jahre Erfahrung als Kamerakran-Operators. Wir bedienen den Kran selbst und garantieren professionelle Ergebnisse.',
      value_en:'Over 20 years of experience as camera crane operators. We operate the crane ourselves and guarantee professional results.' },
    { section:'home', key:'cta_headline', label:'CTA Überschrift (Mitte)', type:'text',
      value_de:'Bereit für Ihren nächsten Shot?', value_en:'Ready for your next shot?' },
    { section:'home', key:'cta_desc', label:'CTA Text', type:'textarea',
      value_de:'Kontaktieren Sie uns für ein kostenloses Angebot. Wir antworten innerhalb von 24 Stunden.',
      value_en:'Contact us for a free quote. We respond within 24 hours.' },

    // ── SEO / META ────────────────────────────────────────────
    { section:'seo', key:'title',       label:'Seiten-Titel (Browser-Tab)', type:'text',
      value_de:'Technogrips Vienna – Professioneller Kamerakran & Operator Service',
      value_en:'Technogrips Vienna – Professional Camera Crane & Operator Service' },
    { section:'seo', key:'description', label:'Meta-Beschreibung', type:'textarea',
      value_de:'Technogrips Vienna – Professionelle Kamerakran-Vermietung mit erfahrenem Operator-Service in Wien. Supertechno 50+ für Film, TV und Events.',
      value_en:'Technogrips Vienna – Professional camera crane rental with experienced operator service in Vienna. Supertechno 50+ for film, TV and events.' },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });
  insertMany(defaults);
  console.log('✅ CMS default content seeded');
};

// Seed page sections (visibility control)
const seedSections = () => {
  const ins = db.prepare(`
    INSERT OR IGNORE INTO page_sections (page, section_key, label, visible, sort_order)
    VALUES (?, ?, ?, 1, ?)
  `);
  const sections = [
    // Startseite
    ['home', 'hero',       'Hero (Fullscreen)',          0],
    ['home', 'services',   'Leistungen Übersicht',       1],
    ['home', 'products',   'Produkt Teaser (ST50+)',      2],
    ['home', 'about',      'Über uns Teaser',             3],
    ['home', 'portfolio',  'Portfolio / Referenzen',      4],
    ['home', 'contact',    'Kontakt Formular',            5],
    // Leistungen
    ['leistungen', 'hero',    'Hero (Fullscreen)',        0],
    ['leistungen', 'services','3 Service-Karten',         1],
    ['leistungen', 'prozess', 'Ablauf (4 Schritte)',      2],
    ['leistungen', 'preise',  'Preisinfo',                3],
    ['leistungen', 'faq',     'FAQ Accordion',            4],
    // Supertechno 50+
    ['supertechno-50', 'hero',     'Hero (Fullscreen)',   0],
    ['supertechno-50', 'galerie',  'Foto-Galerie',        1],
    ['supertechno-50', 'specs',    'Technische Daten',    2],
    ['supertechno-50', 'usecases', 'Einsatzbereiche',     3],
    ['supertechno-50', 'cta',      'CTA Block',           4],
    // Über uns
    ['ueber-uns', 'hero',       'Hero (Fullscreen)',      0],
    ['ueber-uns', 'stats',      'Statistiken (4 Zahlen)', 1],
    ['ueber-uns', 'timeline',   'Geschichte / Timeline',  2],
    ['ueber-uns', 'branchen',   'Branchen-Grid',          3],
    ['ueber-uns', 'cta',        'CTA Block',              4],
    // Kontakt
    ['kontakt', 'hero',      'Hero (Fullscreen)',          0],
    ['kontakt', 'formulare', 'Kontaktformulare (3 Tabs)', 1],
    ['kontakt', 'karte',     'Karten-Placeholder',        2],
  ];
  const run = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
  run(sections);
  console.log('✅ Page sections seeded');
};

// Seed media: scan existing images from filesystem
const seedMedia = () => {
  const imgDir = path.join(__dirname, '../public/assets/images');
  const ins = db.prepare(`
    INSERT OR IGNORE INTO media (filename, original_name, mime_type, size_bytes, path, url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const scanDir = (dir, category) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) { scanDir(path.join(dir, e.name), e.name); continue; }
      const ext = path.extname(e.name).toLowerCase();
      if (!['.jpg','.jpeg','.png','.webp','.gif','.svg'].includes(ext)) continue;
      const fullPath = path.join(dir, e.name);
      const stat = fs.statSync(fullPath);
      const rel = fullPath.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/');
      const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      ins.run(e.name, e.name, mime, stat.size, fullPath, rel, category);
    }
  };
  scanDir(imgDir, 'general');
  console.log('✅ Media library seeded from filesystem');
};

initSchema();
seedAdmin();
seedContent();
seedSections();
seedMedia();

module.exports = db;
