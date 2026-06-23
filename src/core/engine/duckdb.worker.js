import * as duckdb from '@duckdb/duckdb-wasm';
import { tableToIPC } from 'apache-arrow';

let db = null;
let conn = null;

async function initDuckDB(manifest) {
  // Use jsdelivr bundles for a zero-config setup
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  conn = await db.connect();

  // Load the spatial extension
  await conn.query(`INSTALL spatial;`);
  await conn.query(`LOAD spatial;`);

  // Get OPFS root
  const root = await navigator.storage.getDirectory();

  // Helper to get file handle from path
  async function getOpfsFileHandle(filePath) {
    const parts = filePath.split('/').filter(Boolean);
    let currentDir = await root.getDirectoryHandle('v2', { create: true });
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }
    return await currentDir.getFileHandle(parts[parts.length - 1]);
  }

  // Loop through manifest to register each file handle, and group them for view creation
  const groupedByTable = {};
  for (const file of manifest) {
    try {
      const fileHandle = await getOpfsFileHandle(file.name);
      await db.registerFileHandle(`opfs/${file.name}`, fileHandle, duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true);
      
      const tableName = file.tableName || file.type;
      if (!groupedByTable[tableName]) {
        groupedByTable[tableName] = [];
      }
      groupedByTable[tableName].push({ path: `'opfs/${file.name}'`, format: file.format });
    } catch (e) {
      console.warn(`Could not register opfs file ${file.name}:`, e);
    }
  }

  for (const tableName of Object.keys(groupedByTable)) {
    // Determine the format by looking at the first file in the group
    const format = groupedByTable[tableName][0].format;
    const filePaths = groupedByTable[tableName].map(f => f.path).join(', ');
    
    let query = '';
    if (format === 'parquet') {
      query = `CREATE OR REPLACE VIEW ${tableName} AS SELECT * FROM read_parquet([${filePaths}])`;
    } else if (format === 'json') {
      query = `CREATE OR REPLACE VIEW ${tableName} AS SELECT * FROM read_json_auto([${filePaths}])`;
    }
    
    if (query) {
      try {
        await conn.query(query);
        console.log(`Created view ${tableName}`);
      } catch (err) {
        console.error(`Failed to create view for ${tableName}:`, err);
      }
    }
  }
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      await initDuckDB(payload.manifest);
      self.postMessage({ type: 'INIT_DONE' });
    } catch (error) {
      console.error('Failed to init DuckDB:', error);
      self.postMessage({ type: 'ERROR', error: error.message });
    }
  } else if (type === 'QUERY') {
    const { queryId, sql } = payload;
    try {
      if (!conn) throw new Error('DuckDB not initialized');
      
      const result = await conn.query(sql);
      
      // Serialize the Arrow Table to IPC buffer so it can be safely sent across postMessage
      const buffer = tableToIPC(result);
      
      self.postMessage({ type: 'QUERY_RESULT', payload: { queryId, buffer } });
    } catch (error) {
      console.error('Query error:', error);
      self.postMessage({ type: 'QUERY_ERROR', payload: { queryId, error: error.message } });
    }
  }
};
