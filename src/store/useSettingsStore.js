import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GEOSPATIAL_CONFIG } from '../core/config/map';

export const useSettingsStore = create(
  persist(
    (set) => ({
      mapStyle: 'voyager', // We will store the key: 'dark', 'light', 'voyager'
      setMapStyle: (style) => set({ mapStyle: style }),
    }),
    {
      name: 'clearway-settings',
    }
  )
);
