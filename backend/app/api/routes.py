"""API route handlers."""
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.crypto.signal import SignalDecryptor
from app.db.queries import SignalDatabase
from app.models.schemas import (
    ConversationSummary,
    Message,
    MessagesResponse,
    SearchRequest,
    StatusResponse,
    UploadResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Global state (in a production app, use dependency injection)
_decryptor: Optional[SignalDecryptor] = None
_database: Optional[SignalDatabase] = None
_mode: Optional[str] = None


@router.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get application initialization status."""
    initialized = _database is not None
    conversation_count = _database.get_conversation_count() if initialized else None

    return StatusResponse(
        initialized=initialized,
        mode=_mode,
        conversation_count=conversation_count,
    )


@router.post("/api/logout")
async def logout():
    """Reset application state - clear loaded database and config."""
    global _database, _decryptor, _mode

    # Close database connection if open
    if _database:
        try:
            _database.close()
        except Exception as e:
            logger.warning(f"Error closing database during logout: {e}")

    # Reset global state
    _database = None
    _decryptor = None
    _mode = None

    logger.info("Application state reset successfully")
    return {"message": "Logged out successfully", "initialized": False}


@router.get("/api/default-signal-path")
async def get_default_signal_path():
    """Get the default Signal directory path for the current OS."""
    import platform
    from pathlib import Path

    system = platform.system()
    home = Path.home()

    if system == "Linux":
        default_path = home / ".config" / "Signal"
        display_path = "$HOME/.config/Signal"
    elif system == "Darwin":  # macOS
        default_path = home / "Library" / "Application Support" / "Signal"
        display_path = "$HOME/Library/Application Support/Signal"
    elif system == "Windows":
        # Use APPDATA environment variable
        import os
        appdata = os.getenv("APPDATA")
        if appdata:
            default_path = Path(appdata) / "Signal"
        else:
            default_path = home / "AppData" / "Roaming" / "Signal"
        display_path = "%APPDATA%\\Signal"
    else:
        # Unknown OS, return None
        return {"path": None, "os": system}

    return {
        "path": display_path,
        "os": system,
        "exists": default_path.exists()
    }


@router.post("/api/upload", response_model=UploadResponse)
async def upload_files(
    config: UploadFile = File(..., description="Signal config.json file"),
    database: UploadFile = File(..., description="Encrypted db.sqlite file"),
):
    """
    Upload Signal config.json and encrypted database.

    This endpoint handles the upload mode where users upload files via the browser.
    """
    global _decryptor, _database, _mode

    try:
        # Clean up any existing state
        if _decryptor:
            _decryptor.cleanup()
        if _database:
            _database.close()

        # Read uploaded files
        config_content = await config.read()
        db_content = await database.read()

        # Create temporary files
        import tempfile

        temp_dir = tempfile.mkdtemp(prefix="signal_upload_")
        config_path = Path(temp_dir) / "config.json"
        db_path = Path(temp_dir) / "db.sqlite"

        config_path.write_bytes(config_content)
        db_path.write_bytes(db_content)

        # Initialize decryptor and decrypt database
        _decryptor = SignalDecryptor()
        _decryptor.load_config(config_path)

        conn = _decryptor.decrypt_database(db_path, in_memory=True)
        _database = SignalDatabase(conn)
        _mode = "upload"

        conversation_count = _database.get_conversation_count()

        logger.info(f"Successfully initialized from uploaded files. Found {conversation_count} conversations.")

        return UploadResponse(
            success=True,
            message=f"Successfully loaded Signal database with {conversation_count} conversations",
            conversation_count=conversation_count,
        )

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded files: {str(e)}")


@router.post("/api/init-volume")
async def init_from_volume(signal_path: str = "/signal"):
    """
    Initialize from a mounted Signal directory.

    This endpoint handles volume mount mode where Signal directory is mounted.
    """
    global _decryptor, _database, _mode

    try:
        # Clean up any existing state
        if _decryptor:
            _decryptor.cleanup()
        if _database:
            _database.close()

        signal_dir = Path(signal_path)
        config_path = signal_dir / "config.json"
        db_path = signal_dir / "sql" / "db.sqlite"

        if not config_path.exists():
            raise HTTPException(status_code=404, detail=f"config.json not found at {config_path}")

        if not db_path.exists():
            raise HTTPException(status_code=404, detail=f"db.sqlite not found at {db_path}")

        # Initialize decryptor and decrypt database
        _decryptor = SignalDecryptor()
        _decryptor.load_config(config_path)

        conn = _decryptor.decrypt_database(db_path, in_memory=True)
        _database = SignalDatabase(conn)
        _mode = "volume"

        conversation_count = _database.get_conversation_count()

        logger.info(f"Successfully initialized from volume. Found {conversation_count} conversations.")

        return UploadResponse(
            success=True,
            message=f"Successfully loaded Signal database with {conversation_count} conversations",
            conversation_count=conversation_count,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Volume init failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize from volume: {str(e)}")


@router.get("/api/conversations", response_model=list[ConversationSummary])
async def get_conversations(limit: int = 100):
    """Get list of all conversations."""
    if not _database:
        raise HTTPException(status_code=503, detail="Database not initialized. Upload files or initialize from volume first.")

    return _database.get_conversations(limit=limit)


@router.get("/api/conversations/{conversation_id}/messages", response_model=MessagesResponse)
async def get_messages(conversation_id: str, page: int = 1, page_size: int = 100):
    """Get messages for a specific conversation."""
    if not _database:
        raise HTTPException(status_code=503, detail="Database not initialized")

    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be >= 1")

    if page_size < 1 or page_size > 500:
        raise HTTPException(status_code=400, detail="Page size must be between 1 and 500")

    return _database.get_messages(conversation_id, page=page, page_size=page_size)


@router.post("/api/search", response_model=list[Message])
async def search_messages(search: SearchRequest):
    """Search messages across conversations."""
    if not _database:
        raise HTTPException(status_code=503, detail="Database not initialized")

    return _database.search_messages(
        query=search.query,
        conversation_id=search.conversation_id,
        limit=search.limit,
    )


@router.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
