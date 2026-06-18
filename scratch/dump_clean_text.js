const fs = require('fs');
const path = require('path');

const contentPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\cb93816d-3621-40ea-9129-2b2f1fae7410\\.system_generated\\steps\\1415\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

// Strip style and script tags first
let clean = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
// Strip all other HTML tags
clean = clean.replace(/<[^>]*>/g, ' ');
// Clean whitespace
clean = clean.replace(/\s+/g, ' ');

// Print lines
const lines = clean.split('.');
lines.forEach(line => {
  const trimLine = line.trim();
  if (trimLine.length > 5) {
    console.log(trimLine + '.');
  }
});
