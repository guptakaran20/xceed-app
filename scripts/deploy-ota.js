const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const FormData = require('form-data');
const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

const DIST_DIR = path.join(__dirname, '../dist');
const ZIP_PATH = path.join(__dirname, '../update.zip');
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');

// Get secret key from environment or prompt
const SECRET_KEY = process.env.OTA_SECRET_KEY;
// We should probably read this from the same logic getenvironment.js uses.
// For the script, we'll assume production by default unless an arg is passed
const isDev = process.argv.includes('--dev');
const SERVER_URL = isDev ? 'http://localhost:8010' : (process.env.OTA_SERVER_URL || 'https://xceed.nitj.ac.in');
const UPLOAD_URL = `${SERVER_URL}/api/v1/ota/upload`;

async function deploy() {
  console.log('🚀 Starting OTA Deployment...');

  // 1. Build the project
  console.log('📦 Building Vite project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed. Aborting deployment.');
    process.exit(1);
  }

  // 2. Read current version and bump patch version
  const pkg = require(PACKAGE_JSON_PATH);
  const currentVersion = pkg.version;
  const parts = currentVersion.split('.');
  parts[2] = parseInt(parts[2]) + 1;
  const newVersion = parts.join('.');
  
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2));
  console.log(`📈 Bumped version: ${currentVersion} -> ${newVersion}`);

  // 3. Zip the dist folder
  console.log('🗜️ Zipping dist folder...');
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    // Zip the contents of the dist folder, not the folder itself
    archive.directory(DIST_DIR, false);
    archive.finalize();
  });
  console.log('✅ Zipped successfully.');

  // 4. Upload to server
  console.log(`📤 Uploading to ${UPLOAD_URL}...`);
  try {
    const form = new FormData();
    form.append('version', newVersion);
    form.append('updateFile', fs.createReadStream(ZIP_PATH));

    const response = await axios.post(UPLOAD_URL, form, {
      headers: {
        ...form.getHeaders(),
        'x-ota-secret-key': SECRET_KEY,
      },
    });

    console.log('🎉 OTA Update Published Successfully!');
    console.log('URL:', response.data.url);
  } catch (error) {
    console.error('❌ Upload failed:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    // Cleanup zip
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }
  }
}

deploy();
