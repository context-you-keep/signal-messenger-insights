#!/bin/bash
# Extract Signal Desktop Database Key
# Run this script ON the system where Signal Desktop is installed

set -e

SIGNAL_DIR="$HOME/.config/Signal"
CONFIG_FILE="$SIGNAL_DIR/config.json"

echo "=========================================="
echo "Signal Desktop Key Extractor"
echo "=========================================="
echo ""

# Check if Signal config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Signal config not found at $CONFIG_FILE"
    echo ""
    echo "Make sure Signal Desktop is installed and you've logged in at least once."
    exit 1
fi

echo "📁 Found Signal config: $CONFIG_FILE"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed"
    echo ""
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt install jq"
    echo "  Fedora/RHEL:   sudo dnf install jq"
    echo "  Arch:          sudo pacman -S jq"
    echo "  macOS:         brew install jq"
    exit 1
fi

# Check if config already has plain 'key' field
if jq -e '.key' "$CONFIG_FILE" &> /dev/null; then
    echo "✅ Your config.json already has a plain 'key' field!"
    echo ""
    KEY=$(jq -r '.key' "$CONFIG_FILE")
    echo "🔑 Database Key: $KEY"
    echo ""
    echo "You can use this config.json directly with the Signal Archive Viewer."
    exit 0
fi

# Check if config has encryptedKey
if ! jq -e '.encryptedKey' "$CONFIG_FILE" &> /dev/null; then
    echo "❌ Error: No 'key' or 'encryptedKey' found in config.json"
    echo ""
    echo "Your config.json might be corrupted or in an unexpected format."
    exit 1
fi

echo "🔐 Found encryptedKey field - attempting to decrypt..."
echo ""

# Check if secret-tool is available
if ! command -v secret-tool &> /dev/null; then
    echo "❌ Error: secret-tool is required but not installed"
    echo ""
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt install libsecret-tools"
    echo "  Fedora/RHEL:   sudo dnf install libsecret"
    echo "  Arch:          sudo pacman -S libsecret"
    exit 1
fi

# Try to get the password from keyring
echo "🔓 Attempting to retrieve encryption password from system keyring..."
echo ""

if ! ENCRYPTION_PASSWORD=$(secret-tool lookup application Signal 2>/dev/null); then
    echo "❌ Error: Could not retrieve Signal encryption password from keyring"
    echo ""
    echo "This usually means:"
    echo "  1. Signal Desktop hasn't been run on this system"
    echo "  2. You're running as a different user than the one who runs Signal"
    echo "  3. The keyring is locked"
    echo ""
    echo "Try:"
    echo "  1. Open Signal Desktop and make sure it's unlocked"
    echo "  2. Run this script as the same user who runs Signal Desktop"
    exit 1
fi

echo "✅ Retrieved encryption password from keyring"
echo ""

# Extract the encryptedKey
ENCRYPTED_KEY=$(jq -r '.encryptedKey' "$CONFIG_FILE")

# Check if pycryptodome is installed
echo "🔍 Checking Python dependencies..."
echo ""

if ! python3 -c "import Crypto" 2>/dev/null; then
    echo "❌ Error: pycryptodome is required but not installed"
    echo ""
    echo "Install it with:"
    echo "  pip install pycryptodome"
    echo ""
    echo "Or if you prefer:"
    echo "  pip3 install --user pycryptodome"
    echo "  python3 -m pip install pycryptodome"
    exit 1
fi

echo "✅ Python dependencies found"
echo ""

# Decrypt using Python
echo "🔐 Decrypting database key..."
echo ""

DECRYPTED_KEY=$(python3 - "$ENCRYPTED_KEY" "$ENCRYPTION_PASSWORD" <<'EOF'
import sys
import base64
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2

encrypted_key_b64 = sys.argv[1]
password = sys.argv[2]

# Decode the encrypted key
encrypted_key = base64.b64decode(encrypted_key_b64)

# Signal's key derivation parameters
PBKDF2_ITERATIONS = 1000000
PBKDF2_KEY_SIZE = 32
PBKDF2_DIGEST = 'SHA512'

# Derive the key from password
derived_key = PBKDF2(
    password.encode('utf-8'),
    b'salt',  # Signal uses a hardcoded salt
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

# Output as hex
print(decrypted.hex())
EOF
)

if [ -z "$DECRYPTED_KEY" ]; then
    echo "❌ Error: Failed to decrypt the database key"
    exit 1
fi

echo "✅ Successfully decrypted database key!"
echo ""
echo "=========================================="
echo "🔑 Your Signal Database Key:"
echo "=========================================="
echo ""
echo "$DECRYPTED_KEY"
echo ""
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Create a new config.json file with this content:"
echo ""
echo '{'
echo "  \"key\": \"$DECRYPTED_KEY\""
echo '}'
echo ""
echo "2. Copy this config.json and your db.sqlite to the system running Signal Archive Viewer"
echo ""
echo "3. Upload both files through the web interface"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "   This key can decrypt your entire Signal message history!"
echo "   Keep it secure and never share it."
echo ""
