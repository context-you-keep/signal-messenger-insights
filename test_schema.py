#!/usr/bin/env python3
"""Test script to inspect Signal database schema and query conversations."""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from pysqlcipher3 import dbapi2 as sqlite3
import json

# Paths (adjust if needed)
config_path = Path("/app/uploads/config.json")
db_path = Path("/app/uploads/db.sqlite")

# Load config and extract key
with open(config_path) as f:
    config = json.load(f)

key_hex = config.get("key")
if not key_hex:
    print("ERROR: No 'key' field in config.json")
    sys.exit(1)

# Connect to database
conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
conn.execute(f"PRAGMA key = \"x'{key_hex}'\"")
conn.execute("PRAGMA cipher_page_size = 4096")
conn.execute("PRAGMA kdf_iter = 64000")
conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512")
conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512")

# Test connection
cursor = conn.execute("SELECT count(*) FROM sqlite_master")
print(f"✅ Database decrypted successfully\n")

# Get all tables
print("=" * 80)
print("TABLES IN DATABASE")
print("=" * 80)
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
for row in cursor.fetchall():
    print(f"  - {row[0]}")
print()

# Get conversations table schema
print("=" * 80)
print("CONVERSATIONS TABLE SCHEMA")
print("=" * 80)
cursor = conn.execute("PRAGMA table_info(conversations)")
columns = []
for row in cursor.fetchall():
    col_id, col_name, col_type, not_null, default_val, pk = row
    columns.append(col_name)
    print(f"  {col_name:30s} {col_type:15s} {'NOT NULL' if not_null else ''} {'PK' if pk else ''}")
print()

# Get total conversation count
cursor = conn.execute("SELECT COUNT(*) as count FROM conversations")
total = cursor.fetchone()[0]
print(f"Total conversations: {total}\n")

# Get a sample conversation
print("=" * 80)
print("SAMPLE CONVERSATION (first row)")
print("=" * 80)
cursor = conn.execute("SELECT * FROM conversations ORDER BY active_at DESC LIMIT 1")
row = cursor.fetchone()
if row:
    cols = [desc[0] for desc in cursor.description]
    for i, col in enumerate(cols):
        value = row[i]
        if isinstance(value, (int, float)) and value > 1000000000000:  # Looks like timestamp
            # Convert millisecond timestamp to readable
            from datetime import datetime
            readable = datetime.fromtimestamp(value / 1000).strftime("%Y-%m-%d %H:%M:%S")
            print(f"  {col:30s} = {value} ({readable})")
        elif isinstance(value, str) and len(str(value)) > 100:
            print(f"  {col:30s} = {str(value)[:100]}... (truncated)")
        else:
            print(f"  {col:30s} = {value}")
else:
    print("  No conversations found")

print()

# Get messages table schema
print("=" * 80)
print("MESSAGES TABLE SCHEMA")
print("=" * 80)
cursor = conn.execute("PRAGMA table_info(messages)")
for row in cursor.fetchall():
    col_id, col_name, col_type, not_null, default_val, pk = row
    print(f"  {col_name:30s} {col_type:15s} {'NOT NULL' if not_null else ''} {'PK' if pk else ''}")

conn.close()
print("\n✅ Schema inspection complete")
