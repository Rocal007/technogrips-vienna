require('dotenv').config();
const ftp = require('basic-ftp');
const { execSync } = require('child_process');

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    console.log("Verbinde mit FTP...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    console.log("Installiere Abhängigkeiten (falls nötig)...");
    execSync('npm install', { stdio: 'inherit' });
    
    console.log("Erstelle Tailwind CSS Build...");
    execSync('npm run build:css', { stdio: 'inherit' });
    
    const targets = ["/httpdocs", "/technogrips-viennaat"];
    for (const targetDir of targets) {
      console.log(`\n========================================`);
      console.log(`Wechsle in Zielverzeichnis: ${targetDir}`);
      console.log(`========================================`);
      await client.ensureDir(targetDir);
      console.log(`Starte Upload des 'public' Ordners nach ${targetDir}...`);
      await client.uploadFromDir("e:/technogrips-vienna/public");
      console.log(`✅ Upload nach ${targetDir} erfolgreich abgeschlossen!`);
    }
    
    console.log("\n🎉 Gesamt-Upload auf alle Server-Ziele erfolgreich abgeschlossen!");
  }
  catch(err) {
    console.error("\n❌ Fehler beim Upload:", err);
  }
  client.close();
}

deploy();
