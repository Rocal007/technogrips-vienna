require('dotenv').config();
const ftp = require('basic-ftp');

async function restore() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21
    });
    console.log("Restoring index.html to /technogrips-viennaat...");
    await client.uploadFrom("original-index.html", "/technogrips-viennaat/index.html");
    console.log("Done!");
  } catch(e) { console.error(e); }
  client.close();
}
restore();
