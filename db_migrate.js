const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'db.sqlite');
const db = new Database(dbPath);

try {
  db.exec("ALTER TABLE page_sections ADD COLUMN sort_order INTEGER DEFAULT 0");
  console.log("Column sort_order added successfully.");
  db.exec("UPDATE page_sections SET sort_order = id");
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log("Column sort_order already exists.");
  } else {
    console.error("Error:", err.message);
  }
}
db.close();
