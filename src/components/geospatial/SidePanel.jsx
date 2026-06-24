import React, { useMemo } from 'react';
import { useGeospatialStore } from '../../store/useGeospatialStore';
import HourlyFingerprint from './HourlyFingerprint';
import { Building2, MapPin, Fingerprint, ShieldAlert, Car, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString();
}

function Top10Mode({ onCenterSelect }) {
  const top10 = useGeospatialStore((state) => state.data.top10);
  
  if (!top10 || !top10.code || top10.code.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No centers match the current filters.</div>;
  }

  // To draw magnitude bar, we need the max count
  const maxCount = Math.max(...Array.from(top10.count).map(Number));

  const rows = [];
  for (let i = 0; i < top10.code.length; i++) {
    const code = top10.code[i];
    const name = top10.name[i];
    const count = Number(top10.count[i]);
    const fp = top10.hourly_fingerprint[i]; // an array of 24 ints

    rows.push(
      <button 
        key={code}
        onClick={() => onCenterSelect({ code, name })}
        className="w-full flex flex-col text-left py-3 px-4 border-b hover:bg-muted/50 transition-colors group relative"
      >
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {i + 1}
            </div>
            <span className="font-bold text-sm truncate">{name}</span>
          </div>
          <span className="font-bold text-lg leading-none">{formatNumber(count)}</span>
        </div>
        
        <div className="h-1 bg-muted rounded-full mb-2 overflow-hidden ml-7 w-[calc(100%-1.75rem)]">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.max(2, (count / maxCount) * 100)}%` }}
          />
        </div>
        
        <div className="ml-7 w-[calc(100%-1.75rem)]">
          <HourlyFingerprint counts={fp} />
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CrosshairIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-4 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">Top 10 Hotspot Centres</h2>
        </div>
        <p className="text-xs text-muted-foreground">Click a row to zoom and drill down.</p>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {rows}
      </div>
    </div>
  );
}

function CrosshairIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>
    </svg>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="border rounded-md p-3 flex flex-col gap-1 bg-background">
      <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function DrillDownMode({ onClearCenter, onCenterSelect }) {
  const navigate = useNavigate();
  const filters = useGeospatialStore((state) => state.filters);
  const mappings = useGeospatialStore((state) => state.data.mappings);
  const { drillDownStats, twins, topOffences, vehicleMix, hourlyProfile } = useGeospatialStore((state) => state.data);

  const centerName = useMemo(() => {
    return mappings.centers.find(c => c.code === filters.centerCode)?.name || 'Unknown Centre';
  }, [filters.centerCode, mappings.centers]);

  if (!drillDownStats || !drillDownStats.total_violations || drillDownStats.total_violations.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground">Loading drill-down data...</span>
      </div>
    );
  }

  // Stats
  const total = Number(drillDownStats.total_violations[0]);
  const stationsCount = drillDownStats.police_stations_count[0];
  const peakHour = String(drillDownStats.peak_hour[0]).padStart(2, '0') + ':00';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakDay = days[drillDownStats.peak_day[0]];
  const leadStation = drillDownStats.lead_station_name[0];
  
  // Entropy & Predictability
  const entropy = drillDownStats.predictability_entropy[0] || 0;
  const maxEntropy = 4.58496; // log2(24)
  const predictabilityScore = Math.max(0, Math.min(100, Math.round((1 - (entropy / maxEntropy)) * 100)));
  
  let predVerdict = "Distributed — needs continuous presence.";
  if (predictabilityScore >= 75) predVerdict = "Concentrated — single-shift patrol fits.";
  else if (predictabilityScore >= 50) predVerdict = "Moderately predictable — two shifts cover it.";

  // Profile array extraction
  let profileCounts = [];
  if (hourlyProfile && hourlyProfile.count) {
    profileCounts = Array.from(hourlyProfile.count).map(Number);
  }
  const maxProfileCount = profileCounts.length > 0 ? Math.max(...profileCounts, 1) : 1;

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 border-b bg-popover sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <h2 className="font-bold text-lg leading-tight truncate" title={`${filters.centerCode} - ${centerName}`}>
              {filters.centerCode} - {centerName}
            </h2>
          </div>
          <button 
            onClick={onClearCenter}
            className="text-xs font-semibold bg-background hover:bg-muted border border-border text-foreground px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
        <div className="mt-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">
            Hourly Fingerprint (0–23)
          </div>
          <HourlyFingerprint counts={profileCounts} className="h-3" />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Violations" value={formatNumber(total)} />
          <StatCard label="Police Stations" value={stationsCount} />
          <StatCard label="Peak Hour" value={peakHour} icon={Clock} />
          <StatCard label="Peak Day" value={peakDay} />
        </div>

        {/* Lead Station & Predictability */}
        <div className="grid grid-cols-1 gap-3">
          <div className="border rounded-md p-3 bg-background">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Lead Police Station</div>
            <div className="text-sm font-bold">{leadStation}</div>
          </div>
          
          <div className="border rounded-md p-3 bg-background">
            <div className="flex items-end justify-between mb-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Predictability Score</div>
              <div className="text-xl font-black text-primary leading-none">{predictabilityScore}/100</div>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${predictabilityScore}%` }}
              />
            </div>
            <div className="text-xs font-medium mb-1">{predVerdict}</div>
            <div className="text-[9px] text-muted-foreground">Shannon entropy of hourly distribution.</div>
          </div>
        </div>

        {/* Behavioural Twins */}
        {twins && twins.code && twins.code.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
              <Fingerprint className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Behavioural Twins</h3>
            </div>
            <div className="border rounded-md overflow-hidden bg-background divide-y">
              {Array.from(twins.code).map((code, idx) => {
                const twinName = twins.name[idx];
                const sim = twins.similarity[idx];
                const fp = twins.hourly_fingerprint[idx];
                return (
                  <button
                    key={code}
                    onClick={() => onCenterSelect({ code, name: twinName })}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 pr-4 min-w-0">
                      <div className="font-bold text-sm truncate mb-1">{twinName}</div>
                      <HourlyFingerprint counts={fp} />
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="text-lg font-bold text-primary leading-none">{sim.toFixed(2)}</div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase">Cosine</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">Centres with the most similar hourly profile. Click to visit.</div>
          </div>
        )}

        {/* Top Offences */}
        {topOffences && topOffences.code && topOffences.code.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Top Offences</h3>
            </div>
            <div className="flex flex-col gap-2">
              {Array.from(topOffences.code).map((code, idx) => (
                <div key={code} className="flex items-center gap-3 text-sm">
                  <div className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground w-10 text-center shrink-0">
                    {code}
                  </div>
                  <div className="font-medium truncate flex-1" title={topOffences.name[idx]}>
                    {topOffences.name[idx]}
                  </div>
                  <div className="font-mono font-medium text-right shrink-0">
                    {formatNumber(topOffences.count[idx])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Mix */}
        {vehicleMix && vehicleMix.type && vehicleMix.type.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
              <Car className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Vehicle Mix</h3>
            </div>
            <div className="flex flex-col gap-2">
              {Array.from(vehicleMix.type).map((type, idx) => {
                const count = Number(vehicleMix.count[idx]);
                const pct = (count / total) * 100;
                return (
                  <div key={type} className="flex items-center gap-3 text-sm">
                    <div className="font-medium w-32 shrink-0 truncate text-xs">{type}</div>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="font-mono text-xs text-right flex-1">
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hourly Bar Chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Hourly Profile</h3>
          </div>
          <div className="h-32 w-full flex items-end gap-0.5 pt-4">
            {profileCounts.map((count, hr) => {
              const hPct = (count / maxProfileCount) * 100;
              return (
                <div 
                  key={hr} 
                  className="flex-1 flex flex-col justify-end items-center h-full group relative"
                >
                  <div 
                    className="w-full bg-primary rounded-t-sm transition-all hover:bg-primary/80"
                    style={{ height: `${Math.max(2, hPct)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                    {String(hr).padStart(2, '0')}:00 – {formatNumber(count)}
                  </div>
                  {/* X-axis label every 3 hours */}
                  {(hr % 3 === 0) && (
                    <div className="absolute top-full mt-1 text-[9px] text-muted-foreground font-mono">
                      {hr}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-6" /> {/* spacer for axis labels */}
        </div>

        {/* Explore Further */}
        <div>
          <div className="h-px bg-border w-full mb-3" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Explore Further</h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => navigate(`/analytics/temporal?h=${drillDownStats.peak_hour[0]}-${drillDownStats.peak_hour[0]}&d=${drillDownStats.peak_day[0]}`)}
              className="flex items-center justify-between p-3 text-sm font-medium text-left bg-muted/30 hover:bg-muted/70 rounded-md transition-colors group"
            >
              <span>See this centre's peak in <strong className="text-foreground">Temporal Analysis</strong></span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button 
              onClick={() => navigate('/analytics/sandbox')}
              className="flex items-center justify-between p-3 text-sm font-medium text-left bg-muted/30 hover:bg-muted/70 rounded-md transition-colors group"
            >
              <span>Cross-tabulate offences in <strong className="text-foreground">Sandbox</strong></span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button 
              onClick={() => navigate('/analytics/executive')}
              className="flex items-center justify-between p-3 text-sm font-medium text-left bg-muted/30 hover:bg-muted/70 rounded-md transition-colors group"
            >
              <span>Open the <strong className="text-foreground">Executive Briefing</strong></span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SidePanel({ onCenterSelect, onClearCenter }) {
  const filters = useGeospatialStore((state) => state.filters);
  const isDrillDown = filters.centerCode !== 'all';

  return (
    <div className="w-full h-full bg-card border-l flex flex-col">
      {isDrillDown ? (
        <DrillDownMode onCenterSelect={onCenterSelect} onClearCenter={onClearCenter} />
      ) : (
        <Top10Mode onCenterSelect={onCenterSelect} />
      )}
    </div>
  );
}
