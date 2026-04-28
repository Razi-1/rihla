"""Evaluate the tutor reliability scoring system.

Reliability scoring (app.ml.reliability) is deterministic feature engineering,
not a trained model. This module generates synthetic session histories,
computes reliability features, and analyses the distributions, correlations,
and confidence-weighting behaviour.

Metrics produced
----------------
Distribution: mean, std, median, min, max, Q1, Q3, IQR, skewness, kurtosis
Correlation:  Pearson r between all feature pairs
Confidence:   dampening curve analysis

Graphs produced
---------------
1. Reliability score distribution
2. All feature distributions (multi-panel)
3. Feature correlation heatmap
4. Confidence-weighting effect curve
5. Box plots for all features
6. Cancellation rate vs reliability scatter
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats as sp_stats

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "reliability"

SEED = 42
N_TUTORS = 200

FEATURE_COLS = [
    "reliability_score",
    "cancellation_rate",
    "sessions_per_week",
    "total_students",
    "total_completed",
    "sessions_total",
]


def _generate_synthetic_sessions(n_tutors: int = N_TUTORS, seed: int = SEED):
    """Simulate session histories and compute reliability features."""
    rng = np.random.default_rng(seed)

    records = []
    for _ in range(n_tutors):
        total = rng.poisson(30) + 1
        cancel_prob = rng.beta(1.5, 8)
        cancelled = rng.binomial(total, cancel_prob)
        completed = total - cancelled

        cancellation_rate = cancelled / total
        reliability = max(0.0, 1.0 - cancellation_rate)

        weeks = 26
        sessions_per_week = completed / weeks
        total_students = max(1, int(rng.poisson(8)))

        records.append({
            "reliability_score": reliability,
            "cancellation_rate": cancellation_rate,
            "sessions_per_week": sessions_per_week,
            "total_students": total_students,
            "total_completed": completed,
            "sessions_total": total,
        })

    return pd.DataFrame(records)


def run(output_dir: Path | None = None) -> dict:
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    df = _generate_synthetic_sessions()
    metrics: dict = {}

    # --- Distribution statistics for each feature ---
    for col in FEATURE_COLS:
        vals = df[col].values
        m = {
            "mean": float(vals.mean()),
            "std": float(vals.std()),
            "median": float(np.median(vals)),
            "min": float(vals.min()),
            "max": float(vals.max()),
            "q1": float(np.percentile(vals, 25)),
            "q3": float(np.percentile(vals, 75)),
            "iqr": float(np.percentile(vals, 75) - np.percentile(vals, 25)),
            "skewness": float(sp_stats.skew(vals)),
            "kurtosis": float(sp_stats.kurtosis(vals)),
        }
        metrics[col] = m

    # --- Correlation matrix ---
    corr_matrix = df[FEATURE_COLS].corr()
    metrics["correlation_matrix"] = corr_matrix.to_dict()

    # --- Confidence weighting analysis ---
    session_counts = np.arange(0, 51)
    threshold = 20
    raw_score = 0.85
    weighted = [0.5 + (raw_score - 0.5) * min(1.0, c / threshold) for c in session_counts]
    metrics["confidence_weighting"] = {
        "threshold": threshold,
        "example_raw_score": raw_score,
        "weighted_at_0_sessions": weighted[0],
        "weighted_at_10_sessions": weighted[10],
        "weighted_at_20_sessions": weighted[20],
        "weighted_at_50_sessions": weighted[50],
    }

    # --- Print ---
    print("\n  === Reliability Scoring Metrics ===")
    print(f"  Synthetic tutors: {len(df)}")
    for col in FEATURE_COLS:
        m = metrics[col]
        print(f"\n  {col}:")
        print(f"    mean={m['mean']:.4f}, std={m['std']:.4f}, median={m['median']:.4f}")
        print(f"    range=[{m['min']:.4f}, {m['max']:.4f}], IQR={m['iqr']:.4f}")
        print(f"    skewness={m['skewness']:.4f}, kurtosis={m['kurtosis']:.4f}")

    print("\n  Confidence Weighting (threshold=20, raw_score=0.85):")
    cw = metrics["confidence_weighting"]
    print(f"    0 sessions  -> {cw['weighted_at_0_sessions']:.4f} (fully dampened to 0.5)")
    print(f"    10 sessions -> {cw['weighted_at_10_sessions']:.4f}")
    print(f"    20 sessions -> {cw['weighted_at_20_sessions']:.4f} (full weight)")
    print(f"    50 sessions -> {cw['weighted_at_50_sessions']:.4f}")

    # --- Graphs ---
    _plot_reliability_distribution(df, out)
    _plot_feature_distributions(df, out)
    _plot_correlation_heatmap(corr_matrix, out)
    _plot_confidence_weighting(out)
    _plot_boxplots(df, out)
    _plot_cancellation_vs_reliability(df, out)

    return metrics


def _plot_reliability_distribution(df, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(df["reliability_score"], bins=25, color="#2E75B6", alpha=0.75, edgecolor="white")
    ax.axvline(x=df["reliability_score"].mean(), color="#F04438", lw=2, linestyle="--",
               label=f"Mean = {df['reliability_score'].mean():.3f}")
    ax.axvline(x=df["reliability_score"].median(), color="#F79009", lw=2, linestyle=":",
               label=f"Median = {df['reliability_score'].median():.3f}")
    ax.set_xlabel("Reliability Score", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("Reliability Score Distribution", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "reliability_score_distribution.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_score_distribution.png'}")


def _plot_feature_distributions(df, out: Path):
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    axes = axes.ravel()
    colors = ["#2E75B6", "#F04438", "#12B76A", "#F79009", "#1F6099", "#344054"]

    for ax, col, color in zip(axes, FEATURE_COLS, colors):
        ax.hist(df[col], bins=20, color=color, alpha=0.7, edgecolor="white")
        ax.set_title(col.replace("_", " ").title(), fontsize=11, fontweight="bold")
        ax.set_ylabel("Count", fontsize=10)
        ax.grid(alpha=0.3, axis="y")
        mean_val = df[col].mean()
        ax.axvline(x=mean_val, color="#191C20", lw=1.5, linestyle="--", alpha=0.7)

    fig.suptitle("Reliability Features — Distributions", fontsize=14, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "reliability_feature_distributions.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_feature_distributions.png'}")


def _plot_correlation_heatmap(corr, out: Path):
    fig, ax = plt.subplots(figsize=(8, 7))
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
    labels = [c.replace("_", "\n") for c in corr.columns]
    sns.heatmap(
        corr, mask=mask, annot=True, fmt=".3f", cmap="RdBu_r",
        center=0, vmin=-1, vmax=1, square=True,
        xticklabels=labels, yticklabels=labels, ax=ax,
        cbar_kws={"label": "Pearson r", "shrink": 0.8},
    )
    ax.set_title("Reliability Features — Correlation Matrix", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "reliability_correlation_heatmap.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_correlation_heatmap.png'}")


def _plot_confidence_weighting(out: Path):
    counts = np.arange(0, 61)
    thresholds = [10, 20, 30]
    raw_scores = [0.9, 0.7, 0.3]

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    ax = axes[0]
    for thresh in thresholds:
        weighted = [0.5 + (0.85 - 0.5) * min(1.0, c / thresh) for c in counts]
        ax.plot(counts, weighted, lw=2, label=f"threshold = {thresh}")
    ax.axhline(y=0.85, color="#999", lw=1, linestyle=":", alpha=0.6, label="Raw score (0.85)")
    ax.axhline(y=0.5, color="#999", lw=1, linestyle="--", alpha=0.4, label="Neutral (0.5)")
    ax.set_xlabel("Session / Review Count", fontsize=12)
    ax.set_ylabel("Effective Score", fontsize=12)
    ax.set_title("Confidence Weighting — Threshold Effect", fontsize=12, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(alpha=0.3)

    ax = axes[1]
    for raw in raw_scores:
        weighted = [0.5 + (raw - 0.5) * min(1.0, c / 20) for c in counts]
        ax.plot(counts, weighted, lw=2, label=f"raw = {raw}")
    ax.axhline(y=0.5, color="#999", lw=1, linestyle="--", alpha=0.4)
    ax.set_xlabel("Session / Review Count", fontsize=12)
    ax.set_ylabel("Effective Score", fontsize=12)
    ax.set_title("Confidence Weighting — Score Effect (threshold=20)", fontsize=12, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(alpha=0.3)

    fig.suptitle("Confidence-Weighted ML Scoring (Spec §7.4)", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "reliability_confidence_weighting.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_confidence_weighting.png'}")


def _plot_boxplots(df, out: Path):
    fig, ax = plt.subplots(figsize=(10, 6))
    cols_norm = ["reliability_score", "cancellation_rate", "sessions_per_week"]
    df_norm = df[cols_norm].copy()
    for c in cols_norm:
        r = df_norm[c].max() - df_norm[c].min()
        if r > 0:
            df_norm[c] = (df_norm[c] - df_norm[c].min()) / r

    bp = ax.boxplot(
        [df_norm[c].values for c in cols_norm],
        labels=[c.replace("_", "\n") for c in cols_norm],
        patch_artist=True, widths=0.5,
    )
    colors = ["#2E75B6", "#F04438", "#12B76A"]
    for patch, color in zip(bp["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)

    ax.set_ylabel("Normalized Value (0-1)", fontsize=12)
    ax.set_title("Reliability Features — Box Plots (Normalized)", fontsize=13, fontweight="bold")
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "reliability_boxplots.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_boxplots.png'}")


def _plot_cancellation_vs_reliability(df, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    sc = ax.scatter(
        df["cancellation_rate"], df["reliability_score"],
        c=df["total_completed"], cmap="viridis", s=30, alpha=0.7, edgecolors="white", linewidth=0.3,
    )
    plt.colorbar(sc, ax=ax, label="Sessions Completed")
    x = np.linspace(0, 1, 50)
    ax.plot(x, 1 - x, "--", color="#F04438", lw=1.5, label="Theoretical: 1 − rate")
    ax.set_xlabel("Cancellation Rate", fontsize=12)
    ax.set_ylabel("Reliability Score", fontsize=12)
    ax.set_title("Cancellation Rate vs Reliability Score", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "reliability_cancellation_vs_score.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'reliability_cancellation_vs_score.png'}")


if __name__ == "__main__":
    run()
