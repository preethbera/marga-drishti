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
  `,

  // Helper for temporal conditions
  _buildTemporalConditions: (filters) => {
    let conditions = [];
    if (filters?.timeRange) {
      conditions.push(`extract('hour' from created_datetime) >= ${filters.timeRange[0]} AND extract('hour' from created_datetime) <= ${filters.timeRange[1]}`);
    }
    if (filters?.dayOfWeek && filters.dayOfWeek !== 'all') {
      const dowMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      if (dowMap[filters.dayOfWeek] !== undefined) {
         conditions.push(`extract('dow' from created_datetime) = ${dowMap[filters.dayOfWeek]}`);
      }
    }
    if (filters?.dateRange?.from) {
      // Use YYYY-MM-DD formatting for duckdb
      const fromStr = filters.dateRange.from.toISOString().split('T')[0];
      conditions.push(`created_datetime >= '${fromStr} 00:00:00'`);
      if (filters.dateRange.to) {
        const toStr = filters.dateRange.to.toISOString().split('T')[0];
        conditions.push(`created_datetime <= '${toStr} 23:59:59'`);
      } else {
        conditions.push(`created_datetime <= '${fromStr} 23:59:59'`);
      }
    }
    return conditions;
  },

  getTemporalKPIs: (filters) => {
    const conditions = QUERIES._buildTemporalConditions(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return `
      WITH current_window AS (
        SELECT * FROM violations 
        ${whereClause}
      ),
      total_violations AS (
        SELECT count(*) as count FROM violations
      ),
      top_station AS (
        SELECT center_code, count(*) as count 
        FROM current_window 
        WHERE center_code != 91
        GROUP BY center_code 
        ORDER BY count DESC 
        LIMIT 1
      ),
      peak_slot AS (
        SELECT extract('dow' from created_datetime) as dow, extract('hour' from created_datetime) as hour_val, count(*) as count
        FROM current_window
        GROUP BY dow, hour_val
        ORDER BY count DESC
        LIMIT 1
      )
      SELECT 
        (SELECT count(*) FROM current_window) as violations_in_window,
        (SELECT count FROM total_violations) as total_violations,
        CAST((SELECT center_code FROM top_station) AS VARCHAR) as top_station_code,
        (SELECT count FROM top_station) as top_station_count,
        (SELECT dow FROM peak_slot) as peak_dow,
        (SELECT hour_val FROM peak_slot) as peak_hour
    `;
  },
  
  getTemporalViolations: (filters) => {
    const conditions = QUERIES._buildTemporalConditions(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return `
      SELECT 
        latitude, 
        longitude, 
        vehicle_type,
        extract('hour' from created_datetime) as hour_val
      FROM violations
      ${whereClause}
    `;
  },
  
  getTemporalVehicleMix: (filters) => {
    const conditions = QUERIES._buildTemporalConditions(filters);
    conditions.push("vehicle_type IS NOT NULL");
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    return `
      SELECT 
        vehicle_type as type,
        count(*) as count
      FROM violations
      ${whereClause}
      GROUP BY vehicle_type
      ORDER BY count DESC
    `;
  },
  
  getWeeklyHeatmap: () => `
    WITH stats AS (
      SELECT 
        extract('dow' from created_datetime) as dow,
        extract('hour' from created_datetime) as hour_val,
        count(*) as count
      FROM violations
      GROUP BY dow, hour_val
    ),
    global_stats AS (
      SELECT avg(count) as mean, stddev(count) as std
      FROM stats
    )
    SELECT 
      s.dow, 
      s.hour_val, 
      s.count,
      g.mean,
      g.std
    FROM stats s
    CROSS JOIN global_stats g
    ORDER BY s.dow ASC, s.hour_val ASC
  `,

  // --- Simulation Studio Queries ---
  
  getSimulationSegments: () => `
    SELECT 
      CAST(segment_id AS VARCHAR) as code,
      CAST(segment_id AS VARCHAR) as name,
      width_m as width,
      lanes,
      0 as traffic_level,
      road_class
    FROM segments
    ORDER BY segment_id ASC
  `,

  getSegmentParkingViolations: (segmentId) => `
    SELECT 
      SUM(p.pcu_value) as total_pcu
    FROM violations v
    LEFT JOIN dim_vehicle_type_to_pcu_value p ON v.vehicle_type = p.vehicle_type
      WHERE CAST(v.segment_id AS VARCHAR) = '${segmentId}'
        AND v.offence_code != [] 
  `,

  // --- Network Intelligence Queries ---
  
  getNetworkIntelligenceData: (filters) => {
    let dateCondition = "";
    if (filters?.startDate && filters?.endDate) {
      dateCondition = `AND v.created_datetime >= '${filters.startDate}' AND v.created_datetime <= '${filters.endDate}'`;
    }

    return `
      WITH segment_violations AS (
        SELECT 
          CAST(v.segment_id AS VARCHAR) as segment_id,
          SUM(p.pcu_value) as total_pcu,
          COUNT(*) as violation_count
        FROM violations v
        LEFT JOIN dim_vehicle_type_to_pcu_value p ON v.vehicle_type = p.vehicle_type
        WHERE v.segment_id != -1 
          AND v.offence_code != [] 
          ${dateCondition}
        GROUP BY v.segment_id
      )
      SELECT 
        CAST(s.segment_id AS VARCHAR) as code,
        s.width_m as width,
        s.length_m as length,
        s.lanes,
        s.road_class,
        ST_AsGeoJSON(s.geometry) as geometry,
        COALESCE(sv.total_pcu, 0) as total_pcu,
        COALESCE(sv.violation_count, 0) as violation_count
      FROM segments s
      LEFT JOIN segment_violations sv ON CAST(s.segment_id AS VARCHAR) = sv.segment_id
    `;
  },

  getNetworkDateRange: () => `
    SELECT 
      MIN(created_datetime) as min_date,
      MAX(created_datetime) as max_date
    FROM violations
  `
};
