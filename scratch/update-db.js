const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/leads.db');
const db = new Database(dbPath);

console.log('Connecting to database:', dbPath);

try {
  // Update services.s3_desc
  db.prepare(`
    UPDATE page_content 
    SET value_de = 'Technische Beratung und Betreuung für Ihre Produktion. Wir arbeiten mit allen gängigen Remote-Head-Systemen.',
        value_en = 'Technical consultation and support for your production. We work with all common remote head systems.'
    WHERE section = 'services' AND key = 's3_desc'
  `).run();
  console.log('Updated services.s3_desc');

  // Update services.s3_title
  db.prepare(`
    UPDATE page_content 
    SET value_de = 'Technischer Support',
        value_en = 'Technical Support'
    WHERE section = 'services' AND key = 's3_title'
  `).run();
  console.log('Updated services.s3_title');

  // Update product.description
  db.prepare(`
    UPDATE page_content 
    SET value_de = 'Der Supertechno 50+ ist das meistverwendete Teleskop-Kamerakransystem weltweit. Er ist Indoor und Outdoor einsetzbar und bietet mit dem Techno Z-Head präzise Kamerasteuerung für jeden Shot – von der engen Studio-Aufnahme bis zum großen Outdoor-Event.',
        value_en = 'The Supertechno 50+ is the world''s most widely used telescopic camera crane system. It works indoors and outdoors, and with the Techno Z-Head provides precise camera control for every shot – from tight studio work to large outdoor events.'
    WHERE section = 'product' AND key = 'description'
  `).run();
  console.log('Updated product.description');

  // Update product.use2_desc
  db.prepare(`
    UPDATE page_content 
    SET value_de = 'Ideal für zeitkritische TV-Produktionen und Werbeaufnahmen. Schnelle Einrichtung am Set.',
        value_en = 'Ideal for time-critical TV productions and commercial shoots. Fast setup on set.'
    WHERE section = 'product' AND key = 'use2_desc'
  `).run();
  console.log('Updated product.use2_desc');

  // Delete product.spec_setup
  db.prepare(`
    DELETE FROM page_content 
    WHERE section = 'product' AND key = 'spec_setup'
  `).run();
  console.log('Deleted product.spec_setup');

  console.log('Database update completed successfully!');
} catch (err) {
  console.error('Error updating database:', err);
} finally {
  db.close();
}
