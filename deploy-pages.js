require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

const filesToUpload = [
  'index.html',
  'supertechno-50/index.html',
  'leistungen/index.html',
  'ueber-uns/index.html',
  'kontakt/index.html',
  'impressum/index.html',
  'datenschutz/index.html',
  'agb/index.html',
  'tracking/index.html',
  'kran-test/index.html',
  'globe-component.html',
  'assets/css/tailwind.css'
];

async function uploadFileWithRetry(client, localPath, remotePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const remoteDir = path.posix.dirname(remotePath);
      await client.ensureDir(remoteDir);
      await client.uploadFrom(localPath, remotePath);
      console.log(`  ✓ Uploaded: ${remotePath}`);
      return;
    } catch (err) {
      console.warn(`  ⚠ Attempt ${attempt} failed for ${remotePath}: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1500));
      // Re-connect if disconnected
      try {
        await client.access({
          host: process.env.FTP_HOST,
          user: process.env.FTP_USER,
          password: process.env.FTP_PASSWORD,
          port: process.env.FTP_PORT || 21,
          secure: process.env.FTP_SECURE === 'true'
        });
      } catch (e) {}
    }
  }
}

async function deployAll() {
  const targets = ['/httpdocs', '/technogrips-viennaat'];
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log('Connecting to FTP...');
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    console.log('Connected.');

    for (const target of targets) {
      console.log(`\nDeploying to ${target}...`);
      for (const relFile of filesToUpload) {
        const localPath = path.join(__dirname, 'public', relFile);
        const remotePath = path.posix.join(target, relFile.replace(/\\/g, '/'));
        if (fs.existsSync(localPath)) {
          await uploadFileWithRetry(client, localPath, remotePath);
        } else {
          console.warn(`  File not found locally: ${localPath}`);
        }
      }
    }

    console.log('\n✅ All HTML & CSS files deployed successfully!');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deployAll();
