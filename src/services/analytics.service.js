import { DatabaseService } from './database.service';

export const AnalyticsService = {
    async getExecutiveKPIs() {
        const conn = await DatabaseService.getConn();
        try {
            const res = await conn.query(`
                SELECT 
                    (SELECT count(*) FROM traffic_violations) as total_violations,
                    (SELECT code FROM traffic_violations, UNNEST(offence_code) AS t(code) GROUP BY code ORDER BY count(*) DESC LIMIT 1) as top_category,
                    (SELECT police_station FROM traffic_violations GROUP BY police_station ORDER BY count(*) DESC LIMIT 1) as top_station,
                    (SELECT date_part('hour', cast(created_datetime as timestamp)) as h FROM traffic_violations GROUP BY h ORDER BY count(*) DESC LIMIT 1) as peak_hour
            `);
            const row = res.toArray()[0].toJSON();
            return {
                totalViolations: Number(row.total_violations),
                topCategory: row.top_category,
                topStation: row.top_station,
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
                FROM traffic_violations
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
                FROM traffic_violations, UNNEST(offence_code) AS t(code)
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
                FROM traffic_violations
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
            
            const sql = `SELECT longitude, latitude FROM traffic_violations ${where}`;
            const arrowTable = await conn.query(sql);
            return arrowTable.toArray().map(r => r.toJSON());
        } catch (e) { console.error(e); return null; }
    },

    async getRegionalData(centerCode, policeStation, junction) {
        const conn = await DatabaseService.getConn();
        try {
            let whereClauses = [];
            if (centerCode && centerCode !== 'all') whereClauses.push(`center_code = ${centerCode}`);
            if (policeStation && policeStation !== 'all') whereClauses.push(`police_station = '${policeStation}'`);
            if (junction && junction !== 'all') whereClauses.push(`junction = '${junction}'`);
            const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const stationsRes = await conn.query(`
                SELECT 
                    police_station, 
                    count(*) as violations,
                    (SELECT vehicle_type FROM traffic_violations tv2 WHERE tv2.police_station = tv1.police_station GROUP BY vehicle_type ORDER BY count(*) DESC LIMIT 1) as primary_vehicle,
                    (SELECT code FROM traffic_violations tv3, UNNEST(tv3.offence_code) AS t(code) WHERE tv3.police_station = tv1.police_station GROUP BY code ORDER BY count(*) DESC LIMIT 1) as primary_violation
                FROM traffic_violations tv1
                ${where}
                GROUP BY police_station
                ORDER BY violations DESC
                LIMIT 20
            `);

            const junctionsRes = await conn.query(`
                SELECT junction as name, count(*) as value
                FROM traffic_violations
                ${where}
                GROUP BY junction
                ORDER BY value DESC
                LIMIT 10
            `);

            const radarRes = await conn.query(`
                SELECT code as subject, count(*) as A
                FROM traffic_violations, UNNEST(offence_code) AS t(code)
                ${where}
                GROUP BY subject
                ORDER BY A DESC
                LIMIT 6
            `);

            const parseRows = (res) => res.toArray().map(r => {
                const obj = {};
                for (const [k,v] of Object.entries(r.toJSON())) {
                    obj[k] = typeof v === 'bigint' ? Number(v) : v;
                }
                return obj;
            });

            return {
                stations: parseRows(stationsRes),
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
            
            let fromClause = 'FROM traffic_violations';
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
                    FROM traffic_violations 
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
                    FROM traffic_violations 
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
    }
};
