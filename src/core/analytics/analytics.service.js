import { DatabaseService } from '@core/database/database.service';
import { CENTERS } from '@/data/staticMappings';

export const AnalyticsService = {
    async getExecutiveKPIs() {
        const conn = await DatabaseService.getConn();
        try {
            const res = await conn.query(`
                SELECT 
                    (SELECT count(*) FROM active_violations) as total_violations,
                    (SELECT code FROM active_violations, UNNEST(offence_code) AS t(code) GROUP BY code ORDER BY count(*) DESC LIMIT 1) as top_category,
                    (SELECT center_code FROM active_violations GROUP BY center_code ORDER BY count(*) DESC LIMIT 1) as top_station,
                    (SELECT date_part('hour', cast(created_datetime as timestamp)) as h FROM active_violations GROUP BY h ORDER BY count(*) DESC LIMIT 1) as peak_hour
            `);
            const row = res.toArray()[0].toJSON();
            const centerCode = Number(row.top_station);
            const centerName = CENTERS.find(c => c.code === centerCode)?.name || String(centerCode);

            return {
                totalViolations: Number(row.total_violations),
                topCategory: row.top_category,
                topStation: centerName,
                peakHour: Number(row.peak_hour)
            };
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async getTrendData() {
        const conn = await DatabaseService.getConn();
        try {
            const res = await conn.query(`
                SELECT date_trunc('day', cast(created_datetime as timestamp)) as date, count(*) as count
                FROM active_violations
                GROUP BY date
                ORDER BY date ASC
            `);
            return res.toArray().map(r => {
                const j = r.toJSON();
                return { date: new Date(Number(j.date)).toLocaleDateString(), count: Number(j.count) };
            });
        } catch (e) { console.error(e); return []; }
    },

    async getCategoryBreakdown() {
        const conn = await DatabaseService.getConn();
        try {
            const res = await conn.query(`
                SELECT code as name, count(*) as value
                FROM active_violations, UNNEST(offence_code) AS t(code)
                GROUP BY name
                ORDER BY value DESC
                LIMIT 5
            `);
            return res.toArray().map(r => ({ name: String(r.toJSON().name), value: Number(r.toJSON().value) }));
        } catch (e) { console.error(e); return []; }
    },

    async getVehicleClassification() {
        const conn = await DatabaseService.getConn();
        try {
            const res = await conn.query(`
                SELECT vehicle_type as name, count(*) as value
                FROM active_violations
                GROUP BY vehicle_type
                ORDER BY value DESC
            `);
            return res.toArray().map(r => ({ name: String(r.toJSON().name), value: Number(r.toJSON().value) }));
        } catch (e) { console.error(e); return []; }
    },

    async getTemporalHotspots(hourRange, dayOfWeek) {
        const conn = await DatabaseService.getConn();
        try {
            let where = '';
            let clauses = [];
            if (hourRange) {
                clauses.push(`date_part('hour', cast(created_datetime as timestamp)) BETWEEN ${hourRange[0]} AND ${hourRange[1]}`);
            }
            if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== 'all') {
                clauses.push(`dayofweek(cast(created_datetime as timestamp)) = ${dayOfWeek}`);
            }
            if (clauses.length > 0) where = 'WHERE ' + clauses.join(' AND ');
            
            const sql = `SELECT longitude, latitude FROM active_violations ${where}`;
            const arrowTable = await conn.query(sql);
            return arrowTable.toArray().map(r => r.toJSON());
        } catch (e) { console.error(e); return null; }
    },

    async getRegionalData(centerCode, junction) {
        const conn = await DatabaseService.getConn();
        try {
            let whereClauses = [];
            if (centerCode && centerCode !== 'all') whereClauses.push(`center_code = ${centerCode}`);
            if (junction && junction !== 'all') whereClauses.push(`junction = '${junction}'`);
            const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const stationsRes = await conn.query(`
                SELECT 
                    center_code as police_station, 
                    count(*) as violations,
                    (SELECT vehicle_type FROM active_violations tv2 WHERE tv2.center_code = tv1.center_code GROUP BY vehicle_type ORDER BY count(*) DESC LIMIT 1) as primary_vehicle,
                    (SELECT code FROM active_violations tv3, UNNEST(tv3.offence_code) AS t(code) WHERE tv3.center_code = tv1.center_code GROUP BY code ORDER BY count(*) DESC LIMIT 1) as primary_violation
                FROM active_violations tv1
                ${where}
                GROUP BY center_code
                ORDER BY violations DESC
                LIMIT 20
            `);

            const junctionsRes = await conn.query(`
                SELECT junction as name, count(*) as value
                FROM active_violations
                ${where}
                GROUP BY junction
                ORDER BY value DESC
                LIMIT 10
            `);

            const radarRes = await conn.query(`
                SELECT code as subject, count(*) as A
                FROM active_violations, UNNEST(offence_code) AS t(code)
                ${where}
                GROUP BY subject
                ORDER BY A DESC
                LIMIT 6
            `);

            const parseRows = (res, mapStation = false) => res.toArray().map(r => {
                const obj = {};
                for (const [k,v] of Object.entries(r.toJSON())) {
                    obj[k] = typeof v === 'bigint' ? Number(v) : v;
                }
                if (mapStation && obj.police_station !== undefined) {
                    const code = Number(obj.police_station);
                    obj.police_station = CENTERS.find(c => c.code === code)?.name || String(code);
                }
                return obj;
            });

            return {
                stations: parseRows(stationsRes, true),
                junctions: parseRows(junctionsRes),
                radar: parseRows(radarRes)
            };
        } catch(e) { console.error(e); return null; }
    },

    async getExploratoryData(xDimension, yDimension) {
        const conn = await DatabaseService.getConn();
        try {
            const isXList = xDimension === 'offence_code';
            const isYList = yDimension === 'offence_code';
            
            let fromClause = 'FROM active_violations';
            let xField = xDimension;
            let yField = yDimension;

            if (isXList || isYList) {
                fromClause += ', UNNEST(offence_code) AS t(code)';
                if (isXList) xField = 'code';
                if (isYList) yField = 'code';
            }

            const res = await conn.query(`
                SELECT ${xField} as x, ${yField} as y, count(*) as c
                ${fromClause}
                GROUP BY x, y
            `);

            const rows = res.toArray();
            const pivotMap = {};
            const columnsSet = new Set();
            
            rows.forEach(r => {
                const j = r.toJSON();
                const xVal = String(j.x);
                const yVal = String(j.y);
                const count = Number(j.c);
                
                columnsSet.add(xVal);
                
                if (!pivotMap[yVal]) {
                    pivotMap[yVal] = { [yDimension]: yVal };
                }
                pivotMap[yVal][xVal] = count;
            });
            
            return {
                columns: Array.from(columnsSet).sort(),
                rows: Object.values(pivotMap).sort((a, b) => String(a[yDimension]).localeCompare(String(b[yDimension])))
            };
        } catch(e) { console.error(e); return null; }
    },

    async getGeospatialMapData({ centerCode, offenceCode, vehicleType }) {
        const conn = await DatabaseService.getConn();
        try {
            let whereClauses = [];
            
            if (offenceCode && offenceCode !== 'all') {
                whereClauses.push(`list_contains(offence_code, ${offenceCode})`);
            }
            
            if (vehicleType && vehicleType !== 'all') {
                whereClauses.push(`vehicle_type = '${vehicleType}'`);
            }

            const isCityWide = !centerCode || centerCode === 'all';
            
            if (isCityWide) {
                const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
                const res = await conn.query(`
                    SELECT 
                        center_code, 
                        avg(latitude) as lat, 
                        avg(longitude) as lng, 
                        count(*) as total 
                    FROM active_violations 
                    ${where} 
                    GROUP BY center_code
                `);
                return {
                    type: 'city-wide',
                    data: res.toArray().map(r => ({
                        center_code: Number(r.toJSON().center_code),
                        latitude: Number(r.toJSON().lat),
                        longitude: Number(r.toJSON().lng),
                        total: Number(r.toJSON().total)
                    }))
                };
            } else {
                whereClauses.push(`center_code = ${centerCode}`);
                const where = 'WHERE ' + whereClauses.join(' AND ');
                const res = await conn.query(`
                    SELECT latitude as lat, longitude as lng 
                    FROM active_violations 
                    ${where}
                `);
                return {
                    type: 'center-zoomed',
                    data: res.toArray().map(r => ({
                        latitude: Number(r.toJSON().lat),
                        longitude: Number(r.toJSON().lng)
                    }))
                };
            }
        } catch(e) { console.error(e); return null; }
    },

    async getSegmentPresets() {
        const conn = await DatabaseService.getConn();
        try {
            // First check if bengaluru_segments_optimized exists
            const tablesRes = await conn.query(`SHOW TABLES`);
            const tables = tablesRes.toArray().map(r => r.toJSON().name);
            
            if (!tables.includes('bengaluru_segments_optimized')) {
                return null; // Signals UI to fall back to archetypes
            }

            const res = await conn.query(`
                SELECT segment_id, width_m, road_class, lanes, length_m 
                FROM bengaluru_segments_optimized
                LIMIT 1000
            `);
            
            return res.toArray().map(r => {
                const j = r.toJSON();
                return {
                    segment_id: String(j.segment_id),
                    width_m: Number(j.width_m),
                    road_class: String(j.road_class),
                    lanes: Number(j.lanes),
                    length_m: Number(j.length_m)
                };
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async getSegmentWithViolationPCU() {
        const conn = await DatabaseService.getConn();
        try {
            const tablesRes = await conn.query(`SHOW TABLES`);
            const tables = tablesRes.toArray().map(r => r.toJSON().name);
            if (!tables.includes('active_violations')) return {};

            // If active_violations has segment_id, aggregate by segment and vehicle_type
            // Using DuckDB try_catch or just a basic query and catch if column missing
            const res = await conn.query(`
                SELECT segment_id, vehicle_type, count(*) as c 
                FROM active_violations 
                WHERE segment_id IS NOT NULL
                GROUP BY segment_id, vehicle_type
            `);
            
            const rawData = res.toArray().map(r => {
                const j = r.toJSON();
                return {
                    segment_id: j.segment_id,
                    vehicle_type: j.vehicle_type,
                    c: Number(j.c)
                };
            });
            return rawData;
        } catch (e) {
            // Probably segment_id column doesn't exist
            return [];
        }
    },

    async getNetworkAggregate(startTime, endTime, roadClasses) {
        const conn = await DatabaseService.getConn();
        
        const tablesRes = await conn.query(`SHOW TABLES`);
        const tables = tablesRes.toArray().map(r => r.toJSON().name);
        
        if (!tables.includes('bengaluru_segments_optimized') || !tables.includes('active_violations')) {
            return { status: 'empty', rawSegments: [], rawViolations: [] };
        }

        let timeFilter = '';
        if (startTime && endTime) {
            const s = new Date(startTime).toISOString();
            const e = new Date(endTime).toISOString();
            timeFilter = `WHERE try_cast(created_datetime as timestamp) >= try_cast('${s}' as timestamp) AND try_cast(created_datetime as timestamp) <= try_cast('${e}' as timestamp)`;
        }

        let violData = [];
        try {
            const violRes = await conn.query(`
                SELECT CAST(segment_id AS INTEGER) as segment_id, vehicle_type, CAST(count(*) AS INTEGER) as count
                FROM active_violations
                ${timeFilter}
                GROUP BY segment_id, vehicle_type
            `);
            violData = violRes.toArray().map(r => r.toJSON());
        } catch (e) {
            console.warn("Failed to aggregate violations", e);
        }

        let classFilter = '';
        if (roadClasses && roadClasses.length > 0) {
            const classList = roadClasses.map(c => `'${c}'`).join(',');
            classFilter = `WHERE road_class IN (${classList})`;
        }

        let segData = [];
        try {
            const segRes = await conn.query(`
                SELECT 
                    CAST(segment_id AS INTEGER) as segment_id, 
                    CAST(width_m AS DOUBLE) as width_m, 
                    road_class, 
                    CAST(lanes AS INTEGER) as lanes, 
                    CAST(length_m AS DOUBLE) as length_m, 
                    geometry
                FROM bengaluru_segments_optimized
                ${classFilter}
            `);
            segData = segRes.toArray().map(r => r.toJSON());
        } catch (e) {
            console.warn("Failed to fetch segments", e);
            return { status: 'error', rawSegments: [], rawViolations: [] };
        }

        return {
            status: segData.length > 0 ? 'success' : 'empty',
            rawSegments: segData,
            rawViolations: violData
        };
    },

    async getAdjacencyList() {
        const conn = await DatabaseService.getConn();
        const tablesRes = await conn.query(`SHOW TABLES`);
        const tables = tablesRes.toArray().map(r => r.toJSON().name);
        
        if (!tables.includes('bengaluru_adjacency')) {
            return new Map();
        }

        try {
            const res = await conn.query(`
                SELECT CAST(segment_id AS INTEGER) as segment_id, CAST(connected_segment_id AS INTEGER) as connected_segment_id
                FROM bengaluru_adjacency
            `);
            const map = new Map();
            res.toArray().forEach(r => {
                const row = r.toJSON();
                const from = row.segment_id;
                const to = row.connected_segment_id;
                
                if (!map.has(from)) map.set(from, []);
                map.get(from).push(to);
            });
            return map;
        } catch (e) {
            console.warn("Failed to build adjacency list", e);
            return new Map();
        }
    }
};
