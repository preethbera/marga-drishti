import React from 'react';

const formatNumber = (val) => {
  if (val === null || val === undefined || val === 0 || Number.isNaN(val)) return '-';
  // Use 'en-IN' formatting if expected (commas at thousands, lakhs) or fallback to default
  return new Intl.NumberFormat('en-IN').format(val); 
};

export default function PivotTableCanvas({ data, yAxisLabel }) {
  if (!data || data.numRows === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card rounded-lg border shadow-sm min-h-[400px]">
        No data available for the selected dimensions.
      </div>
    );
  }

  // Extract columns from Arrow schema
  const columns = data.schema.fields.map(f => f.name);
  // 'y_val' is the pivot row group, 'Total' is the row total we added
  const dataColumns = columns.filter(c => c !== 'y_val' && c !== 'Total');

  // Create an array of row indices
  const rows = Array.from({ length: data.numRows }, (_, i) => i);

  return (
    <div className="w-full h-full bg-card rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <div className="overflow-auto w-full max-h-[800px] custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-sm text-muted-foreground shadow-sm">
            <tr>
              {/* Top Left Header */}
              <th className="sticky left-0 z-30 bg-muted/95 p-4 font-bold border-b border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap">
                {yAxisLabel}
              </th>
              
              {/* Dynamic X-Axis Headers */}
              {dataColumns.map((colName) => (
                <th key={colName} className="p-4 font-medium border-b border-r text-center whitespace-nowrap min-w-[120px]">
                  {colName}
                </th>
              ))}
              
              {/* Top Right Header (Total) */}
              <th className="p-4 font-bold border-b bg-primary/10 text-primary text-center whitespace-nowrap min-w-[120px]">
                Total
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y">
            {rows.map((rowIndex) => {
              const yVal = data.getChild('y_val').get(rowIndex);
              const totalVal = data.getChild('Total').get(rowIndex);
              
              return (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Sticky Row Header */}
                  <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/30 p-4 font-semibold border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap transition-colors">
                    {yVal || 'Unknown'}
                  </td>
                  
                  {/* Data Cells */}
                  {dataColumns.map((colName) => {
                    const val = data.getChild(colName).get(rowIndex);
                    return (
                      <td key={colName} className="p-4 border-r text-center font-mono text-muted-foreground">
                        {formatNumber(val)}
                      </td>
                    );
                  })}
                  
                  {/* Row Total */}
                  <td className="p-4 bg-primary/5 text-primary font-bold text-center font-mono">
                    {formatNumber(totalVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
