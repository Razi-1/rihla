import logging
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)

_model = None
MODEL_PATH = Path(__file__).parent.parent.parent / "data" / "models" / "ranking_model.pkl"


def load_model():
    global _model
    if _model is not None:
        return _model
    if MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        logger.info("Ranking model loaded from %s", MODEL_PATH)
        return _model
    logger.warning("No ranking model found at %s", MODEL_PATH)
    return None


def score_tutor(features: dict) -> float:
    """Score a tutor using the ranking model. Returns 0-1 score."""
    model = load_model()
    if model is None:
        return 0.5

    try:
        import numpy as np

        feature_vector = np.array([
            features.get("reliability_score", 0.5),
            features.get("sentiment_score", 0.5),
            features.get("review_count", 0),
            features.get("sessions_completed", 0),
            features.get("average_rating", 3.0),
            features.get("cancellation_rate", 0.0),
        ]).reshape(1, -1)

        score = float(model.predict(feature_vector)[0])
        return max(0.0, min(1.0, score))
    except Exception as e:
        logger.error("Ranking prediction failed: %s", e)
        return 0.5


def confidence_weight(score: float, count: int, threshold: int) -> float:
    """Apply confidence weighting per spec: dampen toward 0.5 below threshold."""
    confidence = min(1.0, count / threshold)
    return 0.5 + (score - 0.5) * confidence
