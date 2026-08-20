require('dotenv').config();
const ftp = require('basic-ftp');

async function checkHidden() {
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
    
    await client.cd("/technogrips-viennaat");
    
    console.log("Versuche .htaccess zu löschen...");
    try {
      await client.remove(".htaccess");
      console.log(".htaccess wurde gelöscht.");
    } catch(e) {
      console.log(".htaccess existierte nicht oder Fehler:", e.message);
    }

    console.log("Versuche index.php zu löschen...");
    try {
      await client.remove("index.php");
      console.log("index.php wurde gelöscht.");
    } catch(e) {
      console.log("index.php existierte nicht oder Fehler:", e.message);
    }

  }
  catch(err) {
    console.error("Fehler:", err);
  }
  client.close();
}

checkHidden();
