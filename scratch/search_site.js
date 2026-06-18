const fs = require('fs');
const path = require('path');

const contentPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\cb93816d-3621-40ea-9129-2b2f1fae7410\\.system_generated\\steps\\1415\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

// Strip HTML tags to make it readable
const plainText = content.replace(/<[^>]*>/g, ' ');

// Look for lines containing numbers followed by m, kg, t, or names of specs
const lines = plainText.split('\n');
console.log('--- Matches ---');
lines.forEach((line, idx) => {
  const cleanLine = line.trim().replace(/\s+/g, ' ');
  if (cleanLine.match(/(max|min|nutz|payload|weight|gewicht|länge|reich|höhe|m\b|kg\b|t\b|outrigger|dolly|maße|säule)/i)) {
    if (cleanLine.length > 5 && cleanLine.length < 200) {
      console.log(`${idx + 1}: ${cleanLine}`);
    }
  }
});
