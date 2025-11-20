"""Signal Desktop database decryption utilities."""
import base64
import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

# Use pysqlcipher3 for SQLCipher-encrypted database support
# Standard sqlite3 module does NOT support SQLCipher encryption
try:
    from pysqlcipher3 import dbapi2 as sqlite3
except ImportError:
    # Fallback to standard sqlite3 (will fail on encrypted databases)
    import sqlite3
    logging.warning(
        "pysqlcipher3 not available - encrypted database decryption will fail. "
        "Install with: pip install pysqlcipher3"
    )

# Import cryptography modules for decrypting encryptedKey from keyring
try:
    from Crypto.Cipher import AES
    from Crypto.Hash import SHA1
    from Crypto.Protocol.KDF import PBKDF2
    from Crypto.Util.Padding import unpad
except ImportError:
    logging.warning(
        "pycryptodome not available - keyring decryption will fail. "
        "Install with: pip install pycryptodome"
    )

logger = logging.getLogger(__name__)


class SignalDatabaseError(Exception):
    """Raised when Signal database operations fail."""

    pass


class SignalDecryptor:
    """Handles decryption of Signal Desktop databases."""

    def __init__(self):
        self.encryption_key: Optional[bytes] = None
        self.decrypted_db_path: Optional[Path] = None
        self._temp_dir: Optional[tempfile.TemporaryDirectory] = None

    def load_config(self, config_path: Path) -> None:
        """
        Load and parse Signal's config.json to extract the encryption key.
        Supports both old format (plain 'key') and new format ('encryptedKey' with keychain).

        Args:
            config_path: Path to Signal's config.json file

        Raises:
            SignalDatabaseError: If config is invalid or key cannot be extracted
        """
        try:
            with open(config_path, "r") as f:
                config = json.load(f)

            # Try old format first (plain hex key)
            key_hex = config.get("key")
            if key_hex:
                # Clean and validate the key
                key_hex = key_hex.strip()

                # Validate it's hex
                if not all(c in '0123456789abcdefABCDEF' for c in key_hex):
                    raise SignalDatabaseError(
                        f"Invalid key format: key must be a hexadecimal string (0-9, a-f). "
                        f"Found invalid character at position 0. "
                        f"Make sure you copied only the key value without quotes or extra whitespace. "
                        f"Key should be 64 hex characters long. Current length: {len(key_hex)}"
                    )

                # Should be 64 characters (32 bytes)
                if len(key_hex) != 64:
                    raise SignalDatabaseError(
                        f"Invalid key length: expected 64 hex characters, got {len(key_hex)}. "
                        f"Make sure you copied the complete key."
                    )

                # The key is a hex string - convert to bytes
                self.encryption_key = bytes.fromhex(key_hex)
                logger.info("Successfully extracted encryption key from config.json (old format)")
                return

            # Try new format (encryptedKey + system keychain)
            encrypted_key = config.get("encryptedKey")
            safe_storage_backend = config.get("safeStorageBackend")

            if encrypted_key and safe_storage_backend:
                logger.info(f"Detected new config format with {safe_storage_backend}")
                self.encryption_key = self._decrypt_encrypted_key(
                    encrypted_key, safe_storage_backend
                )
                logger.info("Successfully decrypted encryption key from keyring")
                return

            # Neither format found
            raise SignalDatabaseError(
                "No 'key' or 'encryptedKey' field found in config.json. "
                "This may not be a valid Signal Desktop config file."
            )

        except json.JSONDecodeError as e:
            raise SignalDatabaseError(f"Invalid JSON in config.json: {e}")
        except SignalDatabaseError:
            raise
        except Exception as e:
            raise SignalDatabaseError(f"Failed to load config: {e}")

    def _decrypt_encrypted_key(self, encrypted_key_hex: str, backend: str) -> bytes:
        """
        Decrypt the encryptedKey from config.json using the password from system keyring.

        This implements Chromium's key encryption scheme used by Signal Desktop:
        1. Get password from keyring (base64 string)
        2. Derive AES key using PBKDF2-HMAC-SHA1 with salt 'saltysalt'
        3. Decrypt encryptedKey using AES-CBC
        4. Result is an ASCII hex string representing the database key

        Args:
            encrypted_key_hex: The hex-encoded encrypted key from config.json (with v11 prefix)
            backend: The safe storage backend (gnome_libsecret, kwallet, etc.)

        Returns:
            The decrypted database encryption key as bytes

        Raises:
            SignalDatabaseError: If decryption fails
        """
        try:
            # Step 1: Get password from system keyring
            if backend == "gnome_libsecret":
                result = subprocess.run(
                    ["secret-tool", "lookup", "application", "Signal"],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                password = result.stdout.strip()
                if not password:
                    raise SignalDatabaseError("Empty password returned from keyring")
            else:
                raise SignalDatabaseError(
                    f"Unsupported safe storage backend: {backend}. "
                    f"Currently only 'gnome_libsecret' is supported."
                )

            # Step 2: Derive AES key using Chromium's parameters
            # CRITICAL: Use password AS STRING (not base64-decoded) and SHA1 hash
            salt = b'saltysalt'
            iterations = 1
            aes_key = PBKDF2(
                password,  # Use password string directly!
                salt=salt,
                dkLen=16,  # 128 bits
                count=iterations,
                hmac_hash_module=SHA1  # MUST use SHA1!
            )

            # Step 3: Decrypt the encrypted key
            encrypted_key_bytes = bytes.fromhex(encrypted_key_hex)

            # Skip the v11 prefix (3 bytes)
            if not encrypted_key_bytes.startswith(b'v11'):
                raise SignalDatabaseError("Encrypted key missing v11 prefix")
            encrypted_data = encrypted_key_bytes[3:]

            # Decrypt using AES-CBC
            iv = b' ' * 16  # 16 spaces
            cipher = AES.new(aes_key, AES.MODE_CBC, iv)
            decrypted = cipher.decrypt(encrypted_data)

            # Remove PKCS7 padding and decode as ASCII hex string
            database_key_hex = unpad(decrypted, block_size=16).decode('ascii')

            # Convert hex string to bytes
            database_key = bytes.fromhex(database_key_hex)
            logger.info(f"Successfully decrypted database key ({len(database_key)} bytes)")

            return database_key

        except subprocess.CalledProcessError as e:
            raise SignalDatabaseError(
                f"Failed to get password from {backend}: {e.stderr or e}. "
                "\n\n"
                "❌ Docker containers cannot access your system keyring.\n"
                "Signal Desktop encrypts the database key using your system keyring (GNOME Keyring, KWallet, etc.),\n"
                "which is isolated from Docker containers for security.\n"
                "\n"
                "✅ SOLUTION:\n"
                "1. On your Signal Desktop system, run: ./extract-signal-key.sh\n"
                "2. Install dependencies if needed: pip install pycryptodome\n"
                "3. Create a config.json with the extracted key:\n"
                '   {"key": "your-extracted-key-here"}\n'
                "4. Upload the new config.json with your db.sqlite\n"
                "\n"
                "📖 See QUICK-START.md for detailed instructions."
            )
        except ValueError as e:
            raise SignalDatabaseError(f"Failed to decrypt key: {e}")
        except Exception as e:
            raise SignalDatabaseError(f"Unexpected error during key decryption: {e}")

    def decrypt_database(self, encrypted_db_path: Path, in_memory: bool = True) -> sqlite3.Connection:
        """
        Decrypt Signal's encrypted SQLite database.

        Args:
            encrypted_db_path: Path to the encrypted db.sqlite file
            in_memory: If True, decrypt to in-memory DB; otherwise use temp file

        Returns:
            SQLite connection to the decrypted database

        Raises:
            SignalDatabaseError: If decryption fails
        """
        if not self.encryption_key:
            raise SignalDatabaseError("Encryption key not loaded. Call load_config() first.")

        try:
            # SQLCipher uses PRAGMA to set the encryption key
            # Signal Desktop uses SQLCipher 4.x with specific settings
            encrypted_conn = sqlite3.connect(f"file:{encrypted_db_path}?mode=ro", uri=True)

            # Set SQLCipher key (hex-encoded)
            key_hex = self.encryption_key.hex()
            encrypted_conn.execute(f"PRAGMA key = \"x'{key_hex}'\"")

            # Signal Desktop SQLCipher settings
            encrypted_conn.execute("PRAGMA cipher_page_size = 4096")
            encrypted_conn.execute("PRAGMA kdf_iter = 64000")
            encrypted_conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512")
            encrypted_conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512")

            # Test if decryption worked by querying sqlite_master
            cursor = encrypted_conn.execute("SELECT count(*) FROM sqlite_master")
            cursor.fetchone()

            if in_memory:
                # pysqlcipher3.iterdump() fails when trying to introspect FTS tables
                # with custom tokenizers. Instead, we'll work directly with the
                # encrypted database without copying it.
                logger.info("Using encrypted database directly (no copy needed)")
                logger.info("Note: FTS search will not work, but message browsing will")

                # Just return the encrypted connection - it's already decrypted
                # and we can query it directly
                return encrypted_conn
            else:
                # Create a temporary file for the decrypted database
                logger.info("Decrypting database to temporary file")
                self._temp_dir = tempfile.TemporaryDirectory(prefix="signal_archive_")
                temp_db_path = Path(self._temp_dir.name) / "decrypted.db"

                # Use SQL export/import since backup() isn't supported
                logger.info("Using SQL export/import for decryption")

                # Create the temp database and import everything
                temp_conn = sqlite3.connect(temp_db_path)

                # Export from encrypted DB
                line_count = 0
                replaced_count = 0
                for line in encrypted_conn.iterdump():
                    line_count += 1

                    if line.startswith('BEGIN TRANSACTION') or line.startswith('COMMIT'):
                        continue

                    # Replace Signal's custom tokenizer with standard unicode61
                    if 'signal_tokenizer' in line:
                        replaced_count += 1
                        logger.info(f"Line {line_count}: Replacing signal_tokenizer with unicode61")
                        logger.info(f"Original SQL: {line[:200]}")
                        # Handle various spacing patterns around the = sign
                        import re
                        line = re.sub(r"tokenize\s*=\s*['\"]signal_tokenizer['\"]",
                                     "tokenize='unicode61'",
                                     line,
                                     flags=re.IGNORECASE)
                        logger.info(f"Modified SQL: {line[:200]}")

                    try:
                        temp_conn.execute(line)
                    except sqlite3.OperationalError as e:
                        logger.error(f"Line {line_count}: SQL execution failed: {e}")
                        logger.error(f"Failed SQL: {line[:200]}")
                        if 'tokenizer' in str(e).lower():
                            logger.error("TOKENIZER ERROR DETECTED - this line should have been replaced!")
                            logger.error(f"Full line: {line}")

                logger.info(f"Processed {line_count} SQL lines, replaced {replaced_count} tokenizer references")

                temp_conn.commit()
                encrypted_conn.close()

                self.decrypted_db_path = temp_db_path
                return temp_conn

        except sqlite3.DatabaseError as e:
            logger.error(f"DatabaseError during decryption: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise SignalDatabaseError(
                f"Failed to decrypt database. Ensure the database and key are correct: {e}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during decryption: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise SignalDatabaseError(f"Unexpected error during decryption: {e}")

    def cleanup(self):
        """Clean up temporary files."""
        if self._temp_dir:
            self._temp_dir.cleanup()
            self._temp_dir = None
            self.decrypted_db_path = None
            logger.info("Cleaned up temporary decrypted database")


def extract_key_from_config(config_content: str) -> bytes:
    """
    Extract and decode the encryption key from Signal config JSON string.

    Args:
        config_content: JSON string content from config.json

    Returns:
        Decoded encryption key bytes

    Raises:
        SignalDatabaseError: If key cannot be extracted
    """
    try:
        config = json.loads(config_content)
        key_hex = config.get("key")
        if not key_hex:
            raise SignalDatabaseError("No 'key' field found in config.json")
        # Key is a hex string, convert to bytes
        return bytes.fromhex(key_hex)
    except json.JSONDecodeError as e:
        raise SignalDatabaseError(f"Invalid JSON: {e}")
    except ValueError as e:
        raise SignalDatabaseError(f"Invalid key format (expected hex string): {e}")
    except Exception as e:
        raise SignalDatabaseError(f"Failed to extract key: {e}")
