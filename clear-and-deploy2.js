require('dotenv').config();
const ftp = require('basic-ftp');
const { execSync } = require('child_process');

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    // Changing target directory to /technogrips-viennaat
    const targetDir = "/technogrips-viennaat";
    console.log(`Wechsle in Zielverzeichnis: ${targetDir}`);
    await client.ensureDir(targetDir);
    
    console.log("Lese Verzeichnisinhalt...");
    const list = await client.list();
    for (const item of list) {
      if (item.name === 'cgi-bin' || item.name === '.' || item.name === '..' || item.name === 'hidden-deploy') {
        continue;
      }
      console.log(`Lösche: ${item.name}`);
      if (item.isDirectory) {
        await client.removeDir(item.name);
      } else {
        await client.remove(item.name);
      }
    }
    
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
