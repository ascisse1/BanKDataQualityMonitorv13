"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    debug: bool = False

    # Models
    model_path: str = "./models"
    risk_scorer_file: str = "risk_scorer.pkl"
    feature_encoder_file: str = "feature_encoder.pkl"

    # Risk Scoring
    risk_threshold_low: float = 0.3
    risk_threshold_medium: float = 0.6
    risk_threshold_high: float = 0.8

    # Suggestions
    min_confidence_threshold: float = 0.5
    max_alternatives: int = 3

    # Clustering
    cluster_min_samples: int = 5
    cluster_eps: float = 0.3

    # Logging
    log_level: str = "INFO"

    # Cache TTL (seconds)
    cache_ttl: int = 3600

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
