const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const remoteDbPath = path.join(__dirname, 'scratch', 'remote_technogrips_data.sqlite');
console.log('Path:', remoteDbPath);
console.log('Exists:', fs.existsSync(remoteDbPath));

const db = new Database(remoteDbPath);
console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

console.log('\n=== PAGE SECTIONS ===');
const sections = db.prepare('SELECT * FROM page_sections ORDER BY page, sort_order').all();
console.table(sections);

console.log('\n=== PAGE CONTENT (sample) ===');
const content = db.prepare('SELECT section, key, value_de FROM page_content LIMIT 15').all();
console.table(content);
