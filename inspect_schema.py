#!/usr/bin/env python3
"""Inspect Signal database schema to see actual table/column names."""
import pysqlcipher3.dbapi2 as sqlite3
import sys

if len(sys.argv) < 3:
    print("Usage: python inspect_schema.py <db_path> <key_hex>")
    sys.exit(1)

db_path = sys.argv[1]
key_hex = sys.argv[2]

conn = sqlite3.connect(db_path)
conn.execute(f"PRAGMA key = \"x'{key_hex}'\"")
conn.execute("PRAGMA cipher_page_size = 4096")
conn.execute("PRAGMA kdf_iter = 64000")
conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512")
conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512")

print("\n=== TABLES ===")
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]
for table in tables:
    print(f"  - {table}")

print("\n=== CONVERSATIONS TABLE SCHEMA ===")
try:
    cursor = conn.execute("PRAGMA table_info(conversations)")
    for row in cursor.fetchall():
        print(f"  {row[1]} ({row[2]})")
except:
    print("  Table 'conversations' not found")

print("\n=== MESSAGES TABLE SCHEMA ===")
try:
    cursor = conn.execute("PRAGMA table_info(messages)")
    for row in cursor.fetchall():
        print(f"  {row[1]} ({row[2]})")
except:
    print("  Table 'messages' not found")

print("\n=== SAMPLE CONVERSATION ===")
try:
    cursor = conn.execute("SELECT * FROM conversations LIMIT 1")
    row = cursor.fetchone()
    if row:
        cols = [desc[0] for desc in cursor.description]
        for i, col in enumerate(cols):
            print(f"  {col}: {row[i]}")
except Exception as e:
    print(f"  Error: {e}")

conn.close()
