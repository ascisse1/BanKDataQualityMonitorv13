"""
Risk scoring endpoints.
"""
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.risk_scorer import risk_scorer
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class RecordData(BaseModel):
    """Input record for risk scoring."""
    client_number: str = Field(..., alias="clientNumber")
    fields: Dict[str, Any]
    client_type: Optional[str] = Field(None, alias="clientType")
    structure_code: Optional[str] = Field(None, alias="structureCode")

    class Config:
        populate_by_name = True


class RiskFactor(BaseModel):
    """Risk factor contributing to score."""
    field: str
    reason: str
    contribution: float


class RiskScoreDto(BaseModel):
    """Risk score for a single record."""
    client_number: str = Field(..., alias="clientNumber")
    risk_score: float = Field(..., alias="riskScore")
    confidence: float
    risk_level: str = Field(..., alias="riskLevel")
    top_risk_factors: List[RiskFactor] = Field(..., alias="topRiskFactors")
    model_version: str = Field(..., alias="modelVersion")
    computed_at: str = Field(..., alias="computedAt")

    class Config:
        populate_by_name = True


class ScoringRequest(BaseModel):
    """Request body for risk scoring."""
    records: List[RecordData]


class ScoringResponse(BaseModel):
    """Response for risk scoring."""
    scores: List[RiskScoreDto]
    processing_time_ms: int = Field(..., alias="processingTimeMs")

    class Config:
        populate_by_name = True


def get_risk_level(score: float) -> str:
    """Determine risk level from numeric score."""
    if score >= settings.risk_threshold_high:
        return "CRITICAL"
    elif score >= settings.risk_threshold_medium:
        return "HIGH"
    elif score >= settings.risk_threshold_low:
        return "MEDIUM"
    return "LOW"


@router.post("", response_model=ScoringResponse)
async def score_records(request: ScoringRequest):
    """
    Score records for anomaly risk.

    Analyzes input records and returns risk scores with contributing factors.
    """
    start_time = time.time()

    try:
        scores = []
        for record in request.records:
            # Score the record
            result = risk_scorer.score(record.fields, record.client_type)

            # Build response
            score_dto = RiskScoreDto(
                clientNumber=record.client_number,
                riskScore=result["score"],
                confidence=result["confidence"],
                riskLevel=get_risk_level(result["score"]),
                topRiskFactors=[
                    RiskFactor(
                        field=f["field"],
                        reason=f["reason"],
                        contribution=f["contribution"]
                    )
                    for f in result.get("factors", [])[:5]  # Top 5 factors
                ],
                modelVersion=result.get("model_version", "1.0.0"),
                computedAt=datetime.utcnow().isoformat()
            )
            scores.append(score_dto)

        processing_time = int((time.time() - start_time) * 1000)

        return ScoringResponse(
            scores=scores,
            processingTimeMs=processing_time
        )

    except Exception as e:
        logger.error(f"Error scoring records: {e}")
        raise HTTPException(status_code=500, detail=str(e))
