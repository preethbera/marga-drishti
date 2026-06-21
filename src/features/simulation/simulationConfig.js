export const SIMULATION_CHART_CONFIG = {
  // PCU curve family colors — index maps to curvePCULevels position
  curveColors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#3b82f6'],
  currentCurveColor: '#60a5fa',   // accent color for the active PCU curve
  currentCurveWidth: 3,           // strokeWidth for active curve
  defaultCurveWidth: 1.5,

  referenceLineColor: '#94a3b8',  // muted for horizontal reference lines
  currentKLineColor: '#f59e0b',   // vertical current-K line

  gridlock: {
    color: '#ef4444',
    label: 'GRIDLOCKED',
  },
  riskZones: {
    safe:     { threshold: 0.60, color: '#22c55e', label: 'Safe' },
    marginal: { threshold: 0.85, color: '#eab308', label: 'Marginal' },
    critical: { threshold: 1.00, color: '#ef4444', label: 'Critical' },
  },
  attribution: {
    densityColor: '#64748b',   // slate — density-induced loss
    parkingColor: '#ef4444',   // red — parking-induced loss
    remainingColor: '#22c55e', // green — remaining speed
  },
  crossSection: {
    parkedColor: '#ef4444',
    usableColor: '#22c55e',
    warningColor: '#eab308',
    laneLineColor: '#94a3b8',
  },
  axes: {
    KLabel: 'Traffic Density K (veh/km)',
    VLabel: 'Predicted Speed V (km/h)',
    PCULabel: 'Parked Blockage (PCU)',
  }
};
