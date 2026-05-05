"""
Model loader service for managing ML models.
"""
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import joblib

from app.config import settings

logger = logging.getLogger(__name__)


class ModelLoader:
    """Manages loading and accessing ML models."""

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.model_info: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    def load_all(self):
        """Load all models from the model path."""
        model_path = Path(settings.model_path)

        if not model_path.exists():
            logger.warning(f"Model path does not exist: {model_path}")
            logger.info("Running in demo mode without trained models")
            self._loaded = True
            return

        # Load risk scorer
        self._load_model(
            name="risk_scorer",
            filename=settings.risk_scorer_file,
            model_path=model_path
        )

        # Load feature encoder
        self._load_model(
            name="feature_encoder",
            filename=settings.feature_encoder_file,
            model_path=model_path
        )

        # Load field-specific suggesters
        for file in model_path.glob("suggester_*.pkl"):
            field_name = file.stem.replace("suggester_", "")
            self._load_model(
                name=f"suggester_{field_name}",
                filename=file.name,
                model_path=model_path
            )

        self._loaded = True
        logger.info(f"Loaded {len(self.models)} models")

    def _load_model(self, name: str, filename: str, model_path: Path):
        """Load a single model file."""
        file_path = model_path / filename

        if not file_path.exists():
            logger.debug(f"Model file not found: {file_path}")
            return

        try:
            model = joblib.load(file_path)
            self.models[name] = model
            self.model_info[name] = {
                "version": getattr(model, "version", "1.0.0"),
                "healthy": True,
                "path": str(file_path)
            }
            logger.info(f"Loaded model: {name}")
        except Exception as e:
            logger.error(f"Failed to load model {name}: {e}")
            self.model_info[name] = {
                "version": "unknown",
                "healthy": False,
                "error": str(e)
            }

    def get(self, name: str) -> Optional[Any]:
        """Get a loaded model by name."""
        return self.models.get(name)

    def get_suggester(self, field_name: str) -> Optional[Any]:
        """Get a field-specific suggester model."""
        return self.models.get(f"suggester_{field_name}")

    def all_loaded(self) -> bool:
        """Check if all critical models are loaded."""
        return self._loaded

    def get_models_info(self) -> Dict[str, Any]:
        """Get information about loaded models."""
        return self.model_info.copy()


# Global model loader instance
model_loader = ModelLoader()
