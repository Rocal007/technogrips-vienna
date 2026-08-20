const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const remoteDbPath = path.join(__dirname, 'remote_technogrips_data.sqlite');
const localDbPath = path.join(__dirname, '..', 'data', 'leads.db');
const localApiDbPath = path.join(__dirname, '..', 'public', 'api', 'db', 'data.sqlite');

const remoteDb = new Database(remoteDbPath);
const localDb = new Database(localDbPath);

console.log('=== PAGE_CONTENT DIFFERENCES ===');
const remoteContent = remoteDb.prepare('SELECT * FROM page_content').all();
const localContent = localDb.prepare('SELECT * FROM page_content').all();

const localMap = new Map();
localContent.forEach(r => localMap.set(`${r.section}:${r.key}`, r));

let diffCount = 0;
remoteContent.forEach(r => {
  const key = `${r.section}:${r.key}`;
  const loc = localMap.get(key);
  if (!loc) {
    console.log(`[NEW IN REMOTE] ${key}: DE="${r.value_de}", EN="${r.value_en}"`);
    diffCount++;
  } else if (loc.value_de !== r.value_de || loc.value_en !== r.value_en) {
    console.log(`[DIFF] ${key}:`);
    console.log(`  REMOTE DE: "${r.value_de}"`);
    console.log(`  LOCAL  DE: "${loc.value_de}"`);
    console.log(`  REMOTE EN: "${r.value_en}"`);
    console.log(`  LOCAL  EN: "${loc.value_en}"`);
    diffCount++;
  }
});
console.log(`Total page_content diffs: ${diffCount}`);

console.log('\n=== PAGE_SECTIONS DIFFERENCES ===');
const remoteSections = remoteDb.prepare('SELECT * FROM page_sections').all();
const localSections = localDb.prepare('SELECT * FROM page_sections').all();

const locSecMap = new Map();
localSections.forEach(r => locSecMap.set(r.section_id, r));

let secDiffCount = 0;
remoteSections.forEach(r => {
  const loc = locSecMap.get(r.section_id);
  if (!loc) {
    console.log(`[NEW SECTION IN REMOTE] ${r.section_id}: hidden=${r.is_hidden}`);
    secDiffCount++;
  } else if (loc.is_hidden !== r.is_hidden || loc.sort_order !== r.sort_order) {
    console.log(`[DIFF SECTION] ${r.section_id}: REMOTE hidden=${r.is_hidden}, sort=${r.sort_order} | LOCAL hidden=${loc.is_hidden}, sort=${loc.sort_order}`);
    secDiffCount++;
  }
});
console.log(`Total page_sections diffs: ${secDiffCount}`);

console.log('\n=== MEDIA DIFFERENCES ===');
const remoteMedia = remoteDb.prepare('SELECT * FROM media').all();
const localMedia = localDb.prepare('SELECT * FROM media').all();
console.log(`Remote media rows: ${remoteMedia.length}, Local media rows: ${localMedia.length}`);

