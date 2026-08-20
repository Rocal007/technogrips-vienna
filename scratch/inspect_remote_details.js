const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const remoteDbPath = path.join(__dirname, 'remote_technogrips_data.sqlite');
const db = new Database(remoteDbPath);

console.log('=== PAGE SECTIONS (is_hidden / sort_order) ===');
const sections = db.prepare('SELECT * FROM page_sections ORDER BY page, sort_order').all();
console.table(sections);

console.log('\n=== PAGE CONTENT (sample rows) ===');
const content = db.prepare('SELECT section, key, label, value_de, value_en FROM page_content LIMIT 30').all();
console.table(content);

console.log('\n=== MEDIA (sample rows) ===');
const media = db.prepare('SELECT id, filename, url, category, alt_text FROM media LIMIT 20').all();
console.table(media);

