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
    
    const targetDir = "/httpdocs";
    console.log(`Wechsle in Zielverzeichnis: ${targetDir}`);
    await client.ensureDir(targetDir);
    
    console.log("Installiere Abhängigkeiten (falls nötig)...");
    execSync('npm install', { stdio: 'inherit' });
    
    console.log("Erstelle Tailwind CSS Build...");
    execSync('npm run build:css', { stdio: 'inherit' });
    
    console.log("Starte Upload des 'public' Ordners...");
    await client.uploadFromDir("e:/technogrips-vienna/public");
    console.log("\n✅ Upload erfolgreich abgeschlossen!");
    
  }
  catch(err) {
    console.error("\n❌ Fehler beim Upload:", err);
  }
  client.close();
}

deploy();
