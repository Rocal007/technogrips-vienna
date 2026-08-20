const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const remoteDbPath = path.join(__dirname, 'scratch', 'remote_technogrips_data.sqlite');
const localDbPath = path.join(__dirname, 'data', 'leads.db');
const localApiDbPath = path.join(__dirname, 'public', 'api', 'db', 'data.sqlite');

console.log('Remote DB exists:', fs.existsSync(remoteDbPath));
console.log('Local leads.db exists:', fs.existsSync(localDbPath));
console.log('Local api data.sqlite exists:', fs.existsSync(localApiDbPath));

if (fs.existsSync(remoteDbPath)) {
  const rDb = new Database(remoteDbPath);
  console.log('Remote DB tables:', rDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
}

if (fs.existsSync(localDbPath)) {
  const lDb = new Database(localDbPath);
  console.log('Local leads.db tables:', lDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
}

if (fs.existsSync(localApiDbPath)) {
  const aDb = new Database(localApiDbPath);
  console.log('Local api DB tables:', aDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
}
