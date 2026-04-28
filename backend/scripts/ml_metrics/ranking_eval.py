"""Evaluate the scikit-learn tutor ranking model.

Loads the trained model from data/models/ranking_model.pkl if it exists;
otherwise trains a new GradientBoostingRegressor from synthetic data.

Features (6): reliability_score, sentiment_score, review_count,
              sessions_completed, average_rating, cancellation_rate
Target:       composite quality score 0-1

Metrics produced
----------------
Regression: MAE, MSE, RMSE, R², Adjusted R², Explained Variance, Max Error, MAPE

Graphs produced
---------------
1. Feature importance bar chart
2. Predicted vs Actual scatter plot
3. Residual distribution histogram
4. Residuals vs Predicted scatter
5. Learning curve
6. Cross-validation score distribution
7. Partial dependence plots
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import joblib
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import (
    cross_val_score,
    learning_curve,
    train_test_split,
)
from sklearn.metrics import (
    explained_variance_score,
    max_error,
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "ranking"

FEATURE_NAMES = [
    "reliability_score",
    "sentiment_score",
    "review_count",
    "sessions_completed",
    "average_rating",
    "cancellation_rate",
]

SEED = 42
N_SAMPLES = 600


def _generate_data(n: int = N_SAMPLES, seed: int = SEED):
    rng = np.random.default_rng(seed)

    reliability = rng.beta(5, 1.5, n)
    sentiment = rng.beta(4, 2, n)
    review_count = rng.poisson(8, n).clip(0, 60).astype(float)
    sessions_completed = rng.poisson(25, n).clip(0, 200).astype(float)
    average_rating = rng.normal(3.8, 0.7, n).clip(1.0, 5.0)
    cancellation_rate = rng.beta(1.2, 8, n)

    X = np.column_stack([
        reliability, sentiment, review_count,
        sessions_completed, average_rating, cancellation_rate,
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


PKL_PATH = Path(__file__).parent.parent.parent / "data" / "models" / "ranking_model.pkl"


def run(output_dir: Path | None = None) -> dict:
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    X, y = _generate_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED
    )

    loaded_pkl = False
    if PKL_PATH.exists():
        try:
            model = joblib.load(PKL_PATH)
            loaded_pkl = True
            print(f"  Loaded trained model from {PKL_PATH}")
        except Exception as e:
            print(f"  Failed to load pkl ({e}), training fresh model")
            loaded_pkl = False

    if not loaded_pkl:
        model = GradientBoostingRegressor(
            n_estimators=200, max_depth=4, learning_rate=0.1,
            subsample=0.8, min_samples_leaf=5, random_state=SEED,
        )
        model.fit(X_train, y_train)
        print("  Trained fresh GradientBoostingRegressor")

    y_pred = np.clip(model.predict(X_test), 0.0, 1.0)
    y_pred_train = np.clip(model.predict(X_train), 0.0, 1.0)

    metrics = {}
    metrics["model_source"] = "ranking_model.pkl" if loaded_pkl else "freshly_trained"
    metrics["production_usage"] = "ACTIVE — used by search_service via score_tutor()"
    metrics["mae"] = mean_absolute_error(y_test, y_pred)
    metrics["mse"] = mean_squared_error(y_test, y_pred)
    metrics["rmse"] = np.sqrt(metrics["mse"])
    metrics["r2"] = r2_score(y_test, y_pred)
    n, p = len(y_test), X_test.shape[1]
    metrics["adjusted_r2"] = 1 - (1 - metrics["r2"]) * (n - 1) / (n - p - 1)
    metrics["explained_variance"] = explained_variance_score(y_test, y_pred)
    metrics["max_error"] = max_error(y_test, y_pred)
    metrics["mape"] = mean_absolute_percentage_error(y_test, y_pred)
    metrics["train_r2"] = r2_score(y_train, y_pred_train)
    metrics["train_mae"] = mean_absolute_error(y_train, y_pred_train)

    cv_r2 = cross_val_score(model, X, y, cv=5, scoring="r2")
    cv_mae = -cross_val_score(model, X, y, cv=5, scoring="neg_mean_absolute_error")
    cv_rmse = np.sqrt(-cross_val_score(model, X, y, cv=5, scoring="neg_mean_squared_error"))
    metrics["cv_r2_mean"] = cv_r2.mean()
    metrics["cv_r2_std"] = cv_r2.std()
    metrics["cv_mae_mean"] = cv_mae.mean()
    metrics["cv_mae_std"] = cv_mae.std()
    metrics["cv_rmse_mean"] = cv_rmse.mean()
    metrics["cv_rmse_std"] = cv_rmse.std()
    metrics["cv_r2_scores"] = cv_r2.tolist()

    importances = model.feature_importances_
    metrics["feature_importances"] = {
        name: float(imp) for name, imp in zip(FEATURE_NAMES, importances)
    }

    residuals = y_test - y_pred
    metrics["residual_mean"] = float(residuals.mean())
    metrics["residual_std"] = float(residuals.std())
    metrics["residual_skew"] = float(
        np.mean(((residuals - residuals.mean()) / residuals.std()) ** 3)
    )

    print("\n  === Ranking Model Metrics ===")
    print(f"  Train size: {len(X_train)}, Test size: {len(X_test)}")
    print(f"  MAE:                {metrics['mae']:.6f}")
    print(f"  MSE:                {metrics['mse']:.6f}")
    print(f"  RMSE:               {metrics['rmse']:.6f}")
    print(f"  R²:                 {metrics['r2']:.6f}")
    print(f"  Adjusted R²:        {metrics['adjusted_r2']:.6f}")
    print(f"  Explained Variance: {metrics['explained_variance']:.6f}")
    print(f"  Max Error:          {metrics['max_error']:.6f}")
    print(f"  MAPE:               {metrics['mape']:.4%}")
    print(f"  Train R²:           {metrics['train_r2']:.6f}")
    print(f"  Train MAE:          {metrics['train_mae']:.6f}")
    print(f"\n  5-Fold CV R²:  {metrics['cv_r2_mean']:.4f} ± {metrics['cv_r2_std']:.4f}")
    print(f"  5-Fold CV MAE: {metrics['cv_mae_mean']:.4f} ± {metrics['cv_mae_std']:.4f}")
    print(f"  5-Fold CV RMSE:{metrics['cv_rmse_mean']:.4f} ± {metrics['cv_rmse_std']:.4f}")
    print(f"\n  Feature Importances:")
    for name, imp in sorted(metrics["feature_importances"].items(), key=lambda x: -x[1]):
        print(f"    {name:25s} {imp:.4f}")
    print(f"\n  Residuals: mean={metrics['residual_mean']:.6f}, std={metrics['residual_std']:.6f}, skew={metrics['residual_skew']:.4f}")

    _plot_feature_importance(importances, out)
    _plot_predicted_vs_actual(y_test, y_pred, metrics["r2"], out)
    _plot_residual_distribution(residuals, out)
    _plot_residuals_vs_predicted(y_pred, residuals, out)
    _plot_learning_curve(model, X, y, out)
    _plot_cv_scores(cv_r2, cv_mae, cv_rmse, out)
    _plot_partial_dependence(model, X_train, out)

    return metrics


def _plot_feature_importance(importances, out: Path):
    sorted_idx = np.argsort(importances)
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.barh(
        [FEATURE_NAMES[i] for i in sorted_idx],
        importances[sorted_idx],
        color="#2E75B6", edgecolor="white",
    )
    for bar, val in zip(bars, importances[sorted_idx]):
        ax.text(bar.get_width() + 0.005, bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}", va="center", fontsize=10)
    ax.set_xlabel("Feature Importance", fontsize=12)
    ax.set_title("Ranking Model — Feature Importances", fontsize=13, fontweight="bold")
    ax.grid(alpha=0.3, axis="x")
    fig.tight_layout()
    fig.savefig(out / "ranking_feature_importance.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_feature_importance.png'}")


def _plot_predicted_vs_actual(y_true, y_pred, r2, out: Path):
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(y_true, y_pred, alpha=0.5, s=20, color="#2E75B6", edgecolors="white", linewidth=0.3)
    lims = [min(y_true.min(), y_pred.min()) - 0.02, max(y_true.max(), y_pred.max()) + 0.02]
    ax.plot(lims, lims, "--", color="#F04438", lw=1.5, label="Perfect prediction")
    ax.set_xlabel("Actual Quality Score", fontsize=12)
    ax.set_ylabel("Predicted Quality Score", fontsize=12)
    ax.set_title(f"Ranking — Predicted vs Actual (R² = {r2:.4f})", fontsize=13, fontweight="bold")
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_aspect("equal")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "ranking_predicted_vs_actual.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_predicted_vs_actual.png'}")


def _plot_residual_distribution(residuals, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(residuals, bins=30, color="#1F6099", alpha=0.7, edgecolor="white")
    ax.axvline(x=0, color="#F04438", lw=1.5, linestyle="--")
    ax.set_xlabel("Residual (Actual − Predicted)", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("Ranking Model — Residual Distribution", fontsize=13, fontweight="bold")
    ax.text(
        0.95, 0.95,
        f"μ = {residuals.mean():.4f}\nσ = {residuals.std():.4f}",
        transform=ax.transAxes, ha="right", va="top",
        fontsize=10, bbox=dict(boxstyle="round", facecolor="white", alpha=0.8),
    )
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "ranking_residual_distribution.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_residual_distribution.png'}")


def _plot_residuals_vs_predicted(y_pred, residuals, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.scatter(y_pred, residuals, alpha=0.5, s=20, color="#2E75B6", edgecolors="white", linewidth=0.3)
    ax.axhline(y=0, color="#F04438", lw=1.5, linestyle="--")
    ax.set_xlabel("Predicted Quality Score", fontsize=12)
    ax.set_ylabel("Residual", fontsize=12)
    ax.set_title("Ranking — Residuals vs Predicted", fontsize=13, fontweight="bold")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "ranking_residuals_vs_predicted.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_residuals_vs_predicted.png'}")


def _plot_learning_curve(model, X, y, out: Path):
    train_sizes, train_scores, test_scores = learning_curve(
        model, X, y, cv=5,
        train_sizes=np.linspace(0.1, 1.0, 10),
        scoring="r2", random_state=SEED, n_jobs=1,
    )
    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    test_mean = test_scores.mean(axis=1)
    test_std = test_scores.std(axis=1)

    fig, ax = plt.subplots(figsize=(7, 5))
    ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.15, color="#2E75B6")
    ax.fill_between(train_sizes, test_mean - test_std, test_mean + test_std, alpha=0.15, color="#12B76A")
    ax.plot(train_sizes, train_mean, "o-", color="#2E75B6", lw=2, label="Training R²")
    ax.plot(train_sizes, test_mean, "o-", color="#12B76A", lw=2, label="Validation R²")
    ax.set_xlabel("Training Set Size", fontsize=12)
    ax.set_ylabel("R² Score", fontsize=12)
    ax.set_title("Ranking Model — Learning Curve", fontsize=13, fontweight="bold")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "ranking_learning_curve.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_learning_curve.png'}")


def _plot_cv_scores(cv_r2, cv_mae, cv_rmse, out: Path):
    fig, axes = plt.subplots(1, 3, figsize=(14, 5))
    labels_data = [
        ("R²", cv_r2, "#2E75B6"),
        ("MAE", cv_mae, "#F79009"),
        ("RMSE", cv_rmse, "#F04438"),
    ]
    for ax, (label, data, color) in zip(axes, labels_data):
        bp = ax.boxplot([data], widths=0.4, patch_artist=True)
        bp["boxes"][0].set_facecolor(color)
        bp["boxes"][0].set_alpha(0.6)
        ax.scatter(np.ones(len(data)), data, color=color, s=40, zorder=3)
        ax.set_title(f"CV {label}", fontsize=12, fontweight="bold")
        ax.set_ylabel(label, fontsize=11)
        ax.set_xticklabels(["5-Fold"])
        ax.text(
            0.5, 0.02,
            f"{data.mean():.4f} ± {data.std():.4f}",
            transform=ax.transAxes, ha="center", fontsize=10,
        )
        ax.grid(alpha=0.3, axis="y")

    fig.suptitle("Ranking Model — Cross-Validation Scores", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "ranking_cv_scores.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_cv_scores.png'}")


def _plot_partial_dependence(model, X_train, out: Path):
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    axes = axes.ravel()

    for i, (ax, name) in enumerate(zip(axes, FEATURE_NAMES)):
        x_range = np.linspace(X_train[:, i].min(), X_train[:, i].max(), 50)
        X_copy = np.tile(X_train.mean(axis=0), (50, 1))
        X_copy[:, i] = x_range
        y_partial = model.predict(X_copy)
        ax.plot(x_range, y_partial, color="#2E75B6", lw=2)
        ax.set_xlabel(name, fontsize=10)
        ax.set_ylabel("Predicted Score", fontsize=10)
        ax.set_title(name, fontsize=11, fontweight="bold")
        ax.grid(alpha=0.3)

    fig.suptitle("Ranking Model — Partial Dependence", fontsize=14, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "ranking_partial_dependence.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ranking_partial_dependence.png'}")


if __name__ == "__main__":
    run()
