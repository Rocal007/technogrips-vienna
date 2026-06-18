require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');

async function deployLiveTest() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    console.log("Connecting to FTP...");
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: process.env.FTP_PORT || 21,
      secure: process.env.FTP_SECURE === 'true'
    });

    // Targets to deploy kran-test
    const kranTestTargets = [
      "/technogrips-viennaat/kran-test",
      "/technogrips-viennaat/lkran-test",
      "/httpdocs/kran-test",
      "/httpdocs/lkran-test"
    ];

    // Targets to deploy tracking
    const trackingTargets = [
      "/technogrips-viennaat/tracking",
      "/httpdocs/tracking"
    ];

    // Targets to deploy assets
    const assetsTargets = [
      "/technogrips-viennaat/assets",
      "/httpdocs/assets"
    ];

    async function uploadToTargets(localDir, targets) {
      for (const targetDir of targets) {
        console.log(`\n--------------------------------------------`);
        console.log(`Deploying ${localDir} to target: ${targetDir}`);
        console.log(`--------------------------------------------`);
        await client.ensureDir(targetDir);
        // We do not clear WorkingDir for assets as it might delete other assets
        if (!localDir.includes('assets')) {
          try {
            await client.clearWorkingDir();
          } catch (e) {
            console.warn(`Could not clear ${targetDir}:`, e.message);
          }
        }
        await client.uploadFromDir(localDir);
        console.log(`Uploaded successfully to ${targetDir}`);
      }
    }

    await uploadToTargets(path.join(__dirname, "public/kran-test"), kranTestTargets);
    await uploadToTargets(path.join(__dirname, "public/tracking"), trackingTargets);
    await uploadToTargets(path.join(__dirname, "public/assets"), assetsTargets);

    console.log("\n✅ Live test page deployment completed successfully!");
  } catch(err) {
    console.error("\n❌ Error during deployment:", err);
  }
  client.close();
}

deployLiveTest();
