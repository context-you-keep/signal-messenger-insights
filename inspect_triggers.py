#!/usr/bin/env python3
"""Inspect Signal database triggers to understand the corruption error."""
import pysqlcipher3.dbapi2 as sqlite3
import sys
import json

# Load config
with open('.signal-data/config.json', 'r') as f:
    config = json.load(f)
    key = config.get('key', '')

if not key:
    print("No key in config")
    sys.exit(1)

# Open database
conn = sqlite3.connect('.signal-data/db.sqlite')
conn.execute(f"PRAGMA key = \"x'{key}'\"")
conn.execute("PRAGMA cipher_page_size = 4096")
conn.execute("PRAGMA kdf_iter = 64000")
conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512")
conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512")

# Get ALL trigger definitions
print("\n=== ALL TRIGGERS ===")
cursor = conn.execute("""
    SELECT name, sql
    FROM sqlite_master
    WHERE type='trigger'
    ORDER BY name
""")

all_triggers = cursor.fetchall()
print(f"Found {len(all_triggers)} triggers\n")

for row in all_triggers:
    print(f"Trigger: {row[0]}")
    if row[1]:
        print(f"SQL:\n{row[1]}\n")
    else:
        print("(No SQL definition - might be corrupted)\n")
    print("-" * 80)

# Specifically look for messages_on_insert triggers
print("\n=== MESSAGES_ON_INSERT TRIGGERS ===")
cursor = conn.execute("""
    SELECT name, sql
    FROM sqlite_master
    WHERE type='trigger'
    AND name LIKE '%messages_on_insert%'
""")

for row in cursor:
    print(f"Trigger: {row[0]}")
    if row[1]:
        print(f"SQL:\n{row[1]}\n")
        # Check for >> operator
        if '>>' in str(row[1]):
            print("⚠️  FOUND '>>' OPERATOR IN TRIGGER SQL!")
            print(f"Context: ...{row[1][max(0, row[1].find('>>')-50):row[1].find('>>')+100]}...")
    else:
        print("(No SQL definition)\n")
    print("=" * 80)

conn.close()
