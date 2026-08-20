const ftp = require('basic-ftp');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function fullDeploy() {
  console.log("🛠️ Erstelle meue Tailwind CSS Minified Build...");
  try {
    execSync('npm run build:css', { stdio: 'inherit' });
    console.log("✅ CSS Build erfolgreich abgeschlossen!");
  } catch (e) {
    console.error("❌ Fehler beim Erstellen des CSS Builds:", e.message);
    return;
  }

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log("\n📡 Verbinde mit FTP-Server...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    console.log("✅ FTP Verbindung hergestellt!");

    const publicDir = path.join(__dirname, '..', 'public');

    // Target 1: /technogrips-viennaat
    const target1 = "/technogrips-viennaat";
    console.log(`\n🚀 Upload nach Target 1: ${target1}...`);
    await client.ensureDir(target1);
    await client.uploadFromDir(publicDir);
    console.log(`✅ Target 1 (${target1}) erfolgreich hochgeladen!`);

    // Target 2: /httpdocs
    const target2 = "/httpdocs";
    console.log(`\n🚀 Upload nach Target 2: ${target2}...`);
    await client.ensureDir(target2);
    await client.uploadFromDir(publicDir);
    console.log(`✅ Target 2 (${target2}) erfolgreich hochgeladen!`);

    console.log("\n🎉 GESAMT-DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!");

  } catch (err) {
    console.error("❌ Fehler beim Deployment:", err);
  } finally {
    client.close();
  }
}

fullDeploy();
