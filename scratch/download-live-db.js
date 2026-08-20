require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function downloadLiveDb() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    console.log("Connecting to FTP...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT ? parseInt(process.env.FTP_PORT, 10) : 21,
      secure: process.env.FTP_SECURE === 'true'
    });
    
    // We will look for data.sqlite in potential remote paths
    const remotePaths = [
      "/technogrips-viennaat/hidden-deploy/api/db/data.sqlite",
      "/httpdocs/hidden-deploy/api/db/data.sqlite",
      "/hidden-deploy/api/db/data.sqlite"
    ];
    
    let foundPath = null;
    for (const rPath of remotePaths) {
      try {
        console.log(`Checking remote path: ${rPath}`);
        const size = await client.size(rPath);
        console.log(`Found file at ${rPath} (Size: ${size} bytes)`);
        foundPath = rPath;
        break;
      } catch (e) {
        console.log(`File not found at ${rPath}: ${e.message}`);
      }
    }
    
    if (!foundPath) {
      throw new Error("Could not find data.sqlite on the remote server in any of the expected paths.");
    }
    
    // Destinations to copy the downloaded database
    const localDestinations = [
      path.resolve(__dirname, '../public/api/db/data.sqlite'),
      path.resolve(__dirname, '../data/leads.db'),
      path.resolve(__dirname, '../server/db.sqlite') // just in case
    ];
    
    const tempFile = path.resolve(__dirname, 'temp_downloaded_data.sqlite');
    
    console.log(`Downloading remote database from ${foundPath} to temporary file ${tempFile}...`);
    await client.downloadTo(tempFile, foundPath);
    console.log("Download completed successfully.");
    
    // Overwrite the local files
    for (const localDest of localDestinations) {
      const destDir = path.dirname(localDest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(tempFile, localDest);
      console.log(`Updated local database: ${localDest}`);
    }
    
    // Remove the temp file
    fs.unlinkSync(tempFile);
    console.log("Cleaned up temporary download file.");
    console.log("✅ Database sync with live version completed successfully!");
    
  } catch (err) {
    console.error("❌ Error during database sync:", err);
  } finally {
    client.close();
  }
}

downloadLiveDb();
