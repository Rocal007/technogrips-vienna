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

function processFiles(dir, rootDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processFiles(fullPath, rootDir);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate relative prefix based on depth from rootDir
      const relativePath = path.relative(path.dirname(fullPath), rootDir);
      let prefix = relativePath === '' ? '.' : relativePath.replace(/\\/g, '/');
      
      // 1. Replace src="/..." and href="/..." with src="prefix/..."
      content = content.replace(/(href|src|action)=["']\/([^"']*)["']/g, `$1="${prefix}/$2"`);
      
      // 2. Replace url('/...') with url('prefix/...')
      content = content.replace(/url\(['"]?\/([^'"\)]*)['"]?\)/g, `url('${prefix}/$1')`);
      
      // 3. Fix JS hardcoded paths
      content = content.replace(/'\/assets\//g, `'${prefix}/assets/`);
      content = content.replace(/'\/api\//g, `'${prefix}/api/`);
      
      // 4. Fix internal navigation links to explicitly point to index.html to avoid 404s
      // The previous regex already made them relative like: href="../leistungen"
      // Now we append /index.html if they point to one of our folders
      content = content.replace(/(href=".*?)(leistungen|supertechno-50|ueber-uns|kontakt)(")/g, `$1$2/index.html$3`);
      
      // 5. Fix links to home page: href="../" -> href="../index.html"
      // (This handles links that were href="/")
      content = content.replace(/href="\.\/"/g, `href="./index.html"`);
      content = content.replace(/href="\.\.\/"/g, `href="../index.html"`);

      fs.writeFileSync(fullPath, content);
    }
  }
}

async function buildAndDeploy() {
  const srcDir = path.join(__dirname, 'public');
  const distDir = path.join(__dirname, 'dist');
  
  console.log("Erstelle Kopie mit komplett RELATIVEN Pfaden...");
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
  copyDir(srcDir, distDir);
  
  console.log("Passe Dateipfade an...");
  processFiles(distDir, distDir);
  
  console.log("Starte FTP Upload...");
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    // Wir laden nur in den versteckten Ordner hoch
    const targetDir = "/technogrips-viennaat/hidden-deploy";
    console.log(`Lade hoch nach ${targetDir}...`);
    await client.ensureDir(targetDir);
    await client.uploadFromDir(distDir);
    console.log("✅ Upload inklusive korrigierter RELATIVER Pfade abgeschlossen!");
  } catch(err) {
    console.error("❌ Fehler:", err);
  }
  client.close();
}

buildAndDeploy();
