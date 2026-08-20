const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'assets', 'images', 'BESToff', 'P1110467.webp');
console.log('Local BESToff/P1110467.webp exists:', fs.existsSync(imgPath));

const bestOffDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'BESToff');
if (fs.existsSync(bestOffDir)) {
  console.log('BESToff files:', fs.readdirSync(bestOffDir).slice(0, 10));
}
