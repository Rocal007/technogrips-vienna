require('dotenv').config();
const ftp = require('basic-ftp');
const https = require('https');
const path = require('path');
const fs = require('fs');

async function fullSync() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    console.log("📡 Verbinde mit FTP-Server (" + process.env.FTP_HOST + ")...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: process.env.FTP_SECURE === 'true'
    });
    
    const targets = ['/technogrips-viennaat', '/httpdocs'];

    for (const target of targets) {
      console.log(`\n📂 Synchronisiere Zielverzeichnis: ${target} ...`);
      
      // 1. Ensure DB directory and upload data.sqlite
      await client.ensureDir(`${target}/api/db`);
      await client.uploadFrom("e:/technogrips-vienna/public/api/db/data.sqlite", "data.sqlite");
      await client.uploadFrom("e:/technogrips-vienna/public/api/db/.htaccess", ".htaccess");
      console.log(`  ✅ ${target}/api/db/data.sqlite hochgeladen`);

      // 2. Upload API files
      await client.ensureDir(`${target}/api`);
      await client.uploadFrom("e:/technogrips-vienna/public/api/booking.php", "booking.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/content.php", "content.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/leads.php", "leads.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/db.php", "db.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/auth.php", "auth.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/sections.php", "sections.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/media.php", "media.php");
      await client.uploadFrom("e:/technogrips-vienna/public/api/.htaccess", ".htaccess");
      console.log(`  ✅ ${target}/api/ Dateien hochgeladen`);

      // 3. Upload shared.js
      await client.ensureDir(`${target}/assets/js`);
      await client.uploadFrom("e:/technogrips-vienna/public/assets/js/shared.js", "shared.js");
      console.log(`  ✅ ${target}/assets/js/shared.js hochgeladen`);

      // 4. Upload HTML pages
      await client.ensureDir(target);
      await client.uploadFrom("e:/technogrips-vienna/public/index.html", "index.html");

      await client.ensureDir(`${target}/kontakt`);
      await client.uploadFrom("e:/technogrips-vienna/public/kontakt/index.html", "index.html");

      await client.ensureDir(`${target}/supertechno-50`);
      await client.uploadFrom("e:/technogrips-vienna/public/supertechno-50/index.html", "index.html");

      await client.ensureDir(`${target}/tracking`);
      await client.uploadFrom("e:/technogrips-vienna/public/tracking/index.html", "index.html");

      await client.ensureDir(`${target}/kran-test`);
      await client.uploadFrom("e:/technogrips-vienna/public/kran-test/index.html", "index.html");

      await client.ensureDir(`${target}/leistungen`);
      await client.uploadFrom("e:/technogrips-vienna/public/leistungen/index.html", "index.html");

      await client.ensureDir(`${target}/ueber-uns`);
      await client.uploadFrom("e:/technogrips-vienna/public/ueber-uns/index.html", "index.html");

      await client.ensureDir(`${target}/impressum`);
      await client.uploadFrom("e:/technogrips-vienna/public/impressum/index.html", "index.html");

      await client.ensureDir(`${target}/datenschutz`);
      await client.uploadFrom("e:/technogrips-vienna/public/datenschutz/index.html", "index.html");

      await client.ensureDir(`${target}/agb`);
      await client.uploadFrom("e:/technogrips-vienna/public/agb/index.html", "index.html");

      await client.ensureDir(`${target}/admin`);
      await client.uploadFrom("e:/technogrips-vienna/public/admin/admin_content.html", "admin_content.html");
      await client.uploadFrom("e:/technogrips-vienna/public/admin/index.php", "index.php");

      console.log(`  ✅ ${target} alle Seiten und Skripte synchronisiert`);
    }

    console.log("\n🚀 Synchronisation vollständig abgeschlossen!");
  } catch(err) {
    console.error("\n❌ Fehler beim Sync:", err);
  } finally {
    client.close();
  }

  // 5. Verify live database API
  console.log("\n🔍 Verifiziere Live-API unter https://www.technogrips-vienna.at/api/content.php ...");
  const req = https.get('https://www.technogrips-vienna.at/api/content.php', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log("✅ Live API Daten verifiziert:");
        console.log("  - phone_mobile:", json.contact?.phone_mobile);
        console.log("  - phone_office:", json.contact?.phone_office);
        console.log("  - email:", json.contact?.email);
        console.log("  - location:", json.contact?.location);
        console.log("  - about stat2_num:", json.about?.stat2_num);
        console.log("  - product spec_payload:", json.product?.spec_payload);
      } catch(e) {
        console.log("Live Response:", data.substring(0, 300));
      }
    });
  });
  req.on('error', err => console.error("API Test Fehler:", err.message));
}

fullSync();
