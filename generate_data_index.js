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

function getParquetFiles(dir, type = 'unknown') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // The folder name becomes the type
      results = results.concat(getParquetFiles(filePath, file));
    } else if (file.endsWith('.parquet')) {
      results.push({
        name: type === 'unknown' ? file : `${type}/${file}`,
        type: type
      });
    }
  }
  return results;
}

const files = getParquetFiles(dataDir);

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(files, null, 2));
console.log(`Successfully generated public/data/index.json with ${files.length} parquet files:`);
console.log(files.map(f => f.name));
