const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
require('dotenv').config();

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function processFiles(dir, basePath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processFiles(fullPath, basePath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace absolute paths with the basePath prefix
      content = content.replace(/(href|src|action)=["']\/([^"']*)["']/g, `$1="${basePath}/$2"`);
      content = content.replace(/url\(['"]?\/([^'"\)]*)['"]?\)/g, `url('${basePath}/$1')`);
      
      // Also fix hardcoded paths in shared.js and inline scripts
      content = content.replace(/'\/assets\//g, `'${basePath}/assets/`);
      content = content.replace(/'\/api\//g, `'${basePath}/api/`);
      
      // Fix navigation links to explicitly point to index.html to avoid 404s on static hosting
      content = content.replace(/href="\/hidden-deploy\/(leistungen|supertechno-50|ueber-uns|kontakt)"/g, `href="/hidden-deploy/$1/index.html"`);
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

async function buildAndDeploy() {
  const srcDir = path.join(__dirname, 'public');
  const distDir = path.join(__dirname, 'dist');
  const basePath = '/hidden-deploy';
  
  console.log("Erstelle angepasste Kopie für den Unterordner...");
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
  copyDir(srcDir, distDir);
  
  console.log("Passe Dateipfade an...");
  processFiles(distDir, basePath);
  
  console.log("Starte FTP Upload...");
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    const targetDir = "/technogrips-viennaat/hidden-deploy";
    await client.ensureDir(targetDir);
    await client.uploadFromDir(distDir);
    console.log("✅ Upload inklusive korrigierter Bilder-Pfade abgeschlossen!");
  } catch(err) {
    console.error("❌ Fehler:", err);
  }
  client.close();
}

buildAndDeploy();
