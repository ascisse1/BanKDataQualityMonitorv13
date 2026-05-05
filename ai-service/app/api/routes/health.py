"""
Health check endpoints.
"""
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.services.model_loader import model_loader

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    models_loaded: bool
    timestamp: str
    models: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns service status and loaded models information.
    """
    try:
        models_info = model_loader.get_models_info()
        all_loaded = model_loader.all_loaded()

        return HealthResponse(
            status="healthy" if all_loaded else "degraded",
            models_loaded=all_loaded,
            timestamp=datetime.utcnow().isoformat(),
            models=models_info
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            models_loaded=False,
            timestamp=datetime.utcnow().isoformat(),
            error=str(e)
        )


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes probes.
    """
    if model_loader.all_loaded():
        return {"ready": True}
    return {"ready": False, "reason": "Models not loaded"}


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes probes.
    """
    return {"alive": True}
