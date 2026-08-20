const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function deployFast() {
  console.log("⚡ Starte schnelles gezieltes Live-Deployment...");

  // Compile CSS
  execSync('npm run build:css', { stdio: 'inherit' });

  const client = new ftp.Client(30000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    console.log("✅ FTP Verbunden!");

    const publicDir = path.join(__dirname, '..', 'public');
    const targets = ["/technogrips-viennaat", "/httpdocs"];

    for (const target of targets) {
      console.log(`\n-----------------------------------`);
      console.log(`🚀 Aktualisiere Target: ${target}`);
      console.log(`-----------------------------------`);
      await client.ensureDir(target);

      // 1. Upload HTML files
      const htmlFiles = [
        'index.html',
        'globe-component.html',
        'leistungen/index.html',
        'supertechno-50/index.html',
        'ueber-uns/index.html',
        'kontakt/index.html',
        'tracking/index.html',
        'kran-test/index.html',
        'admin/admin_content.html',
        'admin/index.php'
      ];

      for (const rel of htmlFiles) {
        const localFile = path.join(publicDir, rel);
        if (fs.existsSync(localFile)) {
          const remoteDir = path.posix.join(target, path.posix.dirname(rel));
          await client.ensureDir(remoteDir);
          const fileName = path.basename(rel);
          await client.uploadFrom(localFile, path.posix.join(remoteDir, fileName));
          console.log(`  ✓ Uploaded ${rel}`);
        }
      }

      // 2. Upload CSS & JS
      const cssDir = path.join(publicDir, 'assets', 'css');
      if (fs.existsSync(cssDir)) {
        await client.ensureDir(path.posix.join(target, 'assets', 'css'));
        await client.uploadFromDir(cssDir);
        console.log(`  ✓ Uploaded assets/css`);
      }

      const jsDir = path.join(publicDir, 'assets', 'js');
      if (fs.existsSync(jsDir)) {
        await client.ensureDir(path.posix.join(target, 'assets', 'js'));
        await client.uploadFromDir(jsDir);
        console.log(`  ✓ Uploaded assets/js`);
      }

      // 3. Upload API
      const apiDir = path.join(publicDir, 'api');
      if (fs.existsSync(apiDir)) {
        await client.ensureDir(path.posix.join(target, 'api'));
        await client.uploadFromDir(apiDir);
        console.log(`  ✓ Uploaded api/ (inkl. data.sqlite)`);
      }

      // 4. Upload Assets Images
      const imgDir = path.join(publicDir, 'assets', 'images');
      if (fs.existsSync(imgDir)) {
        await client.ensureDir(path.posix.join(target, 'assets', 'images'));
        await client.uploadFromDir(imgDir);
        console.log(`  ✓ Uploaded assets/images`);
      }

      // 5. Upload Assets Docs & Downloads
      const docsDir = path.join(publicDir, 'assets', 'docs');
      if (fs.existsSync(docsDir)) {
        await client.ensureDir(path.posix.join(target, 'assets', 'docs'));
        await client.uploadFromDir(docsDir);
        console.log(`  ✓ Uploaded assets/docs`);
      }

      const downloadsDir = path.join(publicDir, 'downloads');
      if (fs.existsSync(downloadsDir)) {
        await client.ensureDir(path.posix.join(target, 'downloads'));
        await client.uploadFromDir(downloadsDir);
        console.log(`  ✓ Uploaded downloads/`);
      }

      console.log(`✅ ${target} vollständig und blitzschnell aktualisiert!`);
    }

    console.log("\n🎉 FAZIT: Die Live-Version ist jetzt 100% AKTUELL auf allen Server-Ordnern!");

  } catch (err) {
    console.error("❌ Fehler beim Schnell-Deployment:", err.message);
  } finally {
    client.close();
  }
}

deployFast();
