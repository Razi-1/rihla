"""Evaluate the composite tutor ranking pipeline from search_service.py.

The search service uses a two-stage ranking pipeline:

  1. score_tutor(features) -- sklearn GradientBoosting model -> raw 0-1 score
  2. confidence_weight(raw_score, review_count, 15) -- dampen toward 0.5
     for tutors with few reviews

Features (6): reliability_score, sentiment_score, review_count,
              sessions_completed, average_rating, cancellation_rate

Metrics produced
----------------
Pipeline Analysis:  raw vs dampened score comparison, dampening magnitude
Sensitivity:        rank Kendall-tau under +/-20% input feature perturbation
Discrimination:     score spread, effective range utilisation
Ranking Quality:    NDCG@K (dampened vs raw model ordering)
Confidence Effect:  dampening impact by review count bracket

Graphs produced
---------------
1. Raw vs dampened score scatter (coloured by review count)
2. Dampening effect by review count bracket
3. Feature sensitivity analysis (rank perturbation)
4. Score distribution histogram (raw vs dampened)
5. NDCG@K curve
6. Rank stability heatmap under feature perturbation
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
from scipy.stats import kendalltau, spearmanr

from app.ml.ranking import score_tutor, confidence_weight

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "composite_ranking"

SEED = 42
N_TUTORS = 100

FEATURE_NAMES = [
    "reliability_score",
    "sentiment_score",
    "review_count",
    "sessions_completed",
    "average_rating",
    "cancellation_rate",
]

CONFIDENCE_THRESHOLD = 15


def _generate_tutors(n: int = N_TUTORS, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n):
        rows.append({
            "tutor_id": i,
            "reliability_score": float(rng.beta(5, 1.5)),
            "sentiment_score": float(rng.beta(4, 2)),
            "review_count": int(np.clip(rng.poisson(8), 0, 50)),
            "sessions_completed": int(np.clip(rng.poisson(25), 0, 200)),
            "average_rating": float(np.clip(rng.normal(3.8, 0.8), 1.0, 5.0)),
            "cancellation_rate": float(rng.beta(1.2, 8)),
        })
    return pd.DataFrame(rows)


def _compute_pipeline_score(row: dict) -> tuple[float, float]:
    """Return (raw_model_score, dampened_score)."""
    features = {k: row[k] for k in FEATURE_NAMES}
    raw = score_tutor(features)
    dampened = confidence_weight(raw, row["review_count"], CONFIDENCE_THRESHOLD)
    return raw, dampened


def _dcg(relevances: np.ndarray) -> float:
    return np.sum(relevances / np.log2(np.arange(2, len(relevances) + 2)))


def _ndcg_at_k(ideal_order: np.ndarray, predicted_order: np.ndarray, k: int) -> float:
    ideal_dcg = _dcg(ideal_order[:k])
    if ideal_dcg == 0:
        return 1.0
    return _dcg(predicted_order[:k]) / ideal_dcg


def run(output_dir: Path | None = None) -> dict:
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    df = _generate_tutors()

    raw_scores = []
    dampened_scores = []
    for _, row in df.iterrows():
        raw, dampened = _compute_pipeline_score(row.to_dict())
        raw_scores.append(raw)
        dampened_scores.append(dampened)
    df["raw_score"] = raw_scores
    df["dampened_score"] = dampened_scores
    df["dampening_delta"] = df["raw_score"] - df["dampened_score"]
    df = df.sort_values("dampened_score", ascending=False).reset_index(drop=True)

    metrics: dict = {}

    metrics["score_mean"] = float(df["dampened_score"].mean())
    metrics["score_std"] = float(df["dampened_score"].std())
    metrics["score_min"] = float(df["dampened_score"].min())
    metrics["score_max"] = float(df["dampened_score"].max())
    metrics["score_range"] = metrics["score_max"] - metrics["score_min"]
    metrics["effective_range_utilization"] = metrics["score_range"] / 1.0

    metrics["raw_score_mean"] = float(df["raw_score"].mean())
    metrics["raw_score_std"] = float(df["raw_score"].std())
    metrics["raw_score_min"] = float(df["raw_score"].min())
    metrics["raw_score_max"] = float(df["raw_score"].max())

    brackets = [(0, 3), (4, 7), (8, 14), (15, 50)]
    bracket_labels = ["0-3", "4-7", "8-14", "15+"]
    dampening_by_bracket = {}
    for (lo, hi), label in zip(brackets, bracket_labels):
        mask = (df["review_count"] >= lo) & (df["review_count"] <= hi)
        subset = df[mask]
        if len(subset) > 0:
            dampening_by_bracket[label] = {
                "count": int(len(subset)),
                "mean_raw": float(subset["raw_score"].mean()),
                "mean_dampened": float(subset["dampened_score"].mean()),
                "mean_delta": float(subset["dampening_delta"].mean()),
            }
    metrics["dampening_by_bracket"] = dampening_by_bracket

    base_order = df["tutor_id"].values
    perturbations = np.arange(-0.20, 0.21, 0.05)
    sensitivity = {}
    for feat in FEATURE_NAMES:
        taus = []
        for delta in perturbations:
            perturbed_df = df.copy()
            if feat in ("review_count", "sessions_completed"):
                perturbed_df[feat] = np.clip(
                    perturbed_df[feat] * (1 + delta), 0, None
                ).astype(int)
            elif feat == "average_rating":
                perturbed_df[feat] = np.clip(
                    perturbed_df[feat] * (1 + delta), 1.0, 5.0
                )
            else:
                perturbed_df[feat] = np.clip(
                    perturbed_df[feat] * (1 + delta), 0.0, 1.0
                )

            new_scores = []
            for _, row in perturbed_df.iterrows():
                _, dampened = _compute_pipeline_score(row.to_dict())
                new_scores.append(dampened)
            new_order = (
                perturbed_df.assign(ns=new_scores)
                .sort_values("ns", ascending=False)["tutor_id"]
                .values
            )
            tau, _ = kendalltau(base_order, new_order)
            taus.append(float(tau))
        sensitivity[feat] = taus
    metrics["sensitivity_kendall_tau"] = sensitivity

    dampened_order_relevances = np.array(df["raw_score"].values)
    if dampened_order_relevances.max() > 0:
        dampened_order_relevances = dampened_order_relevances / dampened_order_relevances.max()
    ideal_sorted = np.sort(dampened_order_relevances)[::-1]

    ndcg_at_k = {}
    for k in [5, 10, 20, 50, len(df)]:
        k = min(k, len(df))
        ndcg_at_k[k] = _ndcg_at_k(ideal_sorted, dampened_order_relevances, k)
    metrics["ndcg_at_k"] = ndcg_at_k

    feature_correlations = {}
    for feat in FEATURE_NAMES:
        rho, p = spearmanr(df[feat], df["dampened_score"])
        feature_correlations[feat] = {"spearman_rho": float(rho), "p_value": float(p)}
    metrics["feature_rank_correlations"] = feature_correlations

    sorted_scores = df["dampened_score"].values
    gaps = np.diff(sorted_scores)
    metrics["mean_rank_gap"] = float(np.abs(gaps).mean())
    metrics["min_rank_gap"] = float(np.abs(gaps).min())
    metrics["max_rank_gap"] = float(np.abs(gaps).max())

    raw_order = df.sort_values("raw_score", ascending=False)["tutor_id"].values
    dampened_order = df["tutor_id"].values
    raw_damp_tau, _ = kendalltau(raw_order, dampened_order)
    metrics["raw_dampened_kendall_tau"] = float(raw_damp_tau)

    print("\n  === Composite Ranking Pipeline Metrics ===")
    print(f"  Pipeline: score_tutor() -> confidence_weight(threshold={CONFIDENCE_THRESHOLD})")
    print(f"  Tutors evaluated: {len(df)}")
    print(f"\n  Dampened Score: [{metrics['score_min']:.4f}, {metrics['score_max']:.4f}]")
    print(f"  Dampened Mean:  {metrics['score_mean']:.4f} +/- {metrics['score_std']:.4f}")
    print(f"  Raw Score:      [{metrics['raw_score_min']:.4f}, {metrics['raw_score_max']:.4f}]")
    print(f"  Raw Mean:       {metrics['raw_score_mean']:.4f} +/- {metrics['raw_score_std']:.4f}")
    print(f"  Range utilization: {metrics['effective_range_utilization']:.1%}")
    print(f"  Raw<->Dampened tau: {metrics['raw_dampened_kendall_tau']:.4f}")

    print(f"\n  Dampening by Review Count Bracket:")
    for label, vals in metrics["dampening_by_bracket"].items():
        print(f"    [{label:>4s}] n={vals['count']:>3d}  raw={vals['mean_raw']:.4f}  damp={vals['mean_dampened']:.4f}  delta={vals['mean_delta']:.4f}")

    print(f"\n  NDCG@K (dampened vs raw model ordering):")
    for k, v in metrics["ndcg_at_k"].items():
        print(f"    NDCG@{k:<5d} = {v:.4f}")

    print(f"\n  Feature-Rank Correlations (Spearman):")
    for feat, vals in metrics["feature_rank_correlations"].items():
        sig = "***" if vals["p_value"] < 0.001 else "**" if vals["p_value"] < 0.01 else "*" if vals["p_value"] < 0.05 else "ns"
        print(f"    {feat:22s}  rho = {vals['spearman_rho']:.4f}  (p={vals['p_value']:.2e}) {sig}")

    print(f"\n  Rank Discrimination:")
    print(f"    Mean gap: {metrics['mean_rank_gap']:.6f}")
    print(f"    Min gap:  {metrics['min_rank_gap']:.6f}")
    print(f"    Max gap:  {metrics['max_rank_gap']:.6f}")

    _plot_raw_vs_dampened(df, out)
    _plot_dampening_effect(metrics["dampening_by_bracket"], out)
    _plot_sensitivity(perturbations, sensitivity, out)
    _plot_score_distribution(df, out)
    _plot_ndcg_curve(metrics["ndcg_at_k"], out)
    _plot_rank_stability_heatmap(df, out)

    return metrics


def _plot_raw_vs_dampened(df, out: Path):
    fig, ax = plt.subplots(figsize=(7, 6))
    sc = ax.scatter(
        df["raw_score"], df["dampened_score"],
        c=df["review_count"], cmap="YlGnBu", s=40, alpha=0.8,
        edgecolors="white", linewidth=0.3,
    )
    lims = [
        min(df["raw_score"].min(), df["dampened_score"].min()) - 0.02,
        max(df["raw_score"].max(), df["dampened_score"].max()) + 0.02,
    ]
    ax.plot(lims, lims, "--", color="#F04438", lw=1.5, label="No dampening")
    ax.set_xlabel("Raw Model Score", fontsize=12)
    ax.set_ylabel("Dampened Score (production)", fontsize=12)
    ax.set_title("Composite Ranking — Raw vs Dampened", fontsize=13, fontweight="bold")
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_aspect("equal")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.colorbar(sc, ax=ax, label="Review Count")
    fig.tight_layout()
    fig.savefig(out / "composite_raw_vs_dampened.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_raw_vs_dampened.png'}")


def _plot_dampening_effect(bracket_data, out: Path):
    labels = list(bracket_data.keys())
    raw_means = [bracket_data[l]["mean_raw"] for l in labels]
    damp_means = [bracket_data[l]["mean_dampened"] for l in labels]

    x = np.arange(len(labels))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5))
    bars1 = ax.bar(x - width / 2, raw_means, width, label="Raw Model Score", color="#2E75B6", alpha=0.8)
    bars2 = ax.bar(x + width / 2, damp_means, width, label="Dampened Score", color="#12B76A", alpha=0.8)

    for bar, val in zip(bars1, raw_means):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
                f"{val:.3f}", ha="center", va="bottom", fontsize=9)
    for bar, val in zip(bars2, damp_means):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
                f"{val:.3f}", ha="center", va="bottom", fontsize=9)

    ax.set_xlabel("Review Count Bracket", fontsize=12)
    ax.set_ylabel("Mean Score", fontsize=12)
    ax.set_title("Confidence Dampening Effect by Review Count", fontsize=13, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    ax.axhline(y=0.5, color="#999", lw=1, linestyle=":", alpha=0.5)
    fig.tight_layout()
    fig.savefig(out / "composite_dampening_effect.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_dampening_effect.png'}")


def _plot_sensitivity(perturbations, sensitivity, out: Path):
    fig, ax = plt.subplots(figsize=(9, 5))
    colors = {
        "reliability_score": "#2E75B6",
        "sentiment_score": "#12B76A",
        "review_count": "#F79009",
        "sessions_completed": "#F04438",
        "average_rating": "#1F6099",
        "cancellation_rate": "#9B59B6",
    }
    for feat, taus in sensitivity.items():
        ax.plot(perturbations * 100, taus, "o-", lw=2, color=colors[feat],
                label=feat.replace("_", " ").title(), markersize=4)

    ax.axvline(x=0, color="#999", lw=1, linestyle="--", alpha=0.5)
    ax.set_xlabel("Feature Value Perturbation (%)", fontsize=12)
    ax.set_ylabel("Kendall τ (rank correlation with baseline)", fontsize=12)
    ax.set_title("Composite Ranking — Feature Sensitivity", fontsize=13, fontweight="bold")
    ax.legend(fontsize=9, ncol=2)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "composite_sensitivity.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_sensitivity.png'}")


def _plot_score_distribution(df, out: Path):
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df["raw_score"], bins=25, color="#2E75B6", alpha=0.5, edgecolor="white",
            label=f"Raw (μ={df['raw_score'].mean():.3f})")
    ax.hist(df["dampened_score"], bins=25, color="#12B76A", alpha=0.5, edgecolor="white",
            label=f"Dampened (μ={df['dampened_score'].mean():.3f})")
    ax.axvline(x=0.5, color="#F04438", lw=1.5, linestyle="--", alpha=0.5, label="Baseline (0.5)")
    ax.set_xlabel("Score", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("Score Distribution — Raw vs Dampened", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "composite_score_distribution.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_score_distribution.png'}")


def _plot_ndcg_curve(ndcg_vals, out: Path):
    ks = sorted(ndcg_vals.keys())
    vals = [ndcg_vals[k] for k in ks]

    fig, ax = plt.subplots(figsize=(7, 5))
    ax.plot(ks, vals, "o-", color="#2E75B6", lw=2, markersize=8)
    ax.axhline(y=1.0, color="#12B76A", lw=1, linestyle="--", alpha=0.5, label="Perfect NDCG")
    for k, v in zip(ks, vals):
        ax.annotate(f"{v:.4f}", (k, v), textcoords="offset points", xytext=(0, 10),
                    ha="center", fontsize=9, fontweight="bold")
    ax.set_xlabel("K (cutoff)", fontsize=12)
    ax.set_ylabel("NDCG@K", fontsize=12)
    ax.set_title("Composite Ranking — NDCG@K (dampened vs raw)", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3)
    min_val = min(vals) - 0.02
    ax.set_ylim(max(0, min_val), 1.02)
    fig.tight_layout()
    fig.savefig(out / "composite_ndcg_curve.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_ndcg_curve.png'}")


def _plot_rank_stability_heatmap(df, out: Path):
    n = len(FEATURE_NAMES)
    tau_matrix = np.eye(n)
    base_order = df["tutor_id"].values

    for i in range(n):
        for j in range(i + 1, n):
            perturbed_df = df.copy()
            fi, fj = FEATURE_NAMES[i], FEATURE_NAMES[j]

            for feat, direction in [(fi, 0.10), (fj, -0.10)]:
                if feat in ("review_count", "sessions_completed"):
                    perturbed_df[feat] = np.clip(
                        perturbed_df[feat] * (1 + direction), 0, None
                    ).astype(int)
                elif feat == "average_rating":
                    perturbed_df[feat] = np.clip(
                        perturbed_df[feat] * (1 + direction), 1.0, 5.0
                    )
                else:
                    perturbed_df[feat] = np.clip(
                        perturbed_df[feat] * (1 + direction), 0.0, 1.0
                    )

            new_scores = []
            for _, row in perturbed_df.iterrows():
                _, dampened = _compute_pipeline_score(row.to_dict())
                new_scores.append(dampened)
            new_order = (
                perturbed_df.assign(ns=new_scores)
                .sort_values("ns", ascending=False)["tutor_id"]
                .values
            )
            tau, _ = kendalltau(base_order, new_order)
            tau_matrix[i, j] = tau
            tau_matrix[j, i] = tau

    fig, ax = plt.subplots(figsize=(9, 8))
    labels = [f.replace("_", "\n").title() for f in FEATURE_NAMES]
    sns.heatmap(
        tau_matrix, annot=True, fmt=".3f", cmap="YlGnBu",
        xticklabels=labels, yticklabels=labels,
        ax=ax, vmin=0.8, vmax=1.0, square=True,
        cbar_kws={"label": "Kendall τ"},
    )
    ax.set_title("Rank Stability — Pairwise Feature Perturbation (+10% / −10%)", fontsize=11, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "composite_rank_stability.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'composite_rank_stability.png'}")


if __name__ == "__main__":
    run()
