import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { useUiStore } from '../store/useUiStore';
import { getFileFromOPFS } from './opfs';

const MANUAL_BUNDLES = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};

let db = null;
let conn = null;

export async function initDuckDB() {
    if (db) return { db, conn };

    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    conn = await db.connect();

    return { db, conn };
}

export async function fetchSystemDefault(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not load system default file.");
    return new Uint8Array(await response.arrayBuffer());
}

export async function setActiveTable(id, buffer) {
    if (!db) await initDuckDB();
    
    await db.registerFileBuffer(id, buffer);
    
    // Create a table view to simplify queries
    await conn.query(`
        CREATE OR REPLACE VIEW traffic_violations AS 
        SELECT * FROM read_parquet('${id.replace(/'/g, "''")}')
    `);
    
    // Get row count to return
    const res = await conn.query(`SELECT count(*) as c FROM traffic_violations`);
    const count = Number(res.toArray()[0].toJSON().c);

    return count;
}

export async function previewTableData(filename, source, url) {
    if (!conn) return [];
    try {
        let buffer;
        if (source === 'System Default') {
            buffer = await fetchSystemDefault(url);
        } else {
            const opfsFile = await getFileFromOPFS(filename);
            buffer = new Uint8Array(await opfsFile.arrayBuffer());
        }
        await db.registerFileBuffer('preview.parquet', buffer);
        const res = await conn.query(`SELECT * FROM read_parquet('preview.parquet') LIMIT 100`);
        return res.toArray().map(row => row.toJSON());
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function executeFilterQuery(filters) {
    if (!conn) return null;

    useUiStore.getState().setIsLoading(true);

    try {
        let whereClauses = [];

        // 1. Vehicle Type Filter
        if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
            const types = filters.vehicleTypes.map(t => `'${t}'`).join(',');
            whereClauses.push(`vehicle_type IN (${types})`);
        }

        // 2. Offence Code Filter (Array type in DuckDB)
        if (filters.violationCodes && filters.violationCodes.length > 0) {
            // Using list_contains for DuckDB LIST types
            const codeConditions = filters.offenceCodes.map(code => `list_contains(offence_code, ${code})`);
            whereClauses.push(`(${codeConditions.join(' OR ')})`);
        }

        // 3. Timeline Slider Filter (Hours 0-23)
        // Assume created_datetime is an ISO string, we extract the hour
        // DuckDB date_part('hour', cast(created_datetime as timestamp))
        if (filters.hourRange && filters.hourRange.length === 2) {
            const [startHour, endHour] = filters.hourRange;
            whereClauses.push(`date_part('hour', cast(created_datetime as timestamp)) BETWEEN ${startHour} AND ${endHour}`);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // Select only the columns needed for Map Rendering (lon, lat)
        const sql = `
            SELECT longitude, latitude
            FROM traffic_violations
            ${whereSQL}
        `;

        // Execute query and get Apache Arrow result
        const arrowTable = await conn.query(sql);

        // Zero-copy extraction of Float32Arrays
        // We get the raw arrays out of the Arrow columns to feed directly into deck.gl data.attributes
        const numRows = arrowTable.numRows;
        
        // Create typed arrays to hold the contiguous data
        const positions = new Float32Array(numRows * 2);
        
        // Arrow tables can have multiple batches
        let offset = 0;
        for (const batch of arrowTable.batches) {
            const lonArray = batch.getChild('longitude')?.values;
            const latArray = batch.getChild('latitude')?.values;
            
            if (lonArray && latArray) {
                const batchLength = batch.numRows;
                for (let i = 0; i < batchLength; i++) {
                    positions[(offset + i) * 2] = lonArray[i];
                    positions[(offset + i) * 2 + 1] = latArray[i];
                }
                offset += batchLength;
            }
        }

        return {
            length: numRows,
            attributes: {
                getPosition: { value: positions, size: 2 }
            }
        };

    } catch (error) {
        console.error("Query Error:", error);
        return null;
    } finally {
        useUiStore.getState().setIsLoading(false);
    }
}

// --- Analytics Queries ---

export async function getExecutiveKPIs() {
    if (!conn) return null;
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
}

export async function getTrendData() {
    if (!conn) return [];
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
}

export async function getCategoryBreakdown() {
    if (!conn) return [];
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
}

export async function getVehicleClassification() {
    if (!conn) return [];
    try {
        const res = await conn.query(`
            SELECT vehicle_type as name, count(*) as value
            FROM traffic_violations
            GROUP BY vehicle_type
            ORDER BY value DESC
        `);
        return res.toArray().map(r => ({ name: String(r.toJSON().name), value: Number(r.toJSON().value) }));
    } catch (e) { console.error(e); return []; }
}

export async function getTemporalHotspots(hourRange, dayOfWeek) {
    if (!conn) return null;
    try {
        let where = '';
        let clauses = [];
        if (hourRange) {
            clauses.push(`date_part('hour', cast(created_datetime as timestamp)) BETWEEN ${hourRange[0]} AND ${hourRange[1]}`);
        }
        if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== 'all') {
            // DuckDB dayofweek: 0=Sunday, 6=Saturday
            clauses.push(`dayofweek(cast(created_datetime as timestamp)) = ${dayOfWeek}`);
        }
        if (clauses.length > 0) where = 'WHERE ' + clauses.join(' AND ');
        
        const sql = `SELECT longitude, latitude FROM traffic_violations ${where}`;
        const arrowTable = await conn.query(sql);
        return arrowTable.toArray().map(r => r.toJSON());
    } catch (e) { console.error(e); return null; }
}

export async function getRegionalData(centerCode, policeStation, junction) {
    if (!conn) return null;
    try {
        let whereClauses = [];
        if (centerCode && centerCode !== 'all') whereClauses.push(`center_code = ${centerCode}`);
        if (policeStation && policeStation !== 'all') whereClauses.push(`police_station = '${policeStation}'`);
        if (junction && junction !== 'all') whereClauses.push(`junction = '${junction}'`);
        const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Get stations table
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

        // Get junctions
        const junctionsRes = await conn.query(`
            SELECT junction as name, count(*) as value
            FROM traffic_violations
            ${where}
            GROUP BY junction
            ORDER BY value DESC
            LIMIT 10
        `);

        // Get regional radar (violation types)
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
}

export async function getExploratoryData(xDimension, yDimension) {
    if (!conn) return null;
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
}

