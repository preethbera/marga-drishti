import { useSimulationStore } from '@core/store/useSimulationStore';
import { useSimulationDerived } from './useSimulationHooks';

export function useControlPanelData() {
  const { W_total, PCU_parked, K, setWTotal, setPCUParked, setK } = useSimulationStore();
  const derived = useSimulationDerived(W_total, PCU_parked, K);
  
  const handleWTotalChange = (val) => setWTotal(Array.isArray(val) ? val[0] : val);
  const handlePCUChange = (val) => setPCUParked(Array.isArray(val) ? val[0] : val);
  const handleKChange = (val) => setK(Array.isArray(val) ? val[0] : val);

  const handleInputBlur = (e, setter) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setter(val);
  };

  const handleKeyDown = (e, setter) => {
    if (e.key === 'Enter') {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) setter(val);
    }
  };

  let speedColor = 'green';
  if (derived.V < 20) speedColor = 'red';
  else if (derived.V <= 40) speedColor = 'amber';

  let widthColor = 'green';
  if (derived.W_eff < 3.6) widthColor = 'red';
  else if (derived.W_eff <= 7.0) widthColor = 'amber';

  let capacityColor = 'green';
  if (derived.capacityReduction > 50) capacityColor = 'red';
  else if (derived.capacityReduction >= 20) capacityColor = 'amber';

  return {
    W_total, PCU_parked, K, setWTotal, setPCUParked, setK,
    derived,
    handleWTotalChange, handlePCUChange, handleKChange,
    handleInputBlur, handleKeyDown,
    speedColor, widthColor, capacityColor
  };
}
