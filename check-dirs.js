require('dotenv').config();
const ftp = require('basic-ftp');

async function checkDirs() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21
    });
    console.log("=== /httpdocs ===");
    let h = await client.list('/httpdocs');
    h.forEach(i => console.log(i.name));
    
    console.log("\n=== /technogrips-viennaat ===");
    let t = await client.list('/technogrips-viennaat');
    t.forEach(i => console.log(i.name));
  } catch(e) { console.error(e); }
  client.close();
}
checkDirs();
