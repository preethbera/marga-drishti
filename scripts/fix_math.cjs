const fs = require('fs');
const files = [
  'src/components/network/SegmentInspector.jsx',
  'src/components/simulation/ControlPanel.jsx',
  'src/components/simulation/DensitySpeedCurve.jsx',
  'src/components/simulation/GridlockGauge.jsx',
  'src/components/simulation/RoadCrossSection.jsx',
  'src/components/simulation/SensitivitySweep.jsx',
  'src/components/simulation/SpeedLossAttribution.jsx',
  'src/pages/docs/AggregationMethodology.jsx',
  'src/pages/docs/SimulationModel.jsx'
];
for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import\s+\{\s*(BlockMath,\s*InlineMath|InlineMath,\s*BlockMath|InlineMath|BlockMath)\s*\}\s+from\s+["']react-katex["'];?/g, 
      'import { BlockMath, InlineMath } from "@/components/ui/math";');
    c = c.replace(/import\s+["']katex\/dist\/katex\.min\.css["'];?\n?/g, '');
    fs.writeFileSync(f, c, 'utf8');
    console.log('Processed', f);
  }
}
