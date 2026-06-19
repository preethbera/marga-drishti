import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

try:
    import pyarrow
except ImportError:
    print("Please install pyarrow and pandas: pip install pandas pyarrow")
    exit(1)

n = 200000

# Bengaluru Bounding box
min_lon, max_lon = 77.40, 77.75
min_lat, max_lat = 12.80, 13.10

# Generate coordinates
lons = np.random.uniform(min_lon, max_lon, n).astype(np.float32)
lats = np.random.uniform(min_lat, max_lat, n).astype(np.float32)

vehicle_types = np.random.choice(['LMV', 'HMV', '2W', '3W'], n)

# Generate list of offence codes [102], [101, 102], etc.
offence_options = [[101], [102], [103], [104], [101, 102], [102, 103], [101, 103, 104]]
offence_codes = [random.choice(offence_options) for _ in range(n)]

# Generate dates
now = datetime.now()
dates = [(now - timedelta(hours=random.randint(0, 24*7), minutes=random.randint(0, 60))).isoformat() for _ in range(n)]

df = pd.DataFrame({
    'longitude': lons,
    'latitude': lats,
    'offence_code': offence_codes,
    'vehicle_type': vehicle_types,
    'created_datetime': dates
})

output_file = 'bengaluru_traffic.parquet'
df.to_parquet(output_file)
print(f"Generated {output_file} with {n} rows.")
