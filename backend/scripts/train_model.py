#!/usr/bin/env python3
"""Train the scikit-learn tutor ranking model from synthetic data.

Specified in IMPLEMENTATION_PLAN.md but never created. This script generates
realistic synthetic tutor feature vectors, derives a quality target from a
known formula, trains a GradientBoostingRegressor, and serializes it to
backend/data/models/ranking_model.pkl for use by app.ml.ranking.score_tutor().
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

MODEL_DIR = Path(__file__).parent.parent / "data" / "models"
MODEL_PATH = MODEL_DIR / "ranking_model.pkl"
SEED = 42
N_SAMPLES = 600

FEATURE_NAMES = [
    "reliability_score",
    "sentiment_score",
    "review_count",
    "sessions_completed",
    "average_rating",
    "cancellation_rate",
]


def generate_synthetic_data(n: int = N_SAMPLES, seed: int = SEED):
    """Generate synthetic tutor feature vectors with realistic distributions."""
    rng = np.random.default_rng(seed)

    reliability = rng.beta(5, 1.5, n)
    sentiment = rng.beta(4, 2, n)
    review_count = rng.poisson(8, n).clip(0, 60)
    sessions_completed = rng.poisson(25, n).clip(0, 200)
    average_rating = rng.normal(3.8, 0.7, n).clip(1.0, 5.0)
    cancellation_rate = rng.beta(1.2, 8, n)

    X = np.column_stack([
        reliability,
        sentiment,
        review_count,
        sessions_completed,
        average_rating,
        cancellation_rate,
    ])

    y = (
        0.30 * (average_rating / 5.0)
        + 0.25 * sentiment
        + 0.20 * reliability
        + 0.10 * np.minimum(1.0, review_count / 15.0)
        + 0.10 * np.minimum(1.0, sessions_completed / 50.0)
        - 0.12 * cancellation_rate
        + rng.normal(0, 0.03, n)
    ).clip(0.0, 1.0)

    return X, y


def main():
    print("=== Training Tutor Ranking Model ===\n")

    X, y = generate_synthetic_data()
    print(f"Generated {len(X)} synthetic tutor profiles")
    print(f"Features: {FEATURE_NAMES}")
    print(f"Target range: [{y.min():.4f}, {y.max():.4f}], mean={y.mean():.4f}\n")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED
    )

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        min_samples_leaf=5,
        random_state=SEED,
    )

    print("Training GradientBoostingRegressor ...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0.0, 1.0)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print(f"\n--- Test Set Metrics (n={len(X_test)}) ---")
    print(f"  MAE  = {mae:.6f}")
    print(f"  MSE  = {mse:.6f}")
    print(f"  RMSE = {rmse:.6f}")
    print(f"  R²   = {r2:.6f}")

    cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
    print(f"\n--- 5-Fold Cross-Validation R² ---")
    print(f"  Scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"  Mean:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    importances = model.feature_importances_
    print(f"\n--- Feature Importances ---")
    for name, imp in sorted(
        zip(FEATURE_NAMES, importances), key=lambda x: -x[1]
    ):
        print(f"  {name:25s} {imp:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
