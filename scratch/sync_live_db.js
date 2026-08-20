const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

async function syncLiveDb() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
      secure: process.env.FTP_SECURE === 'true'
    });

    const scratchDir = path.join(__dirname, '..', 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

    // Download live DB from /technogrips-viennaat/api/db/data.sqlite
    const remotePath = '/technogrips-viennaat/api/db/data.sqlite';
    const downloadedDb = path.join(scratchDir, 'live_data.sqlite');
    
    console.log(`📥 Lade Live-Datenbank herunter: ${remotePath}...`);
    await client.downloadTo(downloadedDb, remotePath);
    console.log(`✅ Live-Datenbank erfolgreich heruntergeladen nach ${downloadedDb}`);

    // Verify downloaded SQLite DB
    const testDb = new Database(downloadedDb);
    const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('📊 Verifizierte Tabellen in Live-DB:', tables);
    
    const contentCount = testDb.prepare('SELECT COUNT(*) as c FROM page_content').get().c;
    const sectionsCount = testDb.prepare('SELECT COUNT(*) as c FROM page_sections').get().c;
    const mediaCount = testDb.prepare('SELECT COUNT(*) as c FROM media').get().c;
    const adminCount = testDb.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
    
    console.log(`   - page_content: ${contentCount} Einträge`);
    console.log(`   - page_sections: ${sectionsCount} Einträge`);
    console.log(`   - media: ${mediaCount} Einträge`);
    console.log(`   - admin_users: ${adminCount} Einträge`);
    testDb.close();

    // Destination 1: data/leads.db
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    const leadsDbPath = path.join(dataDir, 'leads.db');
    const leadsWalPath = path.join(dataDir, 'leads.db-wal');
    const leadsShmPath = path.join(dataDir, 'leads.db-shm');

    if (fs.existsSync(leadsWalPath)) fs.unlinkSync(leadsWalPath);
    if (fs.existsSync(leadsShmPath)) fs.unlinkSync(leadsShmPath);

    fs.copyFileSync(downloadedDb, leadsDbPath);
    console.log(`✅ Lokale Node.js-Datenbank aktualisiert: ${leadsDbPath}`);

    // Destination 2: public/api/db/data.sqlite
    const publicApiDbDir = path.join(__dirname, '..', 'public', 'api', 'db');
    if (!fs.existsSync(publicApiDbDir)) fs.mkdirSync(publicApiDbDir, { recursive: true });

    const publicApiDbPath = path.join(publicApiDbDir, 'data.sqlite');
    fs.copyFileSync(downloadedDb, publicApiDbPath);
    console.log(`✅ Lokale PHP-API-Datenbank aktualisiert: ${publicApiDbPath}`);

    console.log('\n🎉 Synchronisation der Live-Einstellungen in die lokale DB erfolgreich abgeschlossen!');

  } catch (err) {
    console.error('❌ Fehler bei der Synchronisation:', err);
  } finally {
    client.close();
  }
}

syncLiveDb();
