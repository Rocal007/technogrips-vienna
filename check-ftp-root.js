require('dotenv').config();
const ftp = require('basic-ftp');

async function list() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21
    });
    console.log("=== /technogrips-viennaat ===");
    let t = await client.list('/technogrips-viennaat');
    t.forEach(i => console.log(i.name, i.size));
  } catch(e) { console.error(e); }
  client.close();
}
list();
