import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function GridlockAlert({ K, K_j_eff }) {
  return (
    <Alert variant="destructive" className="h-full flex flex-col justify-center border-red-500 bg-red-500/10">
      <AlertTriangle className="h-6 w-6 mb-2" />
      <AlertTitle className="text-xl font-bold uppercase tracking-widest">Road Gridlocked</AlertTitle>
      <AlertDescription className="text-base mt-2">
        Predicted Speed: <strong>0 km/h</strong>
        <br />
        <span className="text-sm opacity-90 mt-1 block">
          K ({K} veh/km) &ge; K_j,eff ({K_j_eff.toFixed(1)} veh/km)
        </span>
      </AlertDescription>
    </Alert>
  );
}
