export const QUERIES = {
  // Basic aggregation on violations
  getViolationSummary: () => `
    SELECT 
      type, 
      count(*) as count, 
      sum(fine_amount) as total_fines 
    FROM violations 
    GROUP BY type
  `,
  
  // Spatial extraction for segments using ST_AsWKB
  getSegmentsWKB: (boundingBox) => {
    let condition = "";
    if (boundingBox) {
       condition = `WHERE ST_X(geom) >= ${boundingBox.minX} AND ST_X(geom) <= ${boundingBox.maxX} 
                    AND ST_Y(geom) >= ${boundingBox.minY} AND ST_Y(geom) <= ${boundingBox.maxY}`;
    }
    return `
      SELECT 
        id,
        ST_AsWKB(geom) as geometry,
        traffic_level
      FROM segments
      ${condition}
    `;
  },
  
  // Time-based aggregation for congestion
  getCongestionData: (startTime, endTime) => `
    SELECT 
      time_bin, 
      avg(speed) as avg_speed, 
      max(congestion_level) as max_congestion 
    FROM traffic_data 
    WHERE time_bin >= '${startTime}' AND time_bin <= '${endTime}'
    GROUP BY time_bin
    ORDER BY time_bin ASC
  `,

  // Get mappings for comboboxes
  getMappings: () => `
    SELECT 'center' as type, CAST(center_code AS VARCHAR) as code, police_station as name FROM dim_center_code
    UNION ALL
    SELECT 'offence' as type, CAST(offence_code AS VARCHAR) as code, violation_type as name FROM dim_offence_code
  `,

  // Aggregate violations by center
  getCenterAggregations: (filters) => {
    let conditions = ["v.center_code != 91"]; // Exclude unresolved centers by default
    
    if (filters?.offenceCode && filters.offenceCode !== 'all') {
      conditions.push(`list_contains(v.offence_code, ${filters.offenceCode})`);
    }
    if (filters?.vehicleType && filters.vehicleType !== 'all') {
      conditions.push(`v.vehicle_type = '${filters.vehicleType}'`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";
    
    return `
      SELECT 
        v.center_code as code, 
        c.police_station as name,
        COUNT(*) as count, 
        AVG(v.latitude) as latitude, 
        AVG(v.longitude) as longitude
      FROM violations v
      LEFT JOIN dim_center_code c ON CAST(v.center_code AS VARCHAR) = CAST(c.center_code AS VARCHAR)
      ${whereClause}
      GROUP BY v.center_code, c.police_station
    `;
  },

  // Get detailed individual violations for heatmap
  getDetailedViolations: (filters) => {
    let conditions = [];
    
    if (filters?.centerCode && filters.centerCode !== 'all') {
      conditions.push(`v.center_code = ${filters.centerCode}`);
    }
    if (filters?.offenceCode && filters.offenceCode !== 'all') {
      conditions.push(`list_contains(v.offence_code, ${filters.offenceCode})`);
    }
    if (filters?.vehicleType && filters.vehicleType !== 'all') {
      conditions.push(`v.vehicle_type = '${filters.vehicleType}'`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";
    
    return `
      SELECT 
        v.latitude, 
        v.longitude, 
        v.vehicle_type,
        v.offence_code
      FROM violations v
      ${whereClause}
    `;
  },

  // Executive Summary Queries
  getExecutiveDateRange: () => `
    SELECT 
      CAST(MIN(created_datetime) AS VARCHAR) as min_date,
      CAST(MAX(created_datetime) AS VARCHAR) as max_date
    FROM violations
  `,

  getExecutiveSummaryStats: (start, end) => {
    return `
      WITH current_period AS (
        SELECT * FROM violations 
        WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'
      ),
      top_offence AS (
        SELECT code, count(*) as count 
        FROM (
          SELECT UNNEST(offence_code) as code FROM current_period
        )
        GROUP BY code 
        ORDER BY count DESC 
        LIMIT 1
      ),
      top_station AS (
        SELECT center_code, count(*) as count 
        FROM current_period 
        WHERE center_code != 91
        GROUP BY center_code 
        ORDER BY count DESC 
        LIMIT 1
      ),
      peak_hour AS (
        SELECT extract('hour' from created_datetime) as hour_val, count(*) as count 
        FROM current_period 
        GROUP BY hour_val 
        ORDER BY count DESC 
        LIMIT 1
      ),
      peak_day AS (
        SELECT extract('dow' from created_datetime) as dow, count(*) as count 
        FROM current_period 
        GROUP BY dow 
        ORDER BY count DESC 
        LIMIT 1
      )
      SELECT 
        (SELECT count(*) FROM current_period) as total_violations,
        CAST((SELECT code FROM top_offence) AS VARCHAR) as top_offence_code,
        (SELECT count FROM top_offence) as top_offence_count,
        CAST((SELECT center_code FROM top_station) AS VARCHAR) as top_station_code,
        (SELECT count FROM top_station) as top_station_count,
        (SELECT hour_val FROM peak_hour) as peak_hour,
        (SELECT dow FROM peak_day) as peak_day
    `;
  },
  
  getDailyVolumeTrend: (start, end) => `
    SELECT 
      CAST(date_trunc('day', created_datetime) AS VARCHAR) as date,
      count(*) as count
    FROM violations
    WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'
    GROUP BY date
    ORDER BY date ASC
  `,

  getTopOffencesList: (start, end) => `
    SELECT 
      CAST(code AS VARCHAR) as code, 
      count(*) as count
    FROM (
      SELECT UNNEST(offence_code) as code 
      FROM violations 
      WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'
    )
    GROUP BY code
    ORDER BY count DESC
    LIMIT 5
  `,

  getTopStationsList: (start, end) => `
    SELECT 
      CAST(center_code AS VARCHAR) as code, 
      count(*) as count
    FROM violations
    WHERE created_datetime >= '${start}' AND created_datetime <= '${end}' AND center_code != 91
    GROUP BY center_code
    ORDER BY count DESC
    LIMIT 5
  `,

  getVehicleMix: (start, end) => `
    SELECT 
      vehicle_type as type,
      count(*) as count
    FROM violations
    WHERE created_datetime >= '${start}' AND created_datetime <= '${end}' AND vehicle_type IS NOT NULL
    GROUP BY vehicle_type
    ORDER BY count DESC
  `
};
