import { useUiStore } from '@/store/useUiStore';
import { listOPFSFiles, getFileFromOPFS } from '@/lib/opfs';
import { DatabaseService } from '@/services/database.service';

let _initStarted = false;

export async function initializeAppData() {
  // Strict one-shot guard. This function runs exactly once, ever.
  if (_initStarted) return;
  _initStarted = true;

  const store = useUiStore.getState();

  try {
    // 1. Discover all available datasets
    const opfsFiles = await listOPFSFiles();
    const defaultFiles = [];

    try {
      const indexRes = await fetch('/data/index.json');
      if (indexRes.ok) {
        const potentialDefaults = await indexRes.json();
        for (const fileData of potentialDefaults) {
          const filename = typeof fileData === 'string' ? fileData : fileData.name;
          const type = typeof fileData === 'string' ? 'unknown' : fileData.type;
          const displayName = filename.includes('/') ? filename.split('/').pop() : filename;
          
          const url = `/data/${filename}`;
          try {
            const res = await fetch(url, { method: 'HEAD' });
            const contentType = res.headers.get('content-type');
            if (res.ok && (!contentType || !contentType.includes('text/html'))) {
              const sizeHeader = res.headers.get('content-length');
              defaultFiles.push({
                id: `System Default|${filename}`,
                name: filename,
                displayName: displayName,
                source: 'System Default',
                type: type,
                url: url,
                size: sizeHeader ? parseInt(sizeHeader, 10) : 0
              });
            }
          } catch (e) {
            console.warn(`Failed to fetch metadata for ${filename}`);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load /data/index.json");
    }

    const allDatasets = [...defaultFiles, ...opfsFiles];
    store.setAvailableDatasets(allDatasets);

    if (allDatasets.length === 0) {
      store.addLog('No datasets found.');
      return;
    }

    // 2. Mount all datasets into DuckDB
    const mountedTables = [];
    let totalRowCount = 0;

    for (const file of allDatasets) {
      store.addLog(`Mounting ${file.name}...`);
      try {
        let buffer;
        if (file.source === 'System Default') {
          buffer = await DatabaseService.fetchSystemDefault(file.url);
        } else {
          const opfsFile = await getFileFromOPFS(file.name);
          buffer = new Uint8Array(await opfsFile.arrayBuffer());
        }

        const { tableName, rowCount } = await DatabaseService.mountDataset(file.name, buffer);
        mountedTables.push(tableName);
        totalRowCount += rowCount;
        store.addLog(`Mounted ${file.name} successfully (${rowCount.toLocaleString()} rows).`);
      } catch (err) {
        store.addLog(`Failed to mount ${file.name}: ${err.message}`);
      }
    }

    // 3. Set the active dataset if there is one
    const persistedId = store.activeDatasetId;
    let targetFile = persistedId
      ? allDatasets.find(f => f.id === persistedId)
      : null;

    if (!targetFile) {
      targetFile = allDatasets.find(f => f.type === 'violations') || allDatasets.find(f => f.name.includes('violations')) || allDatasets[0];
    }

    if (targetFile) {
      const activeTableName = targetFile.name.split('/').pop().replace('.parquet', '').replace(/[^a-zA-Z0-9_]/g, '_');
      await DatabaseService.setActiveDataset(activeTableName);
      store.setActiveDatasetId(targetFile.id);
    }

    // 4. Signal to the entire app that data is ready
    store.setMountedDatasets(mountedTables);
    store.setIsDataLoaded(true, totalRowCount);

  } catch (e) {
    store.addLog(`Initialization Error: ${e.message}`);
    console.error('GlobalDataLoader init failed:', e);
  }
}
