import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

export function MetricCard({ label, value, unit, subtext, color = 'default', children }) {
  const [displayValue, setDisplayValue] = useState(value);

  // Subtle CSS transition approach: we update the value. For number counting, we can do a simple interval if it's a number.
  // Given "no heavy animation libraries", we'll just do a fast interval increment if the difference is noticeable.
  useEffect(() => {
    if (typeof value !== 'number' && typeof value !== 'string') {
      setDisplayValue(value);
      return;
    }
    
    // We can rely on a simple CSS transition for color changes, but for text it's instant.
    // The prompt says "CSS transition on the value's text, or a subtle number-counting animation".
    // Let's implement a very lightweight number counting.
    if (typeof value === 'number') {
      let startValue = typeof displayValue === 'number' ? displayValue : 0;
      if (startValue === value) return;
      
      let duration = 300; // ms
      let startTime = null;
      
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = startValue + (value - startValue) * progress;
        setDisplayValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const colorClasses = {
    default: 'text-foreground',
    green: 'text-green-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  };

  const valColorClass = colorClasses[color] || colorClasses.default;

  return (
    <Card className="flex flex-col justify-between h-full relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {children ? (
          children
        ) : (
          <>
            <div className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${valColorClass}`}>
              {typeof displayValue === 'number' ? displayValue.toFixed(1) : displayValue}
              {unit && <span className="text-lg font-normal ml-1 text-muted-foreground">{unit}</span>}
            </div>
            {subtext && <p className="text-sm text-muted-foreground mt-1">{subtext}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
