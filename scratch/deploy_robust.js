const ftp = require('basic-ftp');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function getFtpClient() {
  const client = new ftp.Client(30000); // 30s timeout
  client.ftp.verbose = false;
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
    secure: process.env.FTP_SECURE === 'true'
  });
  return client;
}

async function uploadDirectoryWithRetry(client, localDir, remoteTarget, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n🚀 Uploading to ${remoteTarget} (Versuch ${attempt}/${retries})...`);
      await client.ensureDir(remoteTarget);
      await client.uploadFromDir(localDir);
      console.log(`✅ Upload nach ${remoteTarget} ERFOLGREICH!`);
      return;
    } catch (err) {
      console.warn(`⚠️ FTP Upload Warnung bei ${remoteTarget} (Versuch ${attempt}): ${err.message}`);
      if (attempt === retries) throw err;
      console.log("Erneuter Verbindungsaufbau in 3 Sekunden...");
      await new Promise(r => setTimeout(r, 3000));
      try { client.close(); } catch(e){}
      client = await getFtpClient();
    }
  }
}

async function runRobustDeploy() {
  console.log("🛠️ Erstelle Tailwind CSS Build...");
  execSync('npm run build:css', { stdio: 'inherit' });

  const publicDir = path.join(__dirname, '..', 'public');
  let client;

  try {
    console.log("\n📡 Verbinde mit FTP...");
    client = await getFtpClient();

    // Target 1: /technogrips-viennaat
    await uploadDirectoryWithRetry(client, publicDir, "/technogrips-viennaat");

    // Target 2: /httpdocs
    await uploadDirectoryWithRetry(client, publicDir, "/httpdocs");

    console.log("\n🎉 DEPLOYMENT AUF BEIDEN TARGETS MANDATSMÄSSIG UND ERFOLGREICH ABGESCHLOSSEN!");

  } catch (err) {
    console.error("❌ Endgültiger Fehler beim Deployment:", err.message);
  } finally {
    if (client) client.close();
  }
}

runRobustDeploy();
