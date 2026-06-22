import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'index.json');

function computeHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function generateManifest() {
  const files = scanDirectory(DATA_DIR);
  const manifest = [];

  for (const file of files) {
    const relativePath = path.relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    
    let format = 'unknown';
    if (ext === '.parquet') format = 'parquet';
    if (ext === '.json' || ext === '.geojson') format = 'json';

    // Grouping by type based on subfolder structure
    const relativeToData = path.relative(DATA_DIR, file).replace(/\\/g, '/');
    const type = relativeToData.split('/')[0];

    const hash = computeHash(file);

    manifest.push({
      name: relativePath,
      type,
      format,
      hash
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Manifest generated at ${OUTPUT_FILE} with ${manifest.length} entries.`);
}

generateManifest();
