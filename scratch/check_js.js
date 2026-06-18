const fs = require('fs');
const path = require('path');
const vm = require('vm');

try {
  const htmlPath = path.join(__dirname, '../public/kran-test/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Extract <script> blocks
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 1;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const code = match[1].trim();
    if (!code) continue;
    if (match[0].includes('src=')) {
      console.log(`Skipping external script ${scriptIndex}`);
      scriptIndex++;
      continue;
    }

    try {
      new vm.Script(code);
      console.log(`✅ Script block ${scriptIndex} compiled successfully.`);
    } catch (e) {
      console.error(`❌ Syntax error in Script block ${scriptIndex}:`, e.message);
      process.exit(1);
    }
    scriptIndex++;
  }
  console.log("All script blocks validated successfully!");
} catch (e) {
  console.error("Error reading file:", e.message);
  process.exit(1);
}
