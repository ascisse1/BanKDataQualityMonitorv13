"""
Correction suggestion endpoints.
"""
import time
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.suggester import suggester

router = APIRouter()
logger = logging.getLogger(__name__)


class SuggestionRequest(BaseModel):
    """Request for correction suggestion."""
    anomaly_id: Optional[int] = Field(None, alias="anomalyId")
    field_name: str = Field(..., alias="fieldName")
    current_value: Optional[str] = Field(None, alias="currentValue")
    error_type: Optional[str] = Field(None, alias="errorType")
    client_type: Optional[str] = Field(None, alias="clientType")
    expected_value: Optional[str] = Field(None, alias="expectedValue")

    class Config:
        populate_by_name = True


class SuggestionAlternative(BaseModel):
    """Alternative suggestion."""
    value: str
    confidence: float


class SuggestionResponse(BaseModel):
    """Response with correction suggestion."""
    anomaly_id: Optional[int] = Field(None, alias="anomalyId")
    suggested_value: Optional[str] = Field(None, alias="suggestedValue")
    confidence: float
    confidence_level: str = Field(..., alias="confidenceLevel")
    source: str
    alternatives: List[SuggestionAlternative] = []
    explanation: Optional[str] = None
    model_version: str = Field(..., alias="modelVersion")
    generated_at: str = Field(..., alias="generatedAt")

    class Config:
        populate_by_name = True


class BulkSuggestionRequest(BaseModel):
    """Request for bulk suggestions."""
    anomaly_ids: List[int] = Field(..., alias="anomalyIds")

    class Config:
        populate_by_name = True


class BulkSuggestionItem(BaseModel):
    """Single item in bulk suggestion response."""
    anomaly_id: int = Field(..., alias="anomalyId")
    suggested_value: Optional[str] = Field(None, alias="suggestedValue")
    confidence: float
    source: str
    reason: Optional[str] = None

    class Config:
        populate_by_name = True


class BulkSuggestionResponse(BaseModel):
    """Response for bulk suggestions."""
    suggestions: List[BulkSuggestionItem]
    processing_time_ms: int = Field(..., alias="processingTimeMs")

    class Config:
        populate_by_name = True


def get_confidence_level(confidence: float) -> str:
    """Determine confidence level from numeric score."""
    if confidence >= 0.8:
        return "HIGH"
    elif confidence >= 0.5:
        return "MEDIUM"
    return "LOW"


@router.post("", response_model=SuggestionResponse)
async def suggest_correction(request: SuggestionRequest):
    """
    Generate correction suggestion for an anomaly.

    Analyzes the current value and error type to suggest corrections.
    """
    try:
        # Get suggestion from service
        result = suggester.suggest(
            field_name=request.field_name,
            current_value=request.current_value,
            error_type=request.error_type,
            client_type=request.client_type,
            expected_value=request.expected_value
        )

        return SuggestionResponse(
            anomalyId=request.anomaly_id,
            suggestedValue=result.get("value"),
            confidence=result.get("confidence", 0),
            confidenceLevel=get_confidence_level(result.get("confidence", 0)),
            source=result.get("source", "PATTERN_BASED"),
            alternatives=[
                SuggestionAlternative(
                    value=alt["value"],
                    confidence=alt["confidence"]
                )
                for alt in result.get("alternatives", [])
            ],
            explanation=result.get("explanation"),
            modelVersion=result.get("model_version", "1.0.0"),
            generatedAt=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Error generating suggestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=BulkSuggestionResponse)
async def bulk_suggestions(request: BulkSuggestionRequest):
    """
    Generate suggestions for multiple anomalies.
    Note: This is a placeholder - actual implementation would need anomaly data.
    """
    start_time = time.time()

    # Placeholder response
    suggestions = [
        BulkSuggestionItem(
            anomalyId=anomaly_id,
            suggestedValue=None,
            confidence=0,
            source="NONE",
            reason="Bulk suggestions require anomaly data"
        )
        for anomaly_id in request.anomaly_ids
    ]

    processing_time = int((time.time() - start_time) * 1000)

    return BulkSuggestionResponse(
        suggestions=suggestions,
        processingTimeMs=processing_time
    )
