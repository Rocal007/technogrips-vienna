require('dotenv').config();
const ftp = require('basic-ftp');
const fs = require('fs');

async function downloadIndex() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    await client.downloadTo("remote-index.html", "/technogrips-viennaat/index.html");
    const content = fs.readFileSync("remote-index.html", "utf8");
    console.log("Title:", content.match(/<title>(.*?)<\/title>/)[1]);
    console.log("Includes 'Kran, Operator und Technik'?", content.includes("Kran, Operator und Technik"));
  }
  catch(err) {
    console.error("Fehler:", err);
  }
  client.close();
}

downloadIndex();
