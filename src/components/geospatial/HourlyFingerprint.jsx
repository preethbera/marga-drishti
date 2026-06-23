import React, { useMemo } from 'react';

export default function HourlyFingerprint({ counts = [], className = '' }) {
  const { max, normalized } = useMemo(() => {
    // Default to an array of 24 zeros if no data
    const safeCounts = Array.isArray(counts) && counts.length === 24 
      ? counts 
      : new Array(24).fill(0);
      
    const maxVal = Math.max(...safeCounts, 1); // Avoid division by zero
    
    const norms = safeCounts.map(count => count / maxVal);
    return { max: maxVal, normalized: norms };
  }, [counts]);

  return (
    <div 
      className={`flex h-2.5 w-full bg-muted/30 rounded overflow-hidden ${className}`}
      title="Hourly distribution (00:00 - 23:00)"
    >
      {normalized.map((intensity, hour) => {
        // We use map-purple as the base, varying opacity based on intensity.
        // A minimum opacity of 0.05 for empty cells so the grid is slightly visible.
        const opacity = Math.max(0.05, intensity);
        
        return (
          <div 
            key={hour}
            className="flex-1 h-full border-r border-background/50 last:border-r-0"
            style={{ 
              backgroundColor: 'var(--map-purple)',
              opacity: opacity
            }}
            title={`${hour}:00 - ${counts[hour] || 0} violations`}
          />
        );
      })}
    </div>
  );
}
