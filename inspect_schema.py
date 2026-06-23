import duckdb
conn = duckdb.connect()
print(conn.execute("DESCRIBE SELECT * FROM 'public/data/segments/bengaluru_segments_optimized.parquet'").df())
