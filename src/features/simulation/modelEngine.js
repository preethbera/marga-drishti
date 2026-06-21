export const MODEL_CONSTANTS = {
  V_F: 67, // km/h — empirical free-flow speed
  V_O: 33.5, // km/h — optimum speed (V_F / 2)
  K_J_PER_METER: 10.86, // veh/km per metre of road width
  PCU_WIDTH_M: 3.0, // metres of road space consumed per 1 PCU parked
  MIN_W_EFF: 1.0, // metres — absolute minimum effective width (model floor)
  W_BASE: 7.2, // metres — reference road width used in calibration
  K_J_BASE_REF: 78.24, // veh/km — calibrated jam density at W_BASE
  DEFAULT_K: 20, // veh/km — default traffic density for initialisation
  DEFAULT_W_TOTAL: 7.2, // metres — default road width
  DEFAULT_PCU: 0, // PCU — default parked blockage (no violations)
  K_MIN: 1, // veh/km — minimum allowed K (avoids ln(0))
  K_MAX: 150, // veh/km — slider ceiling
  W_MIN: 3.0, // metres — minimum sensible road width
  W_MAX: 20.0, // metres — slider ceiling
  CURVE_DENSITY_POINTS: 200, // number of data points per curve
  SENSITIVITY_POINTS: 200, // number of data points for sensitivity sweep
};

export const PCU_EQUIVALENTS = {
  CAR: 1.0,
  SCOOTER: 0.5,
  MOTORCYCLE: 0.5,
  TWO_WHEELER: 0.5,
  AUTO: 0.6,
  AUTO_RICKSHAW: 0.6,
  BUS: 3.0,
  TANKER: 3.0,
  TRUCK: 3.0,
  HGV: 3.0,
  LCV: 1.5,
  VAN: 1.5,
  DEFAULT: 1.0, // fallback for any unrecognised vehicle type
};

export function getPCU(vehicleType) {
  if (!vehicleType) return PCU_EQUIVALENTS.DEFAULT;
  const upperType = vehicleType.toUpperCase();
  return PCU_EQUIVALENTS[upperType] !== undefined
    ? PCU_EQUIVALENTS[upperType]
    : PCU_EQUIVALENTS.DEFAULT;
}

export function computeWeff(W_total, PCU_parked) {
  const blocked = PCU_parked * MODEL_CONSTANTS.PCU_WIDTH_M;
  const W_eff = W_total - blocked;
  return Math.max(W_eff, MODEL_CONSTANTS.MIN_W_EFF);
}

export function computeKjBase(W_total) {
  return W_total * MODEL_CONSTANTS.K_J_PER_METER;
}

export function computeKjEff(W_eff) {
  return W_eff * MODEL_CONSTANTS.K_J_PER_METER;
}

export function computeV(K, K_j_eff) {
  if (K <= 0) return MODEL_CONSTANTS.V_F; // free-flow; treat near-zero density as free-flow
  if (K >= K_j_eff) return 0; // gridlocked
  return MODEL_CONSTANTS.V_O * Math.log(K_j_eff / K);
}

export function computeCapacityReduction(K_j_base, K_j_eff) {
  if (K_j_base <= 0) return 100;
  return ((K_j_base - K_j_eff) / K_j_base) * 100;
}

export function computeMaxPCU(W_total) {
  // Maximum PCU before W_eff would breach MIN_W_EFF
  return (W_total - MODEL_CONSTANTS.MIN_W_EFF) / MODEL_CONSTANTS.PCU_WIDTH_M;
}

export function computeGridlockPCU(W_total, K) {
  // The PCU_parked value at which K_j_eff drops to exactly K (gridlock onset)
  const W_eff_at_gridlock = K / MODEL_CONSTANTS.K_J_PER_METER;
  const pcu = (W_total - W_eff_at_gridlock) / MODEL_CONSTANTS.PCU_WIDTH_M;
  if (pcu < 0) return 0; // gridlock occurs even at PCU=0
  const maxPcu = computeMaxPCU(W_total);
  if (pcu > maxPcu) return Infinity; // gridlock is impossible
  return pcu;
}

export function computeSpeedLossAttribution(W_total, PCU_parked, K) {
  const W_eff = computeWeff(W_total, PCU_parked);
  const K_j_base = computeKjBase(W_total);
  const K_j_eff = computeKjEff(W_eff);
  
  let V_actual = computeV(K, K_j_eff);
  let V_no_parking = computeV(K, K_j_base);

  // Edges handling (gridlock logic from prompt)
  let densityLoss, parkingLoss;
  
  if (K >= K_j_base) {
    // gridlock even without parking
    V_no_parking = 0;
    V_actual = 0;
    densityLoss = MODEL_CONSTANTS.V_F;
    parkingLoss = 0;
  } else if (K < K_j_base && K >= K_j_eff) {
    // parking causes gridlock
    V_actual = 0;
    densityLoss = MODEL_CONSTANTS.V_F - V_no_parking;
    parkingLoss = V_no_parking;
  } else {
    densityLoss = MODEL_CONSTANTS.V_F - V_no_parking;
    parkingLoss = V_no_parking - V_actual;
  }

  const totalLoss = MODEL_CONSTANTS.V_F - V_actual;

  return {
    V_F: MODEL_CONSTANTS.V_F,
    V_no_parking,
    V_actual,
    densityLoss,
    parkingLoss,
    totalLoss,
    K_j_base,
    K_j_eff,
  };
}

export function generateSpeedDensityCurve(W_total, PCU_parked, numPoints) {
  const W_eff = computeWeff(W_total, PCU_parked);
  const K_j_eff = computeKjEff(W_eff);

  if (K_j_eff <= MODEL_CONSTANTS.K_MIN) {
    return [{ K: MODEL_CONSTANTS.K_MIN, V: 0 }];
  }

  const points = [];
  const K_step = (K_j_eff - MODEL_CONSTANTS.K_MIN) / (numPoints - 1);

  for (let i = 0; i < numPoints - 1; i++) {
    const K_val = MODEL_CONSTANTS.K_MIN + i * K_step;
    points.push({ K: K_val, V: computeV(K_val, K_j_eff) });
  }
  // Terminal point
  points.push({ K: K_j_eff, V: 0 });

  return points;
}

export function generateSensitivityCurve(W_total, K_ref, numPoints) {
  const maxPCU = computeMaxPCU(W_total);
  const gridlockPCU = computeGridlockPCU(W_total, K_ref);

  if (gridlockPCU <= 0) {
    return [{ PCU: 0, V: 0 }];
  }

  const effectiveMax = Math.min(maxPCU, Math.max(gridlockPCU, 0));
  const PCU_step = effectiveMax / (numPoints - 1);
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const PCU_i = i * PCU_step;
    const W_eff = computeWeff(W_total, PCU_i);
    const K_j_eff = computeKjEff(W_eff);
    const V_i = computeV(K_ref, K_j_eff);
    points.push({ PCU: PCU_i, V: V_i });
  }

  // Ensure exact boundary point is included
  if (!points.some((p) => Math.abs(p.PCU - gridlockPCU) < 0.001)) {
    points.push({ PCU: gridlockPCU, V: 0 });
  }

  // Filter out any negative V values (caused by floating point imprecision around boundary)
  return points.filter((p) => p.V >= -0.01).map(p => ({ ...p, V: Math.max(0, p.V) }));
}
