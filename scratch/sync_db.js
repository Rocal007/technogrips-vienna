const Database = require('better-sqlite3');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dbSqlite = new Database(path.join(rootDir, 'public', 'api', 'db', 'data.sqlite'));
const leadsDb = new Database(path.join(rootDir, 'data', 'leads.db'));

try { dbSqlite.exec('ALTER TABLE page_content ADD COLUMN value_fr TEXT'); } catch(e) {}
try { dbSqlite.exec('ALTER TABLE page_content ADD COLUMN value_cs TEXT'); } catch(e) {}

const insert = dbSqlite.prepare(`
  INSERT OR REPLACE INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type)
  VALUES (@section, @key, @label, @value_de, @value_en, @value_fr, @value_cs, @type)
`);

const rows = leadsDb.prepare('SELECT section, key, label, value_de, value_en, value_fr, value_cs, type FROM page_content').all();
const tx = dbSqlite.transaction((items) => {
  for (const item of items) insert.run(item);
});
tx(rows);
console.log('✅ Synced ' + rows.length + ' page_content rows to public/api/db/data.sqlite');
const countRows = dbSqlite.prepare('SELECT section, count(*) as count FROM page_content GROUP BY section').all();
console.log('data.sqlite sections:', countRows);
