const fs = require('fs');
const cheerio = require('cheerio'); // or simple parsing if cheerio is not installed

const pages = [
  { file: 'public/index.html', defaultSec: 'home' },
  { file: 'public/ueber-uns/index.html', defaultSec: 'about' },
  { file: 'public/leistungen/index.html', defaultSec: 'services' },
  { file: 'public/supertechno-50/index.html', defaultSec: 'product' },
  { file: 'public/kontakt/index.html', defaultSec: 'contact' },
  { file: 'public/tracking/index.html', defaultSec: 'tracking' }
];

// Check existing DB content
const Database = require('better-sqlite3');
const db = new Database('./public/api/db/data.sqlite');
const existingRows = db.prepare('SELECT section, key, label, value_de, value_en FROM page_content').all();
const existingMap = new Map();
existingRows.forEach(r => {
  existingMap.set(`${r.section}.${r.key}`, r);
});

console.log(`Currently registered in DB: ${existingRows.length} items`);
