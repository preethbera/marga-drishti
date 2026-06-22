import { create } from 'zustand';
import { syncDataFiles } from '../core/storage/syncManager';
import { initWorker } from '../core/engine/queryClient';

export const useDataStore = create((set, get) => ({
  isSyncing: false,
  isEngineReady: false,
  syncMessage: 'Initializing...',
  error: null,
  
  initializeDataEngine: async () => {
    if (get().isEngineReady || get().isSyncing) return;
    
    set({ isSyncing: true, error: null, syncMessage: 'Starting sync...' });
    
    try {
      // 1. Sync data files from public folder to OPFS
      const manifest = await syncDataFiles((msg) => set({ syncMessage: msg }));
      
      set({ syncMessage: 'Starting DuckDB engine...' });
      // 2. Instantiate queryClient and load DuckDB worker with manifest
      await initWorker(manifest);
      
      // 3. Update state
      set({ isSyncing: false, isEngineReady: true, syncMessage: '' });
    } catch (err) {
      console.error('Failed to initialize data engine:', err);
      set({ isSyncing: false, error: err.message });
    }
  }
}));
