import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNetworkStore } from '../useNetworkStore';
import { useNetworkAggregate, useRankedSegments } from '../useNetworkHooks';
import { interpolateColor } from '../networkConfig';

export function RankedSegmentsTable() {
  const { data, status } = useNetworkAggregate();
  const { 
    sortColumn, 
    sortDirection, 
    setSort, 
    selectedSegmentId, 
    selectSegment,
    cascadeOriginSegmentId
  } = useNetworkStore();

  const sortedData = useRankedSegments(data, sortColumn, sortDirection);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  if (status === 'error' || (status === 'empty' && data.length === 0)) {
    return null; // Handled by page level or KPI strip
  }

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentRows = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />;
  };

  const headers = [
    { key: 'segment_id', label: 'Segment ID' },
    { key: 'road_class', label: 'Road Class' },
    { key: 'length_m', label: 'Length (m)' },
    { key: 'W_total', label: 'Width (m)' },
    { key: 'W_eff', label: 'Effective (m)' },
    { key: 'PCU_parked', label: 'PCU Blocked' },
    { key: 'violationCount', label: 'Violations' },
    { key: 'capacityReduction', label: 'Capacity Loss (%)' }
  ];

  const handleHeaderClick = (key) => {
    setSort(key);
    setCurrentPage(1); // Reset to first page on sort
  };

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Network Segment Details</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{sortedData.length} total segments</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted text-muted-foreground border-b border-border">
            <tr>
              {headers.map(h => (
                <th 
                  key={h.key} 
                  className={`px-4 py-3 cursor-pointer hover:bg-muted/80 transition-colors ${['length_m', 'W_total', 'W_eff', 'PCU_parked', 'violationCount', 'capacityReduction'].includes(h.key) ? 'text-right' : ''}`}
                  onClick={() => handleHeaderClick(h.key)}
                >
                  {h.label} <SortIcon column={h.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentRows.map(row => {
              const isSelected = row.segment_id === selectedSegmentId;
              const isOrigin = row.segment_id === cascadeOriginSegmentId;
              const lossColor = `rgb(${interpolateColor(row.capacityReduction).join(',')})`;
              
              return (
                <tr 
                  key={row.segment_id} 
                  className={`hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : isOrigin ? 'bg-purple-500/10' : ''}`}
                  onClick={() => selectSegment(row.segment_id)}
                >
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    {row.segment_id}
                    {isOrigin && <Badge variant="outline" className="text-purple-500 border-purple-500 text-[10px] px-1 py-0 h-4">Cascade Origin</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.road_class}</td>
                  <td className="px-4 py-3 text-right">{row.length_m.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">{row.W_total.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right">{row.W_eff.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right">{row.PCU_parked.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.violationCount}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: lossColor }}>
                    {row.capacityReduction.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
      {totalPages > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
