/**
 * postinstall script: Strips broken sourceMappingURL comments from @duckdb/duckdb-wasm
 * worker files. Their sourcemaps reference files outside the package boundary, which
 * causes Vite's dev server to emit noisy warnings on every request.
 * 
 * This is a known upstream issue in @duckdb/duckdb-wasm.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join('node_modules', '@duckdb', 'duckdb-wasm', 'dist');

try {
  const workerFiles = readdirSync(distDir).filter(f => f.endsWith('.worker.js'));

  for (const file of workerFiles) {
    const filePath = join(distDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const cleaned = content.replace(/\/\/# sourceMappingURL=.*\.map\s*$/m, '');

    if (cleaned !== content) {
      writeFileSync(filePath, cleaned, 'utf-8');
      console.log(`  ✓ Stripped broken sourcemap from ${file}`);
    }
  }
} catch (e) {
  // Silently skip if duckdb-wasm isn't installed yet
}
