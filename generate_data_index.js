import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'public', 'data');

if (!fs.existsSync(dataDir)) {
  console.log("No public/data folder found.");
  process.exit(0);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.parquet'));

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(files, null, 2));
console.log(`Successfully generated public/data/index.json with ${files.length} parquet files:`);
console.log(files);
