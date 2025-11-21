#!/bin/bash
# Signal Desktop Key Extractor (Streamlined)
# Outputs ONLY the decryption key for easy piping to clipboard

set -e

SIGNAL_DIR="$HOME/.config/Signal"
CONFIG_FILE="$SIGNAL_DIR/config.json"

# Check if Signal config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Signal config not found at $CONFIG_FILE" >&2
    echo "Make sure Signal Desktop is installed and you've logged in at least once." >&2
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "ERROR: jq is required but not installed" >&2
    echo "Install: sudo apt install jq" >&2
    exit 1
fi

# Check if config already has plain 'key' field
if jq -e '.key' "$CONFIG_FILE" &> /dev/null; then
    jq -r '.key' "$CONFIG_FILE"
    exit 0
fi

# Check if config has encryptedKey
if ! jq -e '.encryptedKey' "$CONFIG_FILE" &> /dev/null; then
    echo "ERROR: No 'key' or 'encryptedKey' found in config.json" >&2
    exit 1
fi

# Check if secret-tool is available
if ! command -v secret-tool &> /dev/null; then
    echo "ERROR: secret-tool is required but not installed" >&2
    echo "Install: sudo apt install libsecret-tools" >&2
    exit 1
fi

# Get password from keyring
if ! ENCRYPTION_PASSWORD=$(secret-tool lookup application Signal 2>/dev/null); then
    echo "ERROR: Could not retrieve Signal encryption password from keyring" >&2
    echo "Make sure Signal Desktop is running and unlocked" >&2
    exit 1
fi

# Extract the encryptedKey and strip whitespace
ENCRYPTED_KEY=$(jq -r '.encryptedKey' "$CONFIG_FILE" | tr -d '[:space:]')

# Validate encryptedKey is not empty
if [ -z "$ENCRYPTED_KEY" ]; then
    echo "ERROR: encryptedKey is empty" >&2
    exit 1
fi

# Check if pycryptodome is installed
if ! python3 -c "import Crypto" 2>/dev/null; then
    echo "ERROR: pycryptodome is required but not installed" >&2
    echo "Install: pip install pycryptodome" >&2
    exit 1
fi

# Decrypt and output ONLY the key
python3 - "$ENCRYPTED_KEY" "$ENCRYPTION_PASSWORD" <<'EOF'
import sys
import base64
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2

encrypted_key_b64 = sys.argv[1]
password = sys.argv[2]

# Decode the encrypted key - auto-detect format (hex vs base64)
try:
    if all(c in '0123456789abcdefABCDEF' for c in encrypted_key_b64):
        encrypted_key = bytes.fromhex(encrypted_key_b64)
    else:
        encrypted_key = base64.b64decode(encrypted_key_b64)
except Exception as e:
    print(f"ERROR: Failed to decode encrypted key: {e}", file=sys.stderr)
    sys.exit(1)

# Chromium's key derivation parameters (used by Signal Desktop)
# CRITICAL: Chromium uses different parameters than Signal's database encryption!
PBKDF2_SALT = b'saltysalt'
PBKDF2_ITERATIONS = 1  # Yes, really just 1!
PBKDF2_KEY_SIZE = 16   # 128-bit AES key
from Crypto.Hash import SHA1

# Derive the AES key from password using Chromium's parameters
aes_key = PBKDF2(
    password,
    salt=PBKDF2_SALT,
    dkLen=PBKDF2_KEY_SIZE,
    count=PBKDF2_ITERATIONS,
    hmac_hash_module=SHA1
)

# Skip the v11 prefix (first 3 bytes)
if not encrypted_key.startswith(b'v11'):
    print("ERROR: Encrypted key missing v11 prefix", file=sys.stderr)
    sys.exit(1)

encrypted_data = encrypted_key[3:]

# Decrypt using AES-128-CBC with Chromium's IV (16 spaces)
iv = b' ' * 16
cipher = AES.new(aes_key, AES.MODE_CBC, iv)
decrypted = cipher.decrypt(encrypted_data)

# Remove PKCS7 padding
from Crypto.Util.Padding import unpad
database_key_hex = unpad(decrypted, block_size=16).decode('ascii')

# Convert hex string to bytes and output ONLY the hex key
database_key = bytes.fromhex(database_key_hex)
print(database_key.hex())
EOF
