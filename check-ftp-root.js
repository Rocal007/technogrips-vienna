require('dotenv').config();
const ftp = require('basic-ftp');

async function list() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    console.log("=== /httpdocs ===");
    let t = await client.list('/httpdocs');
    const fs = require('fs');
    fs.writeFileSync('ftp_files.txt', t.map(i => `${i.name} (${i.size})`).join('\n'));
    console.log("Wrote ftp_files.txt");
  } catch(e) { console.error(e); }
  client.close();
}
list();
