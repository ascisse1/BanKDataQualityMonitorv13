"""
AI Detection ML Service - Main Application.

FastAPI application providing ML inference endpoints for:
- Risk scoring
- Correction suggestions
- Anomaly clustering
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import health, scoring, suggestions
from app.services.model_loader import model_loader

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    logger.info("Starting AI Detection ML Service...")
    model_loader.load_all()
    logger.info("Models loaded successfully")
    yield
    # Shutdown
    logger.info("Shutting down AI Detection ML Service...")


# Create FastAPI application
app = FastAPI(
    title="AI Detection ML Service",
    description="Machine learning service for bank data quality anomaly detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(scoring.router, prefix="/score", tags=["Risk Scoring"])
app.include_router(suggestions.router, prefix="/suggest", tags=["Suggestions"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AI Detection ML Service",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
