import { tableFromIPC } from 'apache-arrow';

export function parseArrowBuffer(buffer) {
  // Convert binary Arrow IPC buffer back to an apache-arrow Table
  const table = tableFromIPC(buffer);
  
  const result = {};
  
  table.schema.fields.forEach(field => {
    const colName = field.name;
    const column = table.getChild(colName);
    
    if (column) {
      result[colName] = column.toArray();
    }
  });
  
  return result;
}

export function parseArrowToTable(buffer) {
  // Returns the raw Apache Arrow Table without converting to JS objects
  return tableFromIPC(buffer);
}

export function extractCoordinates(buffer, geomColName = 'geometry') {
  const table = tableFromIPC(buffer);
  const geomColumn = table.getChild(geomColName);
  
  if (!geomColumn) {
    throw new Error(`Column ${geomColName} not found in Arrow buffer`);
  }
  
  return geomColumn.toArray();
}

export function extractFloat32Column(buffer, columnName) {
  const table = tableFromIPC(buffer);
  const column = table.getChild(columnName);
  
  if (!column) {
    throw new Error(`Column ${columnName} not found in Arrow buffer`);
  }
  
  const data = column.toArray();
  
  // Ensure it's a flat Float32Array to feed directly to WebGL/DeckGL
  if (data instanceof Float32Array) {
    return data;
  }
  
  return new Float32Array(data);
}
