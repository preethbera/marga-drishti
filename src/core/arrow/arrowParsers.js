import { tableFromIPC } from 'apache-arrow';

export function parseArrowBuffer(buffer) {
  // If buffer is already a parsed object (from the worker), return it directly
  if (buffer && !(buffer instanceof ArrayBuffer) && !buffer.buffer && typeof buffer === 'object') {
    return buffer;
  }

  // Convert binary Arrow IPC buffer back to an apache-arrow Table
  const table = tableFromIPC(buffer);
  
  const result = {};
  
  const fields = table.schema.fields;
  console.log(`[Main] Parsed Arrow Table. Found ${fields.length} fields.`);
  
  fields.forEach(field => {
    const colName = field.name;
    const column = table.getChild(colName);
    
    if (column) {
      result[colName] = column.toArray();
    } else {
      console.warn(`[Main] Column ${colName} not found in Arrow table!`);
    }
  });
  
  return result;
}

export function parseArrowToTable(buffer) {
  // Returns the raw Apache Arrow Table without converting to JS objects
  return tableFromIPC(buffer);
}

export function extractCoordinates(buffer, geomColName = 'geometry') {
  if (buffer && !(buffer instanceof ArrayBuffer) && !buffer.buffer && typeof buffer === 'object') {
    if (!buffer[geomColName]) throw new Error(`Column ${geomColName} not found`);
    return buffer[geomColName];
  }

  const table = tableFromIPC(buffer);
  const geomColumn = table.getChild(geomColName);
  
  if (!geomColumn) {
    throw new Error(`Column ${geomColName} not found in Arrow buffer`);
  }
  
  return geomColumn.toArray();
}

export function extractFloat32Column(buffer, columnName) {
  let data;
  if (buffer && !(buffer instanceof ArrayBuffer) && !buffer.buffer && typeof buffer === 'object') {
    if (!buffer[columnName]) throw new Error(`Column ${columnName} not found`);
    data = buffer[columnName];
  } else {
    const table = tableFromIPC(buffer);
    const column = table.getChild(columnName);
    
    if (!column) {
      throw new Error(`Column ${columnName} not found in Arrow buffer`);
    }
    data = column.toArray();
  }
  
  // Ensure it's a flat Float32Array to feed directly to WebGL/DeckGL
  if (data instanceof Float32Array) {
    return data;
  }
  
  return new Float32Array(data);
}
