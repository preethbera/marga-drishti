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

function getFiles(dir, type = 'unknown') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // The folder name becomes the type
      results = results.concat(getFiles(filePath, file));
    } else if (file.endsWith('.parquet') || file.endsWith('.json')) {
      // Avoid indexing the index itself!
      if (file === 'index.json') continue;
      
      const format = file.endsWith('.json') ? 'json' : 'parquet';
      const relativeName = type === 'unknown' ? file : `${type}/${file}`;
      
      const entry = {
        name: relativeName,
        type: type,
        format: format
      };
      
      if (type === 'mappings' && format === 'json') {
        entry.type = 'mapping';
        entry.tableName = `dim_${file.replace('.json', '')}`;
      }
      
      results.push(entry);
    }
  }
  return results;
}

const files = getFiles(dataDir);

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(files, null, 2));
console.log(`Successfully generated public/data/index.json with ${files.length} files:`);
console.log(files.map(f => f.name));
