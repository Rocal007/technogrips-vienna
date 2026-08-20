const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function getFtpClient() {
  const client = new ftp.Client(60000);
  client.ftp.verbose = false;
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
    secure: process.env.FTP_SECURE === 'true'
  });
  return client;
}

async function uploadDirToTarget(target, localDir, remoteSub) {
  let client;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Connecting FTP to upload ${remoteSub} -> ${target} (attempt ${attempt})...`);
      client = await getFtpClient();
      const remoteDir = path.posix.join(target, remoteSub);
      await client.ensureDir(remoteDir);
      await client.uploadFromDir(localDir);
      console.log(`✅ Successfully uploaded ${remoteSub} to ${target}!`);
      client.close();
      return;
    } catch (e) {
      console.warn(`⚠️ Error on attempt ${attempt}:`, e.message);
      if (client) { try { client.close(); } catch(err){} }
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function main() {
  const targets = ["/httpdocs", "/technogrips-viennaat"];
  const publicDir = path.join(__dirname, '..', 'public');
  
  for (const target of targets) {
    console.log(`\n================ Processing ${target} ================`);
    await uploadDirToTarget(target, path.join(publicDir, 'assets', 'docs'), 'assets/docs');
    await uploadDirToTarget(target, path.join(publicDir, 'downloads'), 'downloads');
  }
  console.log("\n🎉 All docs and downloads uploaded to both targets!");
}

main();
