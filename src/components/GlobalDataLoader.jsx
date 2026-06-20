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
        for (const filename of potentialDefaults) {
          const url = `/data/${filename}`;
          try {
            const res = await fetch(url, { method: 'HEAD' });
            const contentType = res.headers.get('content-type');
            if (res.ok && (!contentType || !contentType.includes('text/html'))) {
              const sizeHeader = res.headers.get('content-length');
              defaultFiles.push({
                id: `System Default|${filename}`,
                name: filename,
                source: 'System Default',
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

    // 2. Pick which dataset to mount: previously active (persisted) or first available
    const persistedId = store.activeDatasetId;
    let targetFile = persistedId
      ? allDatasets.find(f => f.id === persistedId)
      : null;

    if (!targetFile) {
      targetFile = allDatasets[0];
    }

    // 3. Mount it into DuckDB
    store.addLog(`Mounting ${targetFile.name}...`);

    let buffer;
    if (targetFile.source === 'System Default') {
      buffer = await DatabaseService.fetchSystemDefault(targetFile.url);
    } else {
      const opfsFile = await getFileFromOPFS(targetFile.name);
      buffer = new Uint8Array(await opfsFile.arrayBuffer());
    }

    const rowCount = await DatabaseService.setActiveTable(targetFile.id, buffer);

    // 4. Signal to the entire app that data is ready
    store.setActiveDatasetId(targetFile.id);
    store.setIsDataLoaded(true, rowCount);
    store.addLog(`Mounted successfully (${rowCount.toLocaleString()} rows).`);

  } catch (e) {
    store.addLog(`Initialization Error: ${e.message}`);
    console.error('GlobalDataLoader init failed:', e);
  }
}
