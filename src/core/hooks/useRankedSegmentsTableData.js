import { useState } from 'react';
import { useNetworkAggregate, useRankedSegments } from './useNetworkHooks';
import { useNetworkStore } from '@core/store/useNetworkStore';

export function useRankedSegmentsTableData() {
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

  const isHidden = status === 'error' || (status === 'empty' && (!data || data.length === 0));

  const totalPages = Math.ceil((sortedData?.length || 0) / rowsPerPage);
  const currentRows = sortedData?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || [];

  const handleHeaderClick = (key) => {
    setSort(key);
    setCurrentPage(1);
  };

  return {
    isHidden,
    currentRows,
    currentPage,
    totalPages,
    totalSegments: sortedData?.length || 0,
    setCurrentPage,
    sortColumn,
    sortDirection,
    handleHeaderClick,
    selectedSegmentId,
    selectSegment,
    cascadeOriginSegmentId
  };
}
