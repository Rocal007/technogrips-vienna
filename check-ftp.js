require('dotenv').config();
const ftp = require('basic-ftp');

async function checkFolders() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    console.log("Checking httpdocs:");
    let list1 = await client.list('/httpdocs');
    console.log(list1.map(i => i.name).join(', ') || 'empty');
    
    console.log("\nChecking technogrips-viennaat:");
    let list2 = await client.list('/technogrips-viennaat');
    console.log(list2.map(i => i.name).join(', ') || 'empty');
    
  }
  catch(err) {
    console.error(err);
  }
  client.close();
}

checkFolders();
