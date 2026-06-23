let worker = null;
const pendingQueries = new Map();
let queryIdCounter = 0;

export function initWorker(manifest) {
  return new Promise((resolve, reject) => {
    // Instantiate the Web Worker
    worker = new Worker(new URL('./duckdb.worker.js', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      const { type, payload, error } = e.data;
      
      if (type === 'INIT_DONE') {
        resolve();
      } else if (type === 'ERROR') {
        reject(new Error(error));
      } else if (type === 'QUERY_RESULT') {
        const { queryId, buffer } = payload;
        console.log(`[Main] Received QUERY_RESULT for ${queryId}. Buffer size: ${buffer.byteLength}`);
        if (pendingQueries.has(queryId)) {
          pendingQueries.get(queryId).resolve(buffer);
          pendingQueries.delete(queryId);
        }
      } else if (type === 'QUERY_ERROR') {
        const { queryId, error: qError } = payload;
        console.error(`[Main] Received QUERY_ERROR for ${queryId}:`, qError);
        if (pendingQueries.has(queryId)) {
          pendingQueries.get(queryId).reject(new Error(qError));
          pendingQueries.delete(queryId);
        }
      }
    };
    
    worker.postMessage({ type: 'INIT', payload: { manifest } });
  });
}

export function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      return reject(new Error('Worker not initialized'));
    }
    
    const queryId = queryIdCounter++;
    pendingQueries.set(queryId, { resolve, reject });
    
    worker.postMessage({ type: 'QUERY', payload: { queryId, sql } });
  });
}
