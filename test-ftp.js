require('dotenv').config();
const ftp = require('basic-ftp');

async function testConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    console.log("Versuche Verbindung zu Easyname FTP herzustellen...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    console.log("\n✅ Erfolgreich verbunden!");
    
    console.log("\nInhalt des Basisverzeichnisses (" + (process.env.FTP_REMOTE_DIR || '/') + "):");
    await client.cd(process.env.FTP_REMOTE_DIR || '/');
    const list = await client.list();
    if (list.length === 0) {
      console.log("(Das Verzeichnis ist leer)");
    } else {
      list.forEach(item => {
        console.log(`- ${item.name} (${item.type === 2 ? 'Ordner' : 'Datei'})`);
      });
    }
  }
  catch(err) {
    console.error("\n❌ Verbindungsfehler:", err.message);
  }
  client.close();
}

testConnection();
