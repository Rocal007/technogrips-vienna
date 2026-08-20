const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const remoteDbPath = path.join(__dirname, 'scratch', 'remote_technogrips_data.sqlite');
const db = new Database(remoteDbPath);

console.log('=== UPDATED AT SUMMARY ===');
const updated = db.prepare("SELECT section, key, value_de, updated_at FROM page_content WHERE updated_at > '2026-06-08 15:55:59'").all();
console.table(updated);

console.log('\n=== ALL SECTIONS IN REMOTE DB ===');
const sections = db.prepare('SELECT page, section_key, visible, sort_order, updated_at FROM page_sections ORDER BY updated_at DESC').all();
console.table(sections);
