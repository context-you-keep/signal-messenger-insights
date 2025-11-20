"""FastAPI application entry point."""
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Signal Archive Viewer",
    description="Local-only Signal Desktop archive viewer",
    version="0.1.0",
)

# CORS middleware for development (only allow localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8000",  # Production
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Serve static frontend files (in production)
static_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
if static_path.exists():
    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")
    logger.info(f"Serving static files from {static_path}")
else:
    logger.warning(f"Static files not found at {static_path}. Frontend will not be served.")


@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info("Signal Archive Viewer starting up...")
    logger.info("Application ready. Navigate to http://localhost:8000")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Signal Archive Viewer shutting down...")
    # Clean up any open database connections
    from app.api.routes import _database, _decryptor

    if _database:
        _database.close()
    if _decryptor:
        _decryptor.cleanup()
