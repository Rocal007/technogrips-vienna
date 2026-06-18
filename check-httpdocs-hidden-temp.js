require('dotenv').config();
const ftp = require('basic-ftp');

async function check() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });

    console.log("=== Checking /httpdocs/hidden-deploy/admin/index.php ===");
    try {
      const list = await client.list('/httpdocs/hidden-deploy/admin');
      const f = list.find(i => i.name === 'index.php');
      if (f) {
        console.log(`Found! Size: ${f.size} bytes, Modified: ${f.rawModifiedAt}`);
      } else {
        console.log("Not found");
      }
    } catch(e) {
      console.log("Directory not found or error:", e.message);
    }

  } catch(e) {
    console.error("Fehler:", e.message);
  }
  client.close();
}
check();
