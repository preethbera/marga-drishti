import React, { useState, useMemo } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const getDisplayClass = (rc) => {
  if (rc === 'arterial') return 'Arterial';
  if (rc === 'sub_arterial') return 'Sub-Arterial';
  if (rc === 'collector') return 'Collector';
  return 'Local';
};

export default function RankedSegmentsTable() {
  const { processedSegments, selectedSegmentId, setSelectedSegment } = useNetworkStore();
  const [sortConfig, setSortConfig] = useState({ key: 'capacityLoss', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...processedSegments];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [processedSegments, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp className="w-3 h-3 ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 ml-1 inline text-primary" /> 
      : <ChevronDown className="w-3 h-3 ml-1 inline text-primary" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Ranked Segment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('id')}>
                  Segment ID <SortIcon columnKey="id" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('road_class')}>
                  Class <SortIcon columnKey="road_class" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('length')}>
                  Length (m) <SortIcon columnKey="length" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('width')}>
                  Width (m) <SortIcon columnKey="width" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('w_eff')}>
                  W_eff (m) <SortIcon columnKey="w_eff" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('concurrentPCU')}>
                  Avg PCU Blocked <SortIcon columnKey="concurrentPCU" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('violationCount')}>
                  Total Violations <SortIcon columnKey="violationCount" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-right font-bold" onClick={() => handleSort('capacityLoss')}>
                  Capacity Loss (%) <SortIcon columnKey="capacityLoss" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No segments found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={`cursor-pointer transition-colors ${selectedSegmentId === row.id ? 'bg-primary/10 hover:bg-primary/15' : ''}`}
                    onClick={() => setSelectedSegment(row.id)}
                  >
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-2 py-1 rounded">{getDisplayClass(row.road_class)}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.length.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.width.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-medium">{row.w_eff.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{row.concurrentPCU.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.violationCount}</TableCell>
                    <TableCell className={`text-right font-bold ${
                      row.capacityLoss >= 50 ? 'text-destructive' : 
                      row.capacityLoss >= 20 ? 'text-chart-4' : 
                      'text-chart-2'
                    }`}>
                      {row.capacityLoss.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="text-sm font-medium px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
