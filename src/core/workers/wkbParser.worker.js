// Web worker for parsing WKB to GeoJSON without blocking the main thread

function parseWKB(wkbBuffer) {
  if (!wkbBuffer || wkbBuffer.length < 9) return null;
  const view = new DataView(wkbBuffer.buffer, wkbBuffer.byteOffset, wkbBuffer.byteLength);
  const isLittle = view.getUint8(0) === 1;
  const numPoints = view.getUint32(5, isLittle);
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    const x = view.getFloat64(9 + i * 16, isLittle);
    const y = view.getFloat64(9 + i * 16 + 8, isLittle);
    coordinates.push([x, y]);
  }
  return {
    type: 'LineString',
    coordinates
  };
}

self.onmessage = function(e) {
  const segments = e.data;
  
  const parsedSegments = segments.map(seg => {
    // Attempt to parse WKB, fallback to original if not a Uint8Array or invalid
    const geometry = (seg.geometry && seg.geometry instanceof Uint8Array) 
      ? parseWKB(seg.geometry) 
      : (typeof seg.geometry === 'string' ? JSON.parse(seg.geometry) : seg.geometry);
      
    return {
      ...seg,
      geometry
    };
  });
  
  self.postMessage(parsedSegments);
};
