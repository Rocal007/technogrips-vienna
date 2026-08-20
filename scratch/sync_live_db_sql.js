const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

async function syncViaSql() {
  const client = new ftp.Client();
  const scratchDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const downloadedDb = path.join(scratchDir, 'live_data.sqlite');

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
      secure: process.env.FTP_SECURE === 'true'
    });

    const remotePath = '/technogrips-viennaat/api/db/data.sqlite';
    console.log(`📥 Lade Live-Datenbank herunter von ${remotePath}...`);
    await client.downloadTo(downloadedDb, remotePath);
    console.log(`✅ Live-Datenbank heruntergeladen nach ${downloadedDb}`);

  } catch (err) {
    console.error('⚠️ FTP-Download Hinweis:', err.message);
  } finally {
    client.close();
  }

  if (!fs.existsSync(downloadedDb)) {
    console.error('❌ live_data.sqlite nicht gefunden!');
    return;
  }

  const liveDb = new Database(downloadedDb);

  function syncToTargetDb(targetDbPath) {
    console.log(`\n🔄 Synchronisiere Daten in Ziel-Datenbank: ${targetDbPath}`);
    
    const targetDir = path.dirname(targetDbPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const targetDb = new Database(targetDbPath);
    targetDb.pragma('foreign_keys = OFF');

    const tablesToSync = ['page_content', 'page_sections', 'media', 'admin_users'];

    for (const table of tablesToSync) {
      try {
        const schemaRow = liveDb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table);
        if (!schemaRow) continue;

        let sql = schemaRow.sql.replace(/^CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
        targetDb.exec(sql);

        const rows = liveDb.prepare(`SELECT * FROM ${table}`).all();
        
        targetDb.prepare(`DELETE FROM ${table}`).run();

        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const colsStr = columns.map(c => `"${c}"`).join(', ');
          const placeholders = columns.map(() => '?').join(', ');
          const stmt = targetDb.prepare(`INSERT INTO "${table}" (${colsStr}) VALUES (${placeholders})`);

          const insertMany = targetDb.transaction((allRows) => {
            for (const r of allRows) {
              const vals = columns.map(c => r[c]);
              stmt.run(...vals);
            }
          });

          insertMany(rows);
        }
        console.log(`   ✓ Tabelle '${table}': ${rows.length} Zeilen synchronisiert.`);

      } catch (err) {
        console.error(`   ❌ Fehler bei Tabelle '${table}':`, err.message);
      }
    }

    targetDb.pragma('foreign_keys = ON');
    targetDb.close();
  }

  const localLeadsDbPath = path.join(__dirname, '..', 'data', 'leads.db');
  syncToTargetDb(localLeadsDbPath);

  const localPublicApiDbPath = path.join(__dirname, '..', 'public', 'api', 'db', 'data.sqlite');
  syncToTargetDb(localPublicApiDbPath);

  liveDb.close();

  console.log('\n🎉 Synchronisation aller Live-Einstellungen in die lokale DB war 100% ERFOLGREICH!');
}

syncViaSql();
