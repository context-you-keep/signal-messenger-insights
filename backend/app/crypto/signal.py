"""Signal Desktop database decryption utilities."""
import base64
import json
import logging
import os
import sqlite3
import tempfile
from pathlib import Path
from typing import Optional

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

        Args:
            config_path: Path to Signal's config.json file

        Raises:
            SignalDatabaseError: If config is invalid or key cannot be extracted
        """
        try:
            with open(config_path, "r") as f:
                config = json.load(f)

            # Signal stores the key as base64-encoded string
            key_b64 = config.get("key")
            if not key_b64:
                raise SignalDatabaseError("No 'key' field found in config.json")

            # Decode the base64 key
            self.encryption_key = base64.b64decode(key_b64)
            logger.info("Successfully extracted encryption key from config.json")

        except json.JSONDecodeError as e:
            raise SignalDatabaseError(f"Invalid JSON in config.json: {e}")
        except Exception as e:
            raise SignalDatabaseError(f"Failed to load config: {e}")

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
                # Copy to in-memory database
                logger.info("Decrypting database to in-memory SQLite")
                memory_conn = sqlite3.connect(":memory:")
                encrypted_conn.backup(memory_conn)
                encrypted_conn.close()
                return memory_conn
            else:
                # Create a temporary file for the decrypted database
                logger.info("Decrypting database to temporary file")
                self._temp_dir = tempfile.TemporaryDirectory(prefix="signal_archive_")
                temp_db_path = Path(self._temp_dir.name) / "decrypted.db"

                # Create unencrypted copy
                temp_conn = sqlite3.connect(temp_db_path)
                encrypted_conn.backup(temp_conn)
                encrypted_conn.close()

                self.decrypted_db_path = temp_db_path
                return temp_conn

        except sqlite3.DatabaseError as e:
            raise SignalDatabaseError(
                f"Failed to decrypt database. Ensure the database and key are correct: {e}"
            )
        except Exception as e:
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
        key_b64 = config.get("key")
        if not key_b64:
            raise SignalDatabaseError("No 'key' field found in config.json")
        return base64.b64decode(key_b64)
    except json.JSONDecodeError as e:
        raise SignalDatabaseError(f"Invalid JSON: {e}")
    except Exception as e:
        raise SignalDatabaseError(f"Failed to extract key: {e}")
