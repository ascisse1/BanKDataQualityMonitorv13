"""
Correction suggestion service.

Provides ML-based or pattern-based correction suggestions.
"""
import re
import logging
from typing import Dict, Any, List, Optional

from app.services.model_loader import model_loader
from app.config import settings

logger = logging.getLogger(__name__)


class Suggester:
    """Correction suggestion service."""

    # Common correction patterns by field type
    PATTERNS = {
        "telephone": [
            # Add country code for Senegal
            (r'^0(\d{9})$', r'+221\1', "Add country code +221"),
            (r'^(\d{9})$', r'+221\1', "Add country code +221"),
            # Fix common formatting
            (r'^00221(\d+)$', r'+221\1', "Fix country code format"),
        ],
        "email": [
            # Complete common domains
            (r'^(.+)@gmail$', r'\1@gmail.com', "Complete domain"),
            (r'^(.+)@yahoo$', r'\1@yahoo.com', "Complete domain"),
            (r'^(.+)@hotmail$', r'\1@hotmail.com', "Complete domain"),
            # Add @ if missing
            (r'^([^@]+)(gmail|yahoo|hotmail)\.com$', r'\1@\2.com', "Add @ symbol"),
        ],
        "nom": [
            # Uppercase
            (r'^(.+)$', lambda m: m.group(1).upper(), "Convert to uppercase"),
        ],
        "prenom": [
            # Title case
            (r'^(.+)$', lambda m: m.group(1).title(), "Convert to title case"),
        ],
    }

    def suggest(self, field_name: str,
                current_value: Optional[str],
                error_type: Optional[str] = None,
                client_type: Optional[str] = None,
                expected_value: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate correction suggestion.

        Args:
            field_name: Name of the field
            current_value: Current (incorrect) value
            error_type: Type of error (REQUIRED, FORMAT, etc.)
            client_type: Type of client
            expected_value: Description of expected value

        Returns:
            Dictionary with suggestion details
        """
        if current_value is None or current_value.strip() == "":
            return self._handle_missing_value(field_name, expected_value)

        # Try ML model first
        model = model_loader.get_suggester(field_name)
        if model is not None:
            return self._suggest_with_model(
                model, field_name, current_value, error_type, client_type
            )

        # Fall back to pattern-based suggestions
        return self._suggest_pattern_based(
            field_name, current_value, error_type, expected_value
        )

    def _suggest_with_model(self, model, field_name: str,
                            current_value: str, error_type: Optional[str],
                            client_type: Optional[str]) -> Dict[str, Any]:
        """Generate suggestion using trained ML model."""
        try:
            # Use model to predict correction
            # Implementation depends on your model architecture
            prediction = model.predict([current_value])[0]
            confidence = getattr(model, "predict_proba", lambda x: [[0.8]])(
                [current_value]
            )[0][0]

            return {
                "value": prediction,
                "confidence": float(confidence),
                "source": "ML_MODEL",
                "alternatives": [],
                "explanation": f"ML model suggestion for {field_name}",
                "model_version": getattr(model, "version", "1.0.0")
            }
        except Exception as e:
            logger.error(f"ML suggestion failed: {e}")
            return self._suggest_pattern_based(
                field_name, current_value, error_type, None
            )

    def _suggest_pattern_based(self, field_name: str,
                                current_value: str,
                                error_type: Optional[str],
                                expected_value: Optional[str]) -> Dict[str, Any]:
        """Generate suggestion using pattern matching."""
        alternatives: List[Dict[str, Any]] = []

        # Check field-specific patterns
        patterns = self.PATTERNS.get(field_name, [])
        for pattern, replacement, explanation in patterns:
            try:
                if callable(replacement):
                    match = re.match(pattern, current_value, re.IGNORECASE)
                    if match:
                        suggested = replacement(match)
                        if suggested != current_value:
                            alternatives.append({
                                "value": suggested,
                                "confidence": 0.7,
                                "explanation": explanation
                            })
                else:
                    suggested = re.sub(pattern, replacement, current_value, flags=re.IGNORECASE)
                    if suggested != current_value:
                        alternatives.append({
                            "value": suggested,
                            "confidence": 0.7,
                            "explanation": explanation
                        })
            except Exception as e:
                logger.debug(f"Pattern matching error: {e}")

        # Generic transformations
        if field_name in ["nom", "raison_sociale"]:
            upper = current_value.upper()
            if upper != current_value:
                alternatives.append({
                    "value": upper,
                    "confidence": 0.8,
                    "explanation": "Convert to uppercase"
                })

        # Sort by confidence
        alternatives.sort(key=lambda x: x["confidence"], reverse=True)

        if alternatives:
            best = alternatives[0]
            return {
                "value": best["value"],
                "confidence": best["confidence"],
                "source": "PATTERN_BASED",
                "alternatives": [
                    {"value": a["value"], "confidence": a["confidence"]}
                    for a in alternatives[1:settings.max_alternatives]
                ],
                "explanation": best["explanation"],
                "model_version": "pattern-1.0"
            }

        return {
            "value": None,
            "confidence": 0,
            "source": "NONE",
            "alternatives": [],
            "explanation": "No suggestion available",
            "model_version": "pattern-1.0"
        }

    def _handle_missing_value(self, field_name: str,
                               expected_value: Optional[str]) -> Dict[str, Any]:
        """Handle missing value case."""
        return {
            "value": None,
            "confidence": 0,
            "source": "NONE",
            "alternatives": [],
            "explanation": f"Missing value for {field_name}. "
                           f"Expected: {expected_value or 'valid value'}",
            "model_version": "pattern-1.0"
        }


# Global suggester instance
suggester = Suggester()
