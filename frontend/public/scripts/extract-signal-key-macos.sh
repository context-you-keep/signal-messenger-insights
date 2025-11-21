#!/bin/bash
# Signal Desktop Key Extractor (macOS)
# Outputs ONLY the decryption key for easy piping to clipboard

set -e

SIGNAL_DIR="$HOME/Library/Application Support/Signal"
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
    echo "Install: brew install jq" >&2
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

# Get password from keychain
if ! ENCRYPTION_PASSWORD=$(security find-generic-password -ws "Signal Safe Storage" 2>/dev/null); then
    echo "ERROR: Could not retrieve Signal encryption password from keychain" >&2
    echo "Make sure Signal Desktop is running and unlocked" >&2
    exit 1
fi

# Extract the encryptedKey and strip any whitespace
ENCRYPTED_KEY=$(jq -r '.encryptedKey' "$CONFIG_FILE" | tr -d '[:space:]')

# Check if pycryptodome is installed
if ! python3 -c "import Crypto" 2>/dev/null; then
    echo "ERROR: pycryptodome is required but not installed" >&2
    echo "Install: pip3 install pycryptodome" >&2
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
    # Check if it's hex (only contains 0-9a-f)
    if all(c in '0123456789abcdefABCDEF' for c in encrypted_key_b64):
        encrypted_key = bytes.fromhex(encrypted_key_b64)
    else:
        encrypted_key = base64.b64decode(encrypted_key_b64)
except Exception as e:
    print(f"ERROR: Failed to decode encrypted key: {e}", file=sys.stderr)
    sys.exit(1)

# Signal's key derivation parameters
PBKDF2_ITERATIONS = 1000000
PBKDF2_KEY_SIZE = 32
PBKDF2_DIGEST = 'SHA512'

# Derive the key from password
derived_key = PBKDF2(
    password.encode('utf-8'),
    b'salt',
    dkLen=PBKDF2_KEY_SIZE,
    count=PBKDF2_ITERATIONS,
    hmac_hash_module=__import__('Crypto.Hash.SHA512').Hash.SHA512
)

# Decrypt the key (AES-256-CBC)
iv = encrypted_key[:16]
ciphertext = encrypted_key[16:]

cipher = AES.new(derived_key, AES.MODE_CBC, iv)
decrypted = cipher.decrypt(ciphertext)

# Remove PKCS7 padding
padding_length = decrypted[-1]
decrypted = decrypted[:-padding_length]

# Output as hex (ONLY output - no extra text)
print(decrypted.hex())
EOF
