"""
Risk scoring service.

Provides ML-based risk scoring for records.
When no trained model is available, uses heuristic scoring.
"""
import re
import logging
from typing import Dict, Any, List, Optional

from app.services.model_loader import model_loader
from app.config import settings

logger = logging.getLogger(__name__)


class RiskScorer:
    """Risk scoring service using ML or heuristics."""

    # Common placeholder patterns that indicate bad data
    PLACEHOLDER_PATTERNS = [
        r'^[Xx]+$',           # XXX, xxx
        r'^[0]+$',            # 000
        r'^N/?A$',            # N/A, NA
        r'^\?+$',             # ???
        r'^INCONNU$',         # INCONNU
        r'^TEST',             # TEST...
        r'^DUMMY',            # DUMMY...
    ]

    # Fields that are critical and contribute more to risk
    CRITICAL_FIELDS = {
        'num_id': 0.3,
        'nom': 0.2,
        'prenom': 0.15,
        'telephone': 0.15,
        'email': 0.1,
        'adresse': 0.1,
    }

    def score(self, fields: Dict[str, Any],
              client_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Score a record for anomaly risk.

        Args:
            fields: Record field values
            client_type: Type of client (INDIVIDUAL, CORPORATE, etc.)

        Returns:
            Dictionary with score, confidence, factors, and model version
        """
        # Try ML model first
        model = model_loader.get("risk_scorer")
        if model is not None:
            return self._score_with_model(model, fields, client_type)

        # Fall back to heuristic scoring
        return self._score_heuristic(fields, client_type)

    def _score_with_model(self, model, fields: Dict[str, Any],
                          client_type: Optional[str]) -> Dict[str, Any]:
        """Score using trained ML model."""
        try:
            # Extract features
            features = self._extract_features(fields, client_type)

            # Predict
            score = model.predict_proba([features])[0][1]

            # Get feature importances if available
            factors = self._get_feature_factors(model, features, fields)

            return {
                "score": float(score),
                "confidence": 0.9,
                "factors": factors,
                "model_version": getattr(model, "version", "1.0.0")
            }
        except Exception as e:
            logger.error(f"ML scoring failed, falling back to heuristic: {e}")
            return self._score_heuristic(fields, client_type)

    def _score_heuristic(self, fields: Dict[str, Any],
                         client_type: Optional[str]) -> Dict[str, Any]:
        """
        Score using heuristic rules.
        This is used when no ML model is available.
        """
        factors: List[Dict[str, Any]] = []
        total_risk = 0.0
        total_weight = 0.0

        for field_name, value in fields.items():
            weight = self.CRITICAL_FIELDS.get(field_name, 0.05)
            total_weight += weight

            # Check for missing values
            if value is None or str(value).strip() == "":
                risk = 0.8
                factors.append({
                    "field": field_name,
                    "reason": "Missing value",
                    "contribution": risk * weight
                })
                total_risk += risk * weight
                continue

            str_value = str(value)

            # Check for placeholder patterns
            for pattern in self.PLACEHOLDER_PATTERNS:
                if re.match(pattern, str_value, re.IGNORECASE):
                    risk = 0.9
                    factors.append({
                        "field": field_name,
                        "reason": "Placeholder value detected",
                        "contribution": risk * weight
                    })
                    total_risk += risk * weight
                    break
            else:
                # Check value quality
                risk = self._assess_value_quality(field_name, str_value)
                if risk > 0.3:
                    factors.append({
                        "field": field_name,
                        "reason": "Suspicious value pattern",
                        "contribution": risk * weight
                    })
                total_risk += risk * weight

        # Normalize score
        final_score = min(total_risk / max(total_weight, 0.01), 1.0)

        # Sort factors by contribution
        factors.sort(key=lambda x: x["contribution"], reverse=True)

        return {
            "score": final_score,
            "confidence": 0.7,  # Lower confidence for heuristic
            "factors": factors[:5],
            "model_version": "heuristic-1.0"
        }

    def _assess_value_quality(self, field_name: str, value: str) -> float:
        """Assess quality of a field value."""
        risk = 0.0

        # Too short
        if len(value) < 2:
            risk += 0.3

        # All same character
        if len(set(value)) == 1:
            risk += 0.4

        # Field-specific checks
        if field_name == "email" and "@" not in value:
            risk += 0.5
        elif field_name == "telephone":
            digits = re.sub(r'\D', '', value)
            if len(digits) < 8:
                risk += 0.4
        elif field_name == "num_id":
            if len(value) < 5:
                risk += 0.5

        return min(risk, 1.0)

    def _extract_features(self, fields: Dict[str, Any],
                          client_type: Optional[str]) -> List[float]:
        """Extract ML features from fields."""
        # Placeholder - implement based on your model's expected features
        features = []

        # Field completeness
        total_fields = len(fields)
        non_empty = sum(1 for v in fields.values()
                        if v is not None and str(v).strip() != "")
        features.append(non_empty / max(total_fields, 1))

        # Add more features as needed
        return features

    def _get_feature_factors(self, model, features: List[float],
                             fields: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get feature importance factors from model."""
        factors = []

        # Try to get feature importances
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            field_names = list(fields.keys())

            for i, importance in enumerate(importances):
                if i < len(field_names) and importance > 0.05:
                    factors.append({
                        "field": field_names[i],
                        "reason": "Model feature importance",
                        "contribution": float(importance)
                    })

        factors.sort(key=lambda x: x["contribution"], reverse=True)
        return factors[:5]


# Global risk scorer instance
risk_scorer = RiskScorer()
