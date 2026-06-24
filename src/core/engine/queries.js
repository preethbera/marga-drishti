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
    SELECT 'center' as type, CAST(center_code AS VARCHAR) as code, police_station as name 
    FROM dim_center_code
    UNION ALL
    SELECT 'offence' as type, CAST(offence_code AS VARCHAR) as code, violation_type as name
    FROM dim_offence_code
    UNION ALL
    SELECT 'vehicle' as type, vehicle_type as code, vehicle_type as name
    FROM violations
    GROUP BY vehicle_type
  `,

  // --- GEOSPATIAL ANALYSIS QUERIES ---

  getGeospatialBaseFilter: (filters, alias = 'v') => {
    let conditions = [`(${alias}.center_code != 91 OR ${alias}.center_code IS NULL)`];
    if (filters?.centerCode && filters.centerCode !== 'all') {
      conditions.push(`${alias}.center_code = ${filters.centerCode}`);
    }
    if (filters?.offenceCode && filters.offenceCode !== 'all') {
      conditions.push(`list_contains(${alias}.offence_code, ${filters.offenceCode})`);
    }
    if (filters?.vehicleType && filters.vehicleType !== 'all') {
      conditions.push(`${alias}.vehicle_type = '${filters.vehicleType}'`);
    }
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";
  },

  getGeoCityAggregations: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
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

  getGeoDetailedViolations: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
    return `
      SELECT 
        v.latitude, 
        v.longitude, 
        v.vehicle_type,
        v.offence_code,
        extract('hour' from v.created_datetime) as hour_val
      FROM violations v
      ${whereClause}
    `;
  },

  getGeoTop10List: (filters) => {
    // Top 10 with hourly fingerprint. We get overall counts, and the array of hour counts 0-23
    const filterWithoutCenter = { ...filters, centerCode: 'all' };
    const whereClause = QUERIES.getGeospatialBaseFilter(filterWithoutCenter);
    
    return `
      WITH center_totals AS (
        SELECT v.center_code, COUNT(*) as total_count
        FROM violations v
        ${whereClause}
        GROUP BY v.center_code
        ORDER BY total_count DESC
        LIMIT 10
      ),
      hourly_counts AS (
        SELECT 
          v.center_code, 
          extract('hour' from v.created_datetime) as hour_val, 
          COUNT(*) as hour_count
        FROM violations v
        INNER JOIN center_totals ct ON v.center_code = ct.center_code
        ${whereClause}
        GROUP BY v.center_code, hour_val
      ),
      all_hours AS (
        SELECT UNNEST(generate_series(0, 23)) as h
      ),
      fingerprints AS (
        SELECT 
          ct.center_code,
          list(COALESCE(hc.hour_count, 0) ORDER BY ah.h ASC) as hourly_fingerprint
        FROM center_totals ct
        CROSS JOIN all_hours ah
        LEFT JOIN hourly_counts hc ON hc.center_code = ct.center_code AND hc.hour_val = ah.h
        GROUP BY ct.center_code
      )
      SELECT 
        ct.center_code as code,
        c.police_station as name,
        ct.total_count as count,
        f.hourly_fingerprint
      FROM center_totals ct
      JOIN fingerprints f ON ct.center_code = f.center_code
      LEFT JOIN dim_center_code c ON CAST(ct.center_code AS VARCHAR) = CAST(c.center_code AS VARCHAR)
      ORDER BY ct.total_count DESC
    `;
  },

  getGeoDrillDownStats: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
    return `
      WITH current_center AS (
        SELECT * FROM violations v ${whereClause}
      ),
      peak_hour AS (
        SELECT extract('hour' from created_datetime) as hour_val, count(*) as count 
        FROM current_center GROUP BY hour_val ORDER BY count DESC LIMIT 1
      ),
      peak_day AS (
        SELECT extract('dow' from created_datetime) as dow, count(*) as count 
        FROM current_center GROUP BY dow ORDER BY count DESC LIMIT 1
      ),
      lead_ps AS (
        SELECT ps.police_station as name, count(*) as count
        FROM current_center c
        LEFT JOIN dim_center_code ps ON CAST(c.center_code AS VARCHAR) = CAST(ps.center_code AS VARCHAR)
        GROUP BY ps.police_station
        ORDER BY count DESC LIMIT 1
      ),
      entropy_calc AS (
        SELECT 
          SUM(-1 * p_val * log2(p_val)) as entropy
        FROM (
          SELECT count(*) * 1.0 / (SELECT count(*) FROM current_center) as p_val
          FROM current_center
          GROUP BY extract('hour' from created_datetime)
        )
      )
      SELECT 
        (SELECT count(*) FROM current_center) as total_violations,
        (SELECT count(DISTINCT center_code) FROM current_center) as police_stations_count,
        (SELECT hour_val FROM peak_hour) as peak_hour,
        (SELECT dow FROM peak_day) as peak_day,
        (SELECT name FROM lead_ps) as lead_station_name,
        (SELECT entropy FROM entropy_calc) as predictability_entropy
    `;
  },

  getGeoBehaviouralTwins: (filters) => {
    const centerCode = filters.centerCode;
    const filterWithoutCenter = { ...filters, centerCode: 'all' };
    const whereClauseAll = QUERIES.getGeospatialBaseFilter(filterWithoutCenter);
    
    // Calculates cosine similarity of the 24-hour distribution
    return `
      WITH hourly_vectors AS (
        SELECT 
          v.center_code, 
          extract('hour' from v.created_datetime) as hour_val, 
          COUNT(*) as hour_count
        FROM violations v
        ${whereClauseAll}
        GROUP BY v.center_code, hour_val
      ),
      vector_norms AS (
        SELECT 
          center_code, 
          sqrt(sum(hour_count * hour_count)) as norm
        FROM hourly_vectors
        GROUP BY center_code
      ),
      target_vector AS (
        SELECT hour_val, hour_count, norm
        FROM hourly_vectors h
        JOIN vector_norms n ON h.center_code = n.center_code
        WHERE h.center_code = ${centerCode}
      ),
      similarities AS (
        SELECT 
          h.center_code,
          sum(h.hour_count * t.hour_count) / (n.norm * MAX(t.norm)) as cosine_sim
        FROM hourly_vectors h
        JOIN target_vector t ON h.hour_val = t.hour_val
        JOIN vector_norms n ON h.center_code = n.center_code
        WHERE h.center_code != ${centerCode}
        GROUP BY h.center_code, n.norm
        ORDER BY cosine_sim DESC
        LIMIT 3
      ),
      similar_hourly_counts AS (
        SELECT 
          s.center_code, 
          v.hour_val, 
          v.hour_count
        FROM similarities s
        JOIN hourly_vectors v ON s.center_code = v.center_code
      ),
      all_hours AS (
        SELECT UNNEST(generate_series(0, 23)) as h
      ),
      fingerprints AS (
        SELECT 
          s.center_code,
          list(COALESCE(hc.hour_count, 0) ORDER BY ah.h ASC) as hourly_fingerprint
        FROM similarities s
        CROSS JOIN all_hours ah
        LEFT JOIN similar_hourly_counts hc ON hc.center_code = s.center_code AND hc.hour_val = ah.h
        GROUP BY s.center_code
      )
      SELECT 
        s.center_code as code,
        c.police_station as name,
        s.cosine_sim as similarity,
        f.hourly_fingerprint
      FROM similarities s
      JOIN fingerprints f ON s.center_code = f.center_code
      LEFT JOIN dim_center_code c ON CAST(s.center_code AS VARCHAR) = CAST(c.center_code AS VARCHAR)
      ORDER BY s.cosine_sim DESC
    `;
  },

  getGeoTopOffences: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
    return `
      SELECT 
        CAST(code AS VARCHAR) as code,
        d.violation_type as name,
        count(*) as count
      FROM (
        SELECT UNNEST(offence_code) as code 
        FROM violations v
        ${whereClause}
      )
      LEFT JOIN dim_offence_code d ON CAST(code AS VARCHAR) = CAST(d.offence_code AS VARCHAR)
      GROUP BY code, d.violation_type
      ORDER BY count DESC
      LIMIT 5
    `;
  },

  getGeoVehicleMix: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
    return `
      SELECT 
        v.vehicle_type as type,
        count(*) as count
      FROM violations v
      ${whereClause} AND v.vehicle_type IS NOT NULL
      GROUP BY v.vehicle_type
      ORDER BY count DESC
      LIMIT 6
    `;
  },

  getGeoHourlyProfile: (filters) => {
    const whereClause = QUERIES.getGeospatialBaseFilter(filters);
    return `
      WITH hourly_counts AS (
        SELECT 
          extract('hour' from v.created_datetime) as hour_val, 
          COUNT(*) as count
        FROM violations v
        ${whereClause}
        GROUP BY hour_val
      )
      SELECT 
        h2.h as hour_val,
        COALESCE(h.count, 0) as count
      FROM (SELECT UNNEST(generate_series(0, 23)) as h) h2
      LEFT JOIN hourly_counts h ON h.hour_val = h2.h
      ORDER BY h2.h ASC
    `;
  },

  // --- End Geospatial Queries ---


  // Executive Summary Queries
  getExecutiveDateRange: () => `
    SELECT 
      CAST(MIN(created_datetime) AS VARCHAR) as min_date,
      CAST(MAX(created_datetime) AS VARCHAR) as max_date
    FROM violations
  `,

  getExecutiveSummaryStats: (start, end) => {
    const dateFilter = start && end ? `WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'` : '';
    return `
      WITH current_period AS (
        SELECT * FROM violations 
        ${dateFilter}
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
  
  getDailyVolumeTrend: (start, end) => {
    const dateFilter = start && end ? `WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'` : '';
    return `
      SELECT 
        CAST(date_trunc('day', created_datetime) AS VARCHAR) as date,
        count(*) as count
      FROM violations
      ${dateFilter}
      GROUP BY date
      HAVING date IS NOT NULL
      ORDER BY date ASC
    `;
  },

  getTopOffencesList: (start, end) => {
    const dateFilter = start && end ? `WHERE created_datetime >= '${start}' AND created_datetime <= '${end}'` : '';
    return `
      SELECT 
        CAST(code AS VARCHAR) as code, 
        count(*) as count
      FROM (
        SELECT UNNEST(offence_code) as code 
        FROM violations 
        ${dateFilter}
      )
      GROUP BY code
      ORDER BY count DESC
      LIMIT 5
    `;
  },

  getTopStationsList: (start, end) => {
    const dateFilter = start && end ? `WHERE created_datetime >= '${start}' AND created_datetime <= '${end}' AND center_code != 91` : 'WHERE center_code != 91';
    return `
      SELECT 
        CAST(center_code AS VARCHAR) as code, 
        count(*) as count
      FROM violations
      ${dateFilter}
      GROUP BY center_code
      ORDER BY count DESC
      LIMIT 5
    `;
  },

  getVehicleMix: (start, end) => {
    const dateFilter = start && end ? `WHERE created_datetime >= '${start}' AND created_datetime <= '${end}' AND vehicle_type IS NOT NULL` : 'WHERE vehicle_type IS NOT NULL';
    return `
      SELECT 
        vehicle_type as type,
        count(*) as count
      FROM violations
      ${dateFilter}
      GROUP BY vehicle_type
      ORDER BY count DESC
    `;
  },

  // Helper for temporal conditions
  _buildTemporalConditions: (filters) => {
    let conditions = [];
    if (filters?.timeRange && (filters.timeRange[0] !== 0 || filters.timeRange[1] !== 23)) {
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
        (SELECT d.police_station FROM top_station t LEFT JOIN dim_center_code d ON CAST(t.center_code AS VARCHAR) = CAST(d.center_code AS VARCHAR)) as top_station_name,
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
      dateCondition = `AND v.created_datetime >= '${filters.startDate}' AND v.created_datetime <= '${filters.endDate} 23:59:59'`;
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
  `,

  // --- Exploratory Sandbox Queries ---
  getExploratoryPivot: (xAxis, yAxis) => {
    // Map human readable axis names to SQL expressions
    const axisMap = {
      'Vehicle Type': 'vehicle_type',
      'Offence Code': 'violation_type',
      'Police Station': 'police_station',
      'Center Code': 'center_code'
    };
    
    const xExpr = axisMap[xAxis];
    const yExpr = axisMap[yAxis];

    return `
      WITH unnested_violations AS (
        SELECT v.vehicle_type, CAST(v.center_code AS VARCHAR) as center_code, UNNEST(v.offence_code) as offence_code
        FROM violations v
      ),
      base_data AS (
        SELECT
          u.vehicle_type,
          u.center_code,
          d_cen.police_station,
          d_off.violation_type
        FROM unnested_violations u
        LEFT JOIN dim_center_code d_cen ON u.center_code = CAST(d_cen.center_code AS VARCHAR)
        LEFT JOIN dim_offence_code d_off ON CAST(u.offence_code AS VARCHAR) = CAST(d_off.offence_code AS VARCHAR)
      ),
      filtered AS (
        SELECT 
          COALESCE(CAST(${xExpr} AS VARCHAR), 'Unknown') as x_val, 
          COALESCE(CAST(${yExpr} AS VARCHAR), 'Unknown') as y_val
        FROM base_data
      ),
      clean_filtered AS (
        SELECT 
          CASE WHEN x_val = '' THEN 'Unknown' ELSE x_val END as x_val,
          CASE WHEN y_val = '' THEN 'Unknown' ELSE y_val END as y_val
        FROM filtered
      ),
      pivoted AS (
        PIVOT clean_filtered ON x_val USING count(*) GROUP BY y_val
      ),
      totals AS (
        SELECT y_val, count(*) as row_total
        FROM clean_filtered
        GROUP BY y_val
      )
      SELECT p.*, t.row_total as "Total"
      FROM pivoted p 
      JOIN totals t ON p.y_val = t.y_val
      ORDER BY t.row_total DESC
    `;
  }
};

