const Database = require('better-sqlite3');
const path = require('path');

const db1Path = path.join(__dirname, '..', 'data', 'leads.db');
const db2Path = path.join(__dirname, '..', 'public', 'api', 'db', 'data.sqlite');

const db1 = new Database(db1Path);
console.log('=== DATA/LEADS.DB ===');
console.log('page_content count:', db1.prepare('SELECT COUNT(*) as c FROM page_content').get().c);
console.log('page_sections count:', db1.prepare('SELECT COUNT(*) as c FROM page_sections').get().c);
console.log('media count:', db1.prepare('SELECT COUNT(*) as c FROM media').get().c);
console.log('Sample updated entry:', db1.prepare("SELECT section, key, value_de, updated_at FROM page_content WHERE key='hero_bg_image' AND section='about'").get());

const db2 = new Database(db2Path);
console.log('\n=== PUBLIC/API/DB/DATA.SQLITE ===');
console.log('page_content count:', db2.prepare('SELECT COUNT(*) as c FROM page_content').get().c);
console.log('page_sections count:', db2.prepare('SELECT COUNT(*) as c FROM page_sections').get().c);
console.log('media count:', db2.prepare('SELECT COUNT(*) as c FROM media').get().c);
console.log('Sample updated entry:', db2.prepare("SELECT section, key, value_de, updated_at FROM page_content WHERE key='hero_bg_image' AND section='about'").get());

db1.close();
db2.close();
