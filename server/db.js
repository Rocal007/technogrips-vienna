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

    CREATE TABLE IF NOT EXISTS lead_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_by TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
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
      value_fr TEXT,
      value_cs TEXT,
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
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      mime_type TEXT,
      size_bytes INTEGER,
      alt_text TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try { db.exec('ALTER TABLE page_content ADD COLUMN value_fr TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE page_content ADD COLUMN value_cs TEXT'); } catch (e) {}

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
    INSERT OR IGNORE INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type)
    VALUES (@section, @key, @label, @value_de, @value_en, @value_fr, @value_cs, @type)
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
    { section:'product', key:'spec_payload', label:'Spec: Nutzlast',   type:'text', value_de:'Payload S-Head 35kg', value_en:'Payload S-Head 35kg' },
    { section:'product', key:'spec_pan',     label:'Spec: Schwenk',    type:'text', value_de:'360°', value_en:'360°' },
    { section:'product', key:'spec_use',     label:'Spec: Einsatz',    type:'text', value_de:'In/Out', value_en:'In/Out' },
    { section:'product', key:'spec_head',    label:'Spec: Remote-Head',type:'text', value_de:'S-Head', value_en:'S-Head' },
    { section:'product', key:'spec_sections',label:'Spec: Teleskop-Abschnitte',type:'text', value_de:'4', value_en:'4' },
    { section:'product', key:'spec_vehicle', label:'Spec: Fahrzeug / Transport',type:'text', value_de:'Eigener Transport', value_en:'Own Transport' },
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
    { section:'about', key:'stat1_num',   label:'Stat 1 Zahl (Jahre)', type:'text', value_de:'20+', value_en:'20+' },
    { section:'about', key:'stat1_label', label:'Stat 1 Label', type:'text', value_de:'Jahre Erfahrung', value_en:'Years experience' },
    { section:'about', key:'stat2_num',   label:'Stat 2 Zahl (Produktionen)', type:'text', value_de:'500+', value_en:'500+' },
    { section:'about', key:'stat2_label', label:'Stat 2 Label', type:'text', value_de:'Produktionen', value_en:'Productions' },
    { section:'about', key:'stat3_num',   label:'Stat 3 Zahl (Krane)', type:'text', value_de:'3', value_en:'3' },
    { section:'about', key:'stat3_label', label:'Stat 3 Label', type:'text', value_de:'Supertechno Krane', value_en:'Supertechno cranes' },
    { section:'about', key:'stat4_num',   label:'Stat 4 Zahl (Verfügbarkeit)', type:'text', value_de:'24/7', value_en:'24/7' },
    { section:'about', key:'stat4_label', label:'Stat 4 Label', type:'text', value_de:'Erreichbar', value_en:'Reachable' },
    { section:'about', key:'badge_num',   label:'Erfahrungs-Badge Zahl', type:'text', value_de:'20+', value_en:'20+' },
    { section:'about', key:'badge_label', label:'Erfahrungs-Badge Label', type:'text',
      value_de:'Jahre Erfahrung', value_en:'Years Experience' },

    // ── KONTAKT / FOOTER ──────────────────────────────────────
    { section:'contact', key:'headline', label:'Kontakt Überschrift', type:'text',
      value_de:'Lassen Sie uns sprechen', value_en:"Let's Talk" },
    { section:'contact', key:'subline',  label:'Kontakt Unterzeile', type:'textarea',
      value_de:'Schildern Sie Ihr Projekt – wir melden uns innerhalb von 24 Stunden mit einem Angebot.',
      value_en:"Describe your project – we'll get back to you within 24 hours with a quote." },
    { section:'contact', key:'phone_mobile', label:'Telefonnummer (Mobil)',  type:'text', value_de:'+43 650 454 2261', value_en:'+43 650 454 2261' },
    { section:'contact', key:'phone_office', label:'Telefonnummer (Office)', type:'text', value_de:'+43 676 591 9172', value_en:'+43 676 591 9172' },
    { section:'contact', key:'email',        label:'E-Mail Adresse', type:'text', value_de:'office@technogrips-vienna.at', value_en:'office@technogrips-vienna.at' },
    { section:'contact', key:'location',     label:'Standort Text', type:'text', value_de:'Wien, Österreich', value_en:'Vienna, Austria' },

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

    // ── IMPRESSUM (IMPRINT) ───────────────────────────────────
    { section:'imprint', key:'badge', label:'Badge-Text', type:'text',
      value_de:'Rechtliche Informationen & Offenlegung',
      value_en:'Legal Information & Disclosure',
      value_fr:'Informations légales & Divulgation',
      value_cs:'Právní informace a zveřejnění' },
    { section:'imprint', key:'headline', label:'Hauptüberschrift (H1)', type:'text',
      value_de:'Impressum',
      value_en:'Imprint & Legal Notice',
      value_fr:'Mentions Légales',
      value_cs:'Impresum' },
    { section:'imprint', key:'subline', label:'Unterzeile / Rechtsgrundlage', type:'textarea',
      value_de:'Angaben gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB) und § 25 Mediengesetz.',
      value_en:'Information pursuant to § 5 E-Commerce Act (ECG), § 14 Commercial Code (UGB) and § 25 Media Act.',
      value_fr:'Informations conformément à la loi sur le commerce électronique (ECG), au code de commerce (UGB) et à la loi sur les médias.',
      value_cs:'Informace v souladu se zákonem o elektronickém obchodu (ECG), obchodním zákoníkem (UGB) a zákonem o médiích.' },
    { section:'imprint', key:'company_name', label:'Unternehmensbezeichnung', type:'text',
      value_de:'Technogrips Vienna',
      value_en:'Technogrips Vienna',
      value_fr:'Technogrips Vienna',
      value_cs:'Technogrips Vienna' },
    { section:'imprint', key:'owner', label:'Inhaber / Geschäftsführung', type:'text',
      value_de:'Gerhard Deimel',
      value_en:'Gerhard Deimel',
      value_fr:'Gerhard Deimel',
      value_cs:'Gerhard Deimel' },
    { section:'imprint', key:'legal_form', label:'Rechtsform', type:'text',
      value_de:'Einzelunternehmen (Film- und Videoproduktion / Kamerakranvermietung)',
      value_en:'Sole Proprietorship (Film & Video Production / Camera Crane Rental)',
      value_fr:'Entreprise individuelle (Production film & vidéo / Location de grue)',
      value_cs:'Jednotlivé podnikání (Filmová produkce / Pronájem kamerových jeřábů)' },
    { section:'imprint', key:'address', label:'Standort / Anschrift', type:'text',
      value_de:'Wien, Österreich',
      value_en:'Vienna, Austria',
      value_fr:'Vienne, Autriche',
      value_cs:'Vídeň, Rakousko' },
    { section:'imprint', key:'business_purpose', label:'Unternehmensgegenstand', type:'textarea',
      value_de:'Vermietung von Teleskop-Kamerakransystemen (Supertechno 30, 50+, 75+), Remote-Head-Systemen und Zubehör sowie Erbringung von Operator- und Techniker-Dienstleistungen für Film-, Fernseh-, Werbe- und Eventproduktionen.',
      value_en:'Rental of telescopic camera crane systems (Supertechno 30, 50+, 75+), remote head systems and accessories, as well as operator and technician services for film, television, commercial and event productions.',
      value_fr:'Location de systèmes de grues de caméra télescopiques (Supertechno 30, 50+, 75+), de têtes télécommandées et d\'accessoires, ainsi que prestations d\'opérateur et de technicien pour les productions cinématographiques, télévisuelles, publicitaires et événementielles.',
      value_cs:'Pronájem teleskopických kamerových jeřábů (Supertechno 30, 50+, 75+), systémů dálkově ovládaných hlav a příslušenství, jakož i poskytování služeb operátora a technika pro filmovou, televizní, reklamní a eventovou produkci.' },
    { section:'imprint', key:'chamber', label:'Kammerzugehörigkeit', type:'text',
      value_de:'Wirtschaftskammer Wien (WKO) – Fachgruppe Film- und Musikwirtschaft',
      value_en:'Vienna Economic Chamber (WKO) – Film and Music Industry Group',
      value_fr:'Chambre économique de Vienne (WKO) – Groupe de l\'industrie cinématographique et musicale',
      value_cs:'Hospodářská komora Vídeň (WKO) – Odborná skupina filmového a hudebního průmyslu' },
    { section:'imprint', key:'authority', label:'Aufsichtsbehörde / Gewerbebehörde', type:'text',
      value_de:'Magistrat der Stadt Wien / Magistratisches Bezirksamt',
      value_en:'Municipal District Office of the City of Vienna',
      value_fr:'Autorité de tutelle : Magistrat de la Ville de Vienne',
      value_cs:'Dozorčí orgán: Magistrát města Vídně' },
    { section:'imprint', key:'regulations', label:'Berufsrechtliche Vorschriften', type:'text',
      value_de:'Gewerbeordnung 1994 (GewO), abrufbar im RIS unter www.ris.bka.gv.at',
      value_en:'Austrian Trade Act 1994 (GewO), accessible at www.ris.bka.gv.at',
      value_fr:'Réglementation professionnelle : Code des métiers 1994 (GewO), disponible sur www.ris.bka.gv.at',
      value_cs:'Živnostenský řád 1994 (GewO), k dispozici na www.ris.bka.gv.at' },
    { section:'imprint', key:'disclaimer_content', label:'Haftung für Inhalte', type:'textarea',
      value_de:'Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.',
      value_en:'The contents of our pages were created with the greatest care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with general laws.',
      value_fr:'Le contenu de nos pages a été créé avec le plus grand soin. Cependant, nous ne pouvons garantir l\'exactitude, l\'exhaustivité ou l\'actualité des contenus. En tant que prestataire de services, nous sommes responsables de nos propres contenus conformément aux lois générales.',
      value_cs:'Obsah našich stránek byl vytvořen s maximální péčí. Za správnost, úplnost a aktuálnost obsahu však nemůžeme převzít záruku. Jako poskytovatel služeb odpovídáme za vlastní obsah na těchto stránkách podle obecných zákonů.' },
    { section:'imprint', key:'disclaimer_links', label:'Haftung für Links', type:'textarea',
      value_de:'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.',
      value_en:'Our website contains links to external third-party websites over whose content we have no influence. The respective provider or operator of the linked pages is always responsible for their content. Upon notification of violations, we will remove such links immediately.',
      value_fr:'Notre offre contient des liens vers des sites tiers externes sur lesquels nous n\'avons aucune influence. Le fournisseur ou exploitant respectif est toujours responsable de ces contenus. Dès notification d\'une infraction, nous supprimerons immédiatement les liens concernés.',
      value_cs:'Naše nabídka obsahuje odkazy na externí webové stránky třetích stran, na jejichž obsah nemáme žádný vliv. Za obsah odkazovaných stránek odpovídá vždy příslušný poskytovatel nebo provozovatel. V případě zjištění právních porušení tyto odkazy neprodleně odstraníme.' },
    { section:'imprint', key:'copyright', label:'Urheberrecht', type:'textarea',
      value_de:'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung.',
      value_en:'The content and works published on this website are governed by Austrian copyright laws. Any reproduction, processing, distribution, or any form of utilization beyond the scope of copyright law requires prior written consent.',
      value_fr:'Les contenus et œuvres créés par les éditeurs sur ces pages sont soumis au droit d\'auteur autrichien. Toute reproduction, modification, diffusion ou exploitation nécessite un accord écrit préalable.',
      value_cs:'Obsah a díla vytvořená provozovateli stránek na těchto stránkách podléhají rakouskému autorskému právu. Kopírování, zpracování, šíření a jakýkoli druh využití vyžadují písemný souhlas.' },

    // ── DATENSCHUTZ (PRIVACY) ─────────────────────────────────
    { section:'privacy', key:'badge', label:'Badge-Text', type:'text',
      value_de:'DSGVO & Datenschutzkonformität',
      value_en:'GDPR & Privacy Compliance',
      value_fr:'Conformité RGPD & Protection des données',
      value_cs:'Soulad s GDPR a ochrana údajů' },
    { section:'privacy', key:'headline', label:'Hauptüberschrift (H1)', type:'text',
      value_de:'Datenschutzerklärung',
      value_en:'Privacy Policy',
      value_fr:'Politique de Confidentialité',
      value_cs:'Zásady ochrany osobních údajů' },
    { section:'privacy', key:'subline', label:'Unterzeile / Einleitung', type:'textarea',
      value_de:'Informationen über die Verarbeitung Ihrer personenbezogenen Daten gemäß Art. 13 und 14 der EU-Datenschutz-Grundverordnung (DSGVO) und dem österreichischen Datenschutzgesetz (DSG).',
      value_en:'Information regarding the processing of your personal data according to Art. 13 and 14 of the EU General Data Protection Regulation (GDPR) and the Austrian Data Protection Act (DSG).',
      value_fr:'Informations sur le traitement de vos données personnelles conformément aux articles 13 et 14 du Règlement Général sur la Protection des Données (RGPD) et à la loi autrichienne sur la protection des données (DSG).',
      value_cs:'Informace o zpracování vašich osobních údajů v souladu s čl. 13 a 14 Obecného nařízení o ochraně osobních údajů (GDPR) a rakouského zákona o ochraně osobních údajů (DSG).' },
    { section:'privacy', key:'controller_title', label:'Abschnitt 1 Titel', type:'text',
      value_de:'1. Verantwortlicher für die Datenverarbeitung',
      value_en:'1. Data Controller',
      value_fr:'1. Responsable du traitement',
      value_cs:'1. Správce osobních údajů' },
    { section:'privacy', key:'controller_text', label:'Abschnitt 1 Text', type:'textarea',
      value_de:'Verantwortlicher im Sinne der DSGVO ist Technogrips Vienna (Gerhard Deimel), Wien, Österreich. E-Mail: office@technogrips-vienna.at, Telefon: +43 650 454 2261.',
      value_en:'The controller within the meaning of the GDPR is Technogrips Vienna (Gerhard Deimel), Vienna, Austria. Email: office@technogrips-vienna.at, Phone: +43 650 454 2261.',
      value_fr:'Le responsable du traitement au sens du RGPD est Technogrips Vienna (Gerhard Deimel), Vienne, Autriche. E-mail : office@technogrips-vienna.at, Téléphone : +43 650 454 2261.',
      value_cs:'Správcem ve smyslu GDPR je Technogrips Vienna (Gerhard Deimel), Vídeň, Rakousko. E-mail: office@technogrips-vienna.at, Telefon: +43 650 454 2261.' },
    { section:'privacy', key:'collection_title', label:'Abschnitt 2 Titel', type:'text',
      value_de:'2. Erhebung und Verarbeitung personenbezogener Daten',
      value_en:'2. Collection and Processing of Personal Data',
      value_fr:'2. Collecte et traitement des données personnelles',
      value_cs:'2. Shromažďování a zpracování osobních údajů' },
    { section:'privacy', key:'collection_text', label:'Abschnitt 2 Text', type:'textarea',
      value_de:'Wir erheben personenbezogene Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Firmenname, Produktionszeiträume und Anfragedetails), wenn Sie uns diese im Rahmen einer Anfrage über unsere Kontakt- oder Buchungsformulare, per E-Mail oder telefonisch mitteilen. Diese Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage, Angebotserstellung, Projektplanung und Vertragserfüllung verwendet.',
      value_en:'We collect personal data (e.g., name, email address, phone number, company name, production dates, and inquiry details) when you provide them to us via our contact or booking forms, email, or telephone. These data are processed exclusively for handling your inquiry, preparing quotes, project coordination, and contract fulfillment.',
      value_fr:'Nous collectons des données personnelles (par exemple nom, adresse e-mail, numéro de téléphone, nom d\'entreprise, dates de tournage et détails de demande) lorsque vous nous les transmettez via nos formulaires de contact ou de réservation, par e-mail ou téléphone. Ces données sont utilisées exclusivement pour traiter votre demande, établir des devis et exécuter le contrat.',
      value_cs:'Shromažďujeme osobní údaje (např. jméno, e-mailovou adresu, telefonní číslo, název společnosti, data produkce a podrobnosti poptávky), které nám poskytnete prostřednictvím kontaktního či rezervačního formuláře, e-mailem nebo telefonicky. Tyto údaje používáme výhradně k vyřízení vaší poptávky, přípravě nabídky a plnění smlouvy.' },
    { section:'privacy', key:'legal_basis_title', label:'Abschnitt 3 Titel', type:'text',
      value_de:'3. Rechtsgrundlagen der Verarbeitung',
      value_en:'3. Legal Basis for Processing',
      value_fr:'3. Base juridique du traitement',
      value_cs:'3. Právní základ pro zpracování' },
    { section:'privacy', key:'legal_basis_text', label:'Abschnitt 3 Text', type:'textarea',
      value_de:'Die Verarbeitung Ihrer Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen. Soweit Sie uns eine Einwilligung erteilt haben (z. B. für den Newsletter-Empfang), stützt sich die Verarbeitung auf Art. 6 Abs. 1 lit. a DSGVO. Die Speicherung von Server-Logdaten basiert auf unserem berechtigten Interesse (Art. 6 Abs. 1 lit. f DSGVO) an der IT-Sicherheit und Systemstabilität.',
      value_en:'The processing of your data is based on Art. 6 (1) (b) GDPR for contract performance or pre-contractual measures. Where you have given consent (e.g., newsletter subscription), processing is based on Art. 6 (1) (a) GDPR. Server log storage is based on our legitimate interest (Art. 6 (1) (f) GDPR) in ensuring IT security and system stability.',
      value_fr:'Le traitement repose sur l\'art. 6, par. 1, let. b du RGPD (exécution d\'un contrat ou mesures précontractuelles). Si vous avez donné votre consentement (ex. newsletter), la base est l\'art. 6, par. 1, let. a du RGPD. Les journaux de serveur reposent sur notre intérêt légitime (art. 6, par. 1, let. f du RGPD) pour assurer la sécurité et la stabilité.',
      value_cs:'Zpracování vašich údajů probíhá na základě čl. 6 odst. 1 písm. b) GDPR pro plnění smlouvy či předsmluvní opatření. Pokud jste udělili souhlas (např. k odběru newsletteru), vychází z čl. 6 odst. 1 písm. a) GDPR. Ukládání serverových protokolů vychází z oprávněného zájmu (čl. 6 odst. 1 písm. f) GDPR) na bezpečnosti IT a stabilitě systému.' },
    { section:'privacy', key:'cookies_title', label:'Abschnitt 4 Titel', type:'text',
      value_de:'4. Cookies und Lokale Speicherung',
      value_en:'4. Cookies & Local Storage',
      value_fr:'4. Cookies et stockage local',
      value_cs:'4. Soubory cookie a místní úložiště' },
    { section:'privacy', key:'cookies_text', label:'Abschnitt 4 Text', type:'textarea',
      value_de:'Unsere Website nutzt technisch notwendige Speicherungen (Local Storage) für die Speicherung Ihrer gewählten Spracheinstellung (DE, EN, FR, CS). Es werden keine zustimmungspflichtigen Tracking- oder Werbe-Cookies von Drittanbietern eingesetzt.',
      value_en:'Our website uses technically necessary storage (Local Storage) to remember your chosen language setting (DE, EN, FR, CS). No third-party tracking or advertising cookies requiring consent are deployed.',
      value_fr:'Notre site utilise un stockage local techniquement nécessaire pour mémoriser votre choix de langue (DE, EN, FR, CS). Aucun cookie publicitaire ou de suivi tiers nécessitant un consentement n\'est utilisé.',
      value_cs:'Naše webové stránky využívají technicky nezbytné místní úložiště (Local Storage) pro uložení vámi vybraného jazykového nastavení (DE, EN, FR, CS). Nejsou používány žádné sledovací ani reklamní soubory cookie třetích stran vyžadující souhlas.' },
    { section:'privacy', key:'rights_title', label:'Abschnitt 5 Titel', type:'text',
      value_de:'5. Ihre Rechte als betroffene Person',
      value_en:'5. Your Rights as a Data Subject',
      value_fr:'5. Vos droits en tant que personne concernée',
      value_cs:'5. Vaše práva jako subjektu údajů' },
    { section:'privacy', key:'rights_text', label:'Abschnitt 5 Text', type:'textarea',
      value_de:'Ihnen stehen nach der DSGVO die Rechte auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21) zu. Wenden Sie sich hierzu jederzeit formlos per E-Mail an office@technogrips-vienna.at.',
      value_en:'Under the GDPR, you have the right to access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20), and objection (Art. 21). You can exercise these rights informally at any time via email to office@technogrips-vienna.at.',
      value_fr:'En vertu du RGPD, vous disposez d\'un droit d\'accès (art. 15), de rectification (art. 16), d\'effacement (art. 17), de limitation (art. 18), de portabilité (art. 20) et d\'opposition (art. 21). Vous pouvez nous contacter sans formalité par e-mail à office@technogrips-vienna.at.',
      value_cs:'Podle GDPR máte právo na přístup (čl. 15), opravu (čl. 16), výmaz (čl. 17), omezení zpracování (čl. 18), přenositelnost údajů (čl. 20) a námitku (čl. 21). Můžete se na nás kdykoli neformálně obrátit e-mailem na office@technogrips-vienna.at.' },
    { section:'privacy', key:'authority_title', label:'Abschnitt 6 Titel', type:'text',
      value_de:'6. Aufsichtsbehörde & Beschwerderecht',
      value_en:'6. Supervisory Authority & Right to Lodge a Complaint',
      value_fr:'6. Autorité de contrôle & Droit de recours',
      value_cs:'6. Dozorčí úřad a právo podat stížnost' },
    { section:'privacy', key:'authority_text', label:'Abschnitt 6 Text', type:'textarea',
      value_de:'Sollten Sie der Ansicht sein, dass die Verarbeitung Ihrer personenbezogenen Daten gegen das Datenschutzrecht verstößt, haben Sie das Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde: Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Wien, Telefon: +43 1 52 152-0, E-Mail: dsb@dsb.gv.at, Web: https://www.dsb.gv.at.',
      value_en:'If you believe that the processing of your personal data violates data protection laws, you have the right to lodge a complaint with the competent supervisory authority: Austrian Data Protection Authority (Österreichische Datenschutzbehörde), Barichgasse 40-42, 1030 Vienna, Phone: +43 1 52 152-0, Email: dsb@dsb.gv.at, Web: https://www.dsb.gv.at.',
      value_fr:'Si vous estimez que le traitement de vos données personnelles enfreint les dispositions légales, vous avez le droit d\'introduire une réclamation auprès de l\'autorité de contrôle compétente : Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Vienne, Téléphone : +43 1 52 152-0, E-mail : dsb@dsb.gv.at, Web : https://www.dsb.gv.at.',
      value_cs:'Pokud se domníváte, že zpracování vašich osobních údajů porušuje právní předpisy o ochraně osobních údajů, máte právo podat stížnost u příslušného dozorčího úřadu: Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Vídeň, Telefon: +43 1 52 152-0, E-mail: dsb@dsb.gv.at, Web: https://www.dsb.gv.at.' },

    // ── AGB (TERMS & CONDITIONS) ───────────────────────────────
    { section:'terms', key:'badge', label:'Badge-Text', type:'text',
      value_de:'Geschäfts- & Mietbedingungen',
      value_en:'Terms & Rental Conditions',
      value_fr:'Conditions Générales de Location',
      value_cs:'Všeobecné a nájemní podmínky' },
    { section:'terms', key:'headline', label:'Hauptüberschrift (H1)', type:'text',
      value_de:'Allgemeine Geschäftsbedingungen (AGB)',
      value_en:'Terms & Conditions (AGB)',
      value_fr:'Conditions Générales de Vente et Location',
      value_cs:'Všeobecné obchodní podmínky (VOP)' },
    { section:'terms', key:'subline', label:'Unterzeile / Einleitung', type:'textarea',
      value_de:'Miet- und Leistungsbedingungen für Supertechno Teleskop-Kamerakrane und Operator-Dienstleistungen von Technogrips Vienna.',
      value_en:'Rental and service conditions for Supertechno telescopic camera cranes and operator services from Technogrips Vienna.',
      value_fr:'Conditions de location et de service pour les grues de caméra télescopiques Supertechno et les services d\'opérateur de Technogrips Vienna.',
      value_cs:'Podmínky pronájmu a služeb pro teleskopické kamerové jeřáby Supertechno a služby operátora od společnosti Technogrips Vienna.' },
    { section:'terms', key:'scope_title', label:'§ 1 Titel', type:'text',
      value_de:'§ 1 Geltungsbereich & Vertragsgegenstand',
      value_en:'§ 1 Scope & Subject of Contract',
      value_fr:'§ 1 Champ d\'application & Objet du contrat',
      value_cs:'§ 1 Rozsah platnosti a předmět smlouvy' },
    { section:'terms', key:'scope_text', label:'§ 1 Text', type:'textarea',
      value_de:'1.1 Diese Allgemeinen Geschäftsbedingungen gelten für alle gegenwärtigen und zukünftigen Verträge über die Vermietung von Teleskop-Kamerakranen (insbesondere Supertechno 30, 50+, 75+), Remote-Head-Systemen (Techno S-Head), Kamera-Tracking-Systemen sowie die Gestellung von qualifiziertem Fachpersonal (Kran-Operators, Techniker).\n1.2 Abweichende, entgegenstehende oder ergänzende Bedingungen des Kunden werden nur dann Vertragsbestandteil, wenn ihrer Geltung ausdrücklich schriftlich zugestimmt wurde.',
      value_en:'1.1 These General Terms and Conditions apply to all present and future contracts concerning the rental of telescopic camera cranes (in particular Supertechno 30, 50+, 75+), remote head systems (Techno S-Head), camera tracking systems, and the provision of qualified personnel (crane operators, technicians).\n1.2 Deviating, conflicting, or supplementary terms of the customer shall only become part of the contract if expressly agreed upon in writing.',
      value_fr:'1.1 Les présentes conditions générales s\'appliquent à tous les contrats relatifs à la location de grues télescopiques (notamment Supertechno 30, 50+, 75+), de têtes télécommandées (Techno S-Head), de systèmes de suivi de caméra et à la mise à disposition de personnel qualifié (opérateurs, techniciens).\n1.2 Les conditions divergentes du client ne font partie du contrat que si elles ont été expressément approuvées par écrit.',
      value_cs:'1.1 Tyto všeobecné obchodní podmínky se vztahují na veškeré smlouvy o pronájmu teleskopických kamerových jeřábů (zejména Supertechno 30, 50+, 75+), systémů dálkových hlav (Techno S-Head), sledovacích systémů a poskytnutí kvalifikovaného personálu (operátoři jeřábu, technici).\n1.2 Odchylné podmínky zákazníka se stávají součástí smlouvy pouze v případě výslovného písemného souhlasu.' },
    { section:'terms', key:'booking_title', label:'§ 2 Titel', type:'text',
      value_de:'§ 2 Angebote, Buchung & Optionsfristen',
      value_en:'§ 2 Quotes, Bookings & Options',
      value_fr:'§ 2 Devis, Réservations & Délais d\'option',
      value_cs:'§ 2 Nabídky, rezervace a opční lhůty' },
    { section:'terms', key:'booking_text', label:'§ 2 Text', type:'textarea',
      value_de:'2.1 Unsere Angebote sind stets freibleibend und unverbindlich.\n2.2 Ein Vertrag kommt durch schriftliche Buchungsbestätigung (E-Mail genügt) oder durch Übergabe/Bereitstellung des Equipments zustande.\n2.3 Unverbindliche Vorreservierungen (Optionen) sind bis spätestens 48 Stunden vor dem geplanten Drehbeginn als Festbuchung zu bestätigen oder freizugeben. Geht innerhalb dieses Zeitraums eine Festbuchungsanfrage eines Dritten ein, muss der Inhaber der ersten Option sich innerhalb von 12 Stunden verbindlich erklären.',
      value_en:'2.1 Our quotes are always non-binding and subject to change.\n2.2 A contract is concluded upon written booking confirmation (email is sufficient) or upon handover/provision of the equipment.\n2.3 Non-binding pre-reservations (options) must be confirmed as firm bookings or released at least 48 hours prior to the scheduled shoot. If a third-party firm booking inquiry is received during this time, the first option holder must confirm within 12 hours.',
      value_fr:'2.1 Nos devis sont toujours sans engagement.\n2.2 Le contrat est conclu par confirmation écrite de réservation (un e-mail suffit) ou par la mise à disposition du matériel.\n2.3 Les pré-réservations non contraignantes (options) doivent être confirmées comme fermes ou libérées au moins 48 heures avant le tournage prévu.',
      value_cs:'2.1 Naše nabídky jsou vždy nezávazné.\n2.2 Smlouva vzniká písemným potvrzením rezervace (postačuje e-mail) nebo předáním/poskytnutím vybavení.\n2.3 Nezávazné předběžné rezervace (opce) musí být potvrzeny jako pevná rezervace nebo uvolněny nejpozději 48 hodin před plánovaným natáčením.' },
    { section:'terms', key:'safety_title', label:'§ 3 Titel', type:'text',
      value_de:'§ 3 Operator-Pflicht & Sicherheit am Set',
      value_en:'§ 3 Operator Requirement & Set Safety',
      value_fr:'§ 3 Obligation d\'opérateur & Sécurité sur le plateau',
      value_cs:'§ 3 Požadavek na operátora a bezpečnost na place' },
    { section:'terms', key:'safety_text', label:'§ 3 Text', type:'textarea',
      value_de:'3.1 Die Vermietung von Supertechno-Teleskopkranen erfolgt grundsätzlich ausschließlich inklusive durch Technogrips Vienna gestelltem oder schriftlich autorisiertem Operator-Fachpersonal.\n3.2 Der Operator besitzt am Set die uneingeschränkte fachliche Weisungsbefugnis bezüglich aller Sicherheitsaspekte (z. B. zulässige Nutzlast, Witterungseinflüsse wie Windgeschwindigkeiten über 40 km/h, Untergrundbeschaffenheit, statische Tragfähigkeit und Sicherheitsabstände zu Personen und Hindernissen).\n3.3 Bei akuter Gefährdung von Personen oder Material ist der Operator berechtigt, den Kranbetrieb bis zur Beseitigung der Gefahrenquelle vorübergehend oder vollständig einzustellen, ohne dass dies zu Schadensersatzansprüchen des Kunden führt.',
      value_en:'3.1 The rental of Supertechno telescopic cranes is conducted exclusively including qualified operator personnel provided or authorized in writing by Technogrips Vienna.\n3.2 The operator holds unrestricted authority on set regarding all safety aspects (e.g., permissible payload, weather conditions such as wind speeds exceeding 40 km/h, ground conditions, load-bearing capacity, and safety distances).\n3.3 In the event of acute danger to persons or equipment, the operator is entitled to suspend crane operation without giving rise to customer claims for compensation.',
      value_fr:'3.1 La location des grues télescopiques Supertechno s\'effectue exclusivement avec le personnel opérateur qualifié fourni ou autorisé par écrit par Technogrips Vienna.\n3.2 L\'opérateur dispose de l\'autorité absolue sur le plateau en matière de sécurité.\n3.3 En cas de danger imminent, l\'opérateur est en droit d\'interrompre l\'utilisation de la grue sans que cela n\'ouvre droit à indemnisation pour le client.',
      value_cs:'3.1 Pronájem teleskopických jeřábů Supertechno probíhá zásadně výhradně s kvalifikovaným personálem operátora poskytnutým nebo písemně autorizovaným společností Technogrips Vienna.\n3.2 Operátor má na place neomezenou pravomoc ohledně veškerých bezpečnostních aspektů.\n3.3 V případě bezprostředního nebezpečí je operátor oprávněn provoz jeřábu pozastavit, aniž by to zakládalo nárok zákazníka na náhradu škody.' },
    { section:'terms', key:'cancellation_title', label:'§ 4 Titel', type:'text',
      value_de:'§ 4 Rücktritt & Stornobedingungen',
      value_en:'§ 4 Cancellation & Weather Conditions',
      value_fr:'§ 4 Annulation & Conditions météorologiques',
      value_cs:'§ 4 Zrušení a storno podmínky' },
    { section:'terms', key:'cancellation_text', label:'§ 4 Text', type:'textarea',
      value_de:'4.1 Storniert der Kunde eine bestätigte Festbuchung, fallen folgende Stornogebühren an:\n- Bis 7 Werktage vor Einsatzbeginn: kostenfrei.\n- 6 bis 3 Werktage vor Einsatzbeginn: 50% der vereinbarten Tagespauschale.\n- Weniger als 48 Stunden vor Einsatzbeginn: 100% der vereinbarten Vergütung zzgl. bereits angefallener Transport- und Vorbereitungskosten.\n4.2 Drehausfälle oder Verzögerungen aufgrund von Schlechtwetter, höherer Gewalt oder produktionsinternen Gründen entbinden den Kunden nicht von der vereinbarten Vergütungspflicht.',
      value_en:'4.1 If the customer cancels a confirmed booking, the following cancellation fees apply:\n- Up to 7 working days before the start of the shoot: free of charge.\n- 6 to 3 working days before the start: 50% of the agreed daily rate.\n- Less than 48 hours before the start: 100% of the agreed fee plus any incurred transport and prep costs.\n4.2 Cancellations or delays due to bad weather, force majeure, or internal production issues do not release the customer from the payment obligation.',
      value_fr:'4.1 En cas d\'annulation d\'une réservation confirmée par le client, les frais d\'annulation suivants s\'appliquent :\n- Jusqu\'à 7 jours ouvrables avant le début : sans frais.\n- De 6 à 3 jours ouvrables avant le début : 50% du forfait journalier.\n- Moins de 48 heures avant le début : 100% de la rémunération convenue.\n4.2 Les annulations pour intempéries ou force majeure ne dispensent pas le client de son obligation de paiement.',
      value_cs:'4.1 V případě zrušení potvrzené rezervace zákazníkem platí následující stornopoplatky:\n- Do 7 pracovních dnů před zahájením: bezplatně.\n- 6 až 3 pracovní dny před zahájením: 50 % dohodnuté denní sazby.\n- Méně než 48 hodin před zahájením: 100 % dohodnuté částky plus vzniklé náklady.\n4.2 Zrušení z důvodu špatného počasí nebo vyšší moci nezbavuje zákazníka povinnosti uhradit sjednanou odměnu.' },
    { section:'terms', key:'payment_title', label:'§ 5 Titel', type:'text',
      value_de:'§ 5 Preise & Zahlungsbedingungen',
      value_en:'§ 5 Prices & Payment Terms',
      value_fr:'§ 5 Tarifs & Modalités de paiement',
      value_cs:'§ 5 Ceny a platební podmínky' },
    { section:'terms', key:'payment_text', label:'§ 5 Text', type:'textarea',
      value_de:'5.1 Alle Preise verstehen sich in Euro netto zzgl. der gesetzlichen österreichischen Umsatzsteuer.\n5.2 Rechnungen sind, sofern nicht schriftlich anders vereinbart, innerhalb von 14 Tagen ab Rechnungslegung ohne jeden Abzug zur Zahlung fällig.\n5.3 Bei Neukunden oder internationalen Produktionen behält sich Technogrips Vienna das Recht vor, eine Anzahlung von bis zu 50% bei Buchungsbestätigung zu verlangen.',
      value_en:'5.1 All prices are net in Euros plus applicable statutory Austrian VAT.\n5.2 Invoices are due for payment without deduction within 14 days of the invoice date, unless agreed otherwise in writing.\n5.3 For new clients or international productions, Technogrips Vienna reserves the right to request an advance payment of up to 50% upon booking confirmation.',
      value_fr:'5.1 Tous les prix s\'entendent en euros hors taxes, majorés de la TVA autrichienne légale.\n5.2 Les factures sont payables sans escompte dans les 14 jours suivant la date d\'émission.\n5.3 Pour les nouveaux clients ou les productions internationales, Technogrips Vienna se réserve le droit d\'exiger un acompte allant jusqu\'à 50%.',
      value_cs:'5.1 Všechny ceny jsou uvedeny v eurech bez DPH, k nimž se připočítává zákonná rakouská DPH.\n5.2 Faktury jsou splatné do 14 dnů od data vystavení bez jakýchkoli srážek.\n5.3 U nových zákazníků nebo mezinárodních produkcí si Technogrips Vienna vyhrazuje právo požadovat zálohu až do výše 50 %.' },
    { section:'terms', key:'liability_title', label:'§ 6 Titel', type:'text',
      value_de:'§ 6 Haftung, Versicherung & Schadensmeldungen',
      value_en:'§ 6 Liability, Insurance & Damage Notification',
      value_fr:'§ 6 Responsabilité, Assurance & Déclarations de sinistres',
      value_cs:'§ 6 Odpovědnost, pojištění a hlášení škod' },
    { section:'terms', key:'liability_text', label:'§ 6 Text', type:'textarea',
      value_de:'6.1 Technogrips Vienna verfügt über eine branchenübliche Betriebshaftpflichtversicherung.\n6.2 Für Beschädigungen oder Verlust von am Kran befestigtem kundeneigenem oder gemietetem Equipment (Kameras, Objektive, Funkschärfen, Zubehör) haftet Technogrips Vienna nur bei nachgewiesenem Vorsatz oder grober Fahrlässigkeit unseres Personals. Eine darüber hinausgehende Equipment-Versicherung (Elektronik-/Filmgeräteversicherung) obliegt dem Mieter/Produktionsunternehmen.\n6.3 Allfällige Schäden oder Mängel sind dem Operator unverzüglich am Set anzuzeigen und schriftlich zu protokollieren.',
      value_en:'6.1 Technogrips Vienna maintains commercial general liability insurance standard in the industry.\n6.2 For damage or loss of client-owned or rented equipment mounted on the crane (cameras, lenses, wireless follow focus, accessories), Technogrips Vienna is only liable in cases of proven intent or gross negligence by our personnel. Comprehensive equipment insurance is the responsibility of the renter/production company.\n6.3 Any damage or defects must be reported to the operator on set immediately and documented in writing.',
      value_fr:'6.1 Technogrips Vienna dispose d\'une assurance responsabilité civile professionnelle conforme aux normes du secteur.\n6.2 Pour les dommages ou pertes d\'équipements tiers montés sur la grue, Technogrips Vienna n\'est responsable qu\'en cas de faute intentionnelle ou de négligence grave prouvée. L\'assurance tous risques du matériel incombe au locataire.\n6.3 Tout dommage doit être immédiatement signalé à l\'opérateur sur le plateau et consigné par écrit.',
      value_cs:'6.1 Společnost Technogrips Vienna má sjednáno pojištění odpovědnosti za škodu v oboru.\n6.2 Za poškození či ztrátu vybavení zákazníka namontovaného na jeřábu odpovídá Technogrips Vienna pouze v případě prokázaného úmyslu nebo hrubé nedbalosti. Pojištění vybavení náleží nájemci.\n6.3 Jakékoli škody musí být operátorovi neprodleně nahlášeny na place a písemně zaprotokolovány.' },
    { section:'terms', key:'jurisdiction_title', label:'§ 7 Titel', type:'text',
      value_de:'§ 7 Erfüllungsort, Gerichtsstand & Anwendbares Recht',
      value_en:'§ 7 Place of Performance, Jurisdiction & Applicable Law',
      value_fr:'§ 7 Lieu d\'exécution, Juridiction & Droit applicable',
      value_cs:'§ 7 Místo plnění, soudní příslušnost a rozhodné právo' },
    { section:'terms', key:'jurisdiction_text', label:'§ 7 Text', type:'textarea',
      value_de:'7.1 Erfüllungsort für alle Leistungen und Zahlungen ist Wien, Österreich.\n7.2 Ausschließlicher Gerichtsstand für alle Rechtsstreitigkeiten aus oder im Zusammenhang mit diesem Vertragsverhältnis ist das sachlich zuständige Gericht in Wien.\n7.3 Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts (CISG) und der Verweisungsnormen des internationalen Privatrechts.\n7.4 Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.',
      value_en:'7.1 The place of performance for all services and payments is Vienna, Austria.\n7.2 The exclusive place of jurisdiction for all legal disputes arising from or in connection with this contract is the competent court in Vienna, Austria.\n7.3 Austrian law shall apply exclusively, excluding the UN Convention on Contracts for the International Sale of Goods (CISG) and conflict-of-law rules.\n7.4 Should individual provisions of these Terms and Conditions be or become invalid, the validity of the remaining provisions shall remain unaffected.',
      value_fr:'7.1 Le lieu d\'exécution pour toutes les prestations et paiements est Vienne, Autriche.\n7.2 Le tribunal compétent de Vienne, Autriche, est seul compétent pour tout litige.\n7.3 Le droit autrichien s\'applique exclusivement, à l\'exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM).\n7.4 Si certaines dispositions devenaient invalides, la validité des autres dispositions n\'en serait pas affectée.',
      value_cs:'7.1 Místem plnění pro veškerá plnění a platby je Vídeň, Rakousko.\n7.2 Výlučným místem soudní příslušnosti pro všechny spory je věcně příslušný soud ve Vídni, Rakousko.\n7.3 Platí výhradně rakouské právo s vyloučením Úmluvy OSN o smlouvách o mezinárodní koupi zboží (CISG).\n7.4 Pokud by některé ustanovení těchto VOP bylo neplatné, platnost ostatních ustanovení tím zůstává nedotčena.' },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        section: item.section,
        key: item.key,
        label: item.label || item.key,
        value_de: item.value_de || '',
        value_en: item.value_en || '',
        value_fr: item.value_fr || item.value_en || item.value_de || '',
        value_cs: item.value_cs || item.value_en || item.value_de || '',
        type: item.type || 'text'
      });
    }
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
