const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

async function downloadAndInspect() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21
    });

    const scratchDir = path.join(__dirname, 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

    const remotePath1 = '/technogrips-viennaat/api/db/data.sqlite';
    const localTmp1 = path.join(scratchDir, 'remote_technogrips_data.sqlite');
    await client.downloadTo(localTmp1, remotePath1);
    console.log('Downloaded', remotePath1, 'to', localTmp1);

    const remotePath2 = '/httpdocs/api/db/data.sqlite';
    const localTmp2 = path.join(scratchDir, 'remote_httpdocs_data.sqlite');
    await client.downloadTo(localTmp2, remotePath2);
    console.log('Downloaded', remotePath2, 'to', localTmp2);

    console.log('\n=== DB 1: /technogrips-viennaat/api/db/data.sqlite ===');
    const db1 = new Database(localTmp1);
    const tables1 = db1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tables1);

    for (const t of tables1) {
      const count = db1.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      console.log(` Table ${t}: ${count} rows`);
    }

    console.log('\n=== DB 2: /httpdocs/api/db/data.sqlite ===');
    const db2 = new Database(localTmp2);
    const tables2 = db2.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tables2);

    for (const t of tables2) {
      const count = db2.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      console.log(` Table ${t}: ${count} rows`);
    }

    console.log('\n=== LOCAL DB 1: public/api/db/data.sqlite ===');
    const dbLocalApi = new Database(path.join(__dirname, 'public', 'api', 'db', 'data.sqlite'));
    const tablesLocalApi = dbLocalApi.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tablesLocalApi);
    for (const t of tablesLocalApi) {
      const count = dbLocalApi.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      console.log(` Table ${t}: ${count} rows`);
    }

    console.log('\n=== LOCAL DB 2: data/leads.db ===');
    const dbLocalLeads = new Database(path.join(__dirname, 'data', 'leads.db'));
    const tablesLocalLeads = dbLocalLeads.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tablesLocalLeads);
    for (const t of tablesLocalLeads) {
      const count = dbLocalLeads.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      console.log(` Table ${t}: ${count} rows`);
    }

  } catch(e) {
    console.error('Error:', e);
  }
  client.close();
}
downloadAndInspect();
