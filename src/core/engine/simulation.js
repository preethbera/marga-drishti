// Simulation constants based on empirical macroscopic traffic flow
export const V_F = 67; // Empirical free-flow speed (km/h)
export const V_O = 33.5; // Optimum speed at maximum flow (km/h)
export const K_J_PER_METER = 10.86; // Jam density capacity per meter of road width (veh/km)
export const PCU_WIDTH_M = 3.0; // Road space consumed per 1 PCU parked (m)
export const MIN_W_EFF = 1.0; // Absolute minimum effective width floor to prevent math errors (m)

/**
 * Calculate effective width remaining after parked vehicle blockage.
 */
export const calculateEffectiveWidth = (W_total, PCU_parked) => {
  return Math.max(W_total - (PCU_parked * PCU_WIDTH_M), MIN_W_EFF);
};

/**
 * Calculate baseline jam density (without any parked vehicles).
 */
export const calculateBaselineJamDensity = (W_total) => {
  return W_total * K_J_PER_METER;
};

/**
 * Calculate effective jam density given the effective road width.
 */
export const calculateEffectiveJamDensity = (W_eff) => {
  return W_eff * K_J_PER_METER;
};

/**
 * Calculate predicted speed using the modified Greenberg Logarithmic Model.
 */
export const calculatePredictedSpeed = (K, K_j_eff) => {
  if (K <= 0) return Infinity; // Pure mathematical limit
  if (K >= K_j_eff) return 0; // Gridlock
  return V_O * Math.log(K_j_eff / K);
};

/**
 * Calculate the percentage of capacity lost due to parked vehicles.
 */
export const calculateCapacityReduction = (K_j_base, K_j_eff) => {
  if (K_j_base <= 0) return 0;
  return ((K_j_base - K_j_eff) / K_j_base) * 100;
};

/**
 * Calculate the absolute maximum PCU of parked vehicles allowed before reaching minimum usable width.
 */
export const calculateMaxPCU = (W_total) => {
  return Math.max(0, (W_total - MIN_W_EFF) / PCU_WIDTH_M);
};

/**
 * Calculate the exact PCU at which the current traffic density will cause total gridlock.
 */
export const calculateGridlockPCU = (W_total, K) => {
  return Math.max(0, (W_total - (K / K_J_PER_METER)) / PCU_WIDTH_M);
};

/**
 * Calculate speed loss attribution breakdown.
 */
export const calculateSpeedLossAttribution = (K, K_j_base, K_j_eff, V) => {
  const V_no_parking = calculatePredictedSpeed(K, K_j_base);
  
  let densityLoss = 0;
  let parkingLoss = 0;

  if (K >= K_j_base) {
    // Density alone is enough to cause gridlock
    densityLoss = V_F;
    parkingLoss = 0;
  } else if (K >= K_j_eff) {
    // Density was fine, but parking reduced capacity enough to cause gridlock
    densityLoss = V_F - V_no_parking;
    parkingLoss = V_no_parking; // Drops the remaining speed to 0
  } else {
    // Flowing, but slower
    densityLoss = V_F - V_no_parking;
    parkingLoss = V_no_parking - V;
  }

  return {
    vFreeFlow: V_F,
    vNoParking: V_no_parking,
    vActual: V,
    densityLoss,
    parkingLoss,
    totalLoss: densityLoss + parkingLoss
  };
};

/**
 * Orchestrator function to calculate all metrics given the core inputs.
 */
export const runSimulation = (W_total, PCU_parked, K) => {
  const W_eff = calculateEffectiveWidth(W_total, PCU_parked);
  const K_j_base = calculateBaselineJamDensity(W_total);
  const K_j_eff = calculateEffectiveJamDensity(W_eff);
  const V = calculatePredictedSpeed(K, K_j_eff);
  const capacityLostPercent = calculateCapacityReduction(K_j_base, K_j_eff);
  const maxPCU = calculateMaxPCU(W_total);
  const gridlockPCU = calculateGridlockPCU(W_total, K);
  const attribution = calculateSpeedLossAttribution(K, K_j_base, K_j_eff, V);

  const isGridlocked = K >= K_j_eff;

  return {
    W_eff,
    K_j_base,
    K_j_eff,
    V,
    capacityLostPercent,
    maxPCU,
    gridlockPCU,
    attribution,
    isGridlocked
  };
};
