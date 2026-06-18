const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/leads.db');
const db = new Database(dbPath);

console.log('Connecting to database:', dbPath);

try {
  // Query all page content entries
  const rows = db.prepare('SELECT id, value_de, value_en FROM page_content').all();
  
  const updateStmt = db.prepare('UPDATE page_content SET value_de = ?, value_en = ? WHERE id = ?');
  
  let updatedCount = 0;
  for (const row of rows) {
    let changed = false;
    let de = row.value_de;
    let en = row.value_en;
    
    if (de && (de.includes('Z-Head') || de.includes('z-head') || de.includes('Z-HEAD'))) {
      de = de.replace(/Z-Head/g, 'S-Head')
             .replace(/z-head/g, 's-head')
             .replace(/Z-HEAD/g, 'S-HEAD');
      changed = true;
    }
    
    if (en && (en.includes('Z-Head') || en.includes('z-head') || en.includes('Z-HEAD'))) {
      en = en.replace(/Z-Head/g, 'S-Head')
             .replace(/z-head/g, 's-head')
             .replace(/Z-HEAD/g, 'S-HEAD');
      changed = true;
    }
    
    if (changed) {
      updateStmt.run(de, en, row.id);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} rows in page_content table.`);
} catch (err) {
  console.error('Error updating database:', err);
} finally {
  db.close();
}
