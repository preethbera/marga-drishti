import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { getFileFromOPFS } from '@/lib/opfs';

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
let initPromise = null;

export const DatabaseService = {
    async initDuckDB() {
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
            const worker = new Worker(bundle.mainWorker);
            const logger = new duckdb.ConsoleLogger();
            const newDb = new duckdb.AsyncDuckDB(logger, worker);
            
            await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
            const newConn = await newDb.connect();
            
            db = newDb;
            conn = newConn;
            return { db, conn };
        })();
        
        return initPromise;
    },

    async getConn() {
        if (!conn) {
            await this.initDuckDB();
        }
        return conn;
    },

    async fetchSystemDefault(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load system default file.");
        return new Uint8Array(await response.arrayBuffer());
    },

    async mountDataset(filename, buffer) {
        const connection = await this.getConn();
        await db.registerFileBuffer(filename, buffer);
        
        let tableName = filename.split('/').pop().replace('.parquet', '').replace(/[^a-zA-Z0-9_]/g, '_');
        if (/^\d/.test(tableName)) {
            tableName = 't_' + tableName;
        }

        await connection.query(`
            CREATE OR REPLACE VIEW ${tableName} AS 
            SELECT * FROM read_parquet('${filename.replace(/'/g, "''")}')
        `);
        
        const res = await connection.query(`SELECT count(*) as c FROM ${tableName}`);
        return { tableName, rowCount: Number(res.toArray()[0].toJSON().c) };
    },

    async setActiveDataset(tableName) {
        const connection = await this.getConn();
        await connection.query(`
            CREATE OR REPLACE VIEW active_violations AS 
            SELECT * FROM ${tableName}
        `);
        const res = await connection.query(`SELECT count(*) as c FROM active_violations`);
        return Number(res.toArray()[0].toJSON().c);
    },

    async getMountedTables() {
        const connection = await this.getConn();
        try {
            const res = await connection.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_type = 'VIEW'`);
            return res.toArray().map(row => row.toJSON().table_name);
        } catch (e) {
            return [];
        }
    },

    async previewTableData(filename, source, url) {
        const connection = await this.getConn();
        try {
            let buffer;
            if (source === 'System Default') {
                buffer = await this.fetchSystemDefault(url);
            } else {
                const opfsFile = await getFileFromOPFS(filename);
                buffer = new Uint8Array(await opfsFile.arrayBuffer());
            }
            await db.registerFileBuffer('preview.parquet', buffer);
            const res = await connection.query(`SELECT * FROM read_parquet('preview.parquet') LIMIT 100`);
            return res.toArray().map(row => row.toJSON());
        } catch (e) {
            console.error(e);
            return [];
        }
    }
};
