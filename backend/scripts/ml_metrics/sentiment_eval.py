"""Evaluate the DistilBERT sentiment analysis model.

Runs app.ml.sentiment.analyze_sentiment() on a labelled test corpus of review
texts. Ground truth is derived from star ratings: rating >= 4 → positive (1),
rating <= 2 → negative (0). Rating 3 reviews are included in distribution
analysis but excluded from hard classification metrics.

Metrics produced
----------------
Binary classification: Accuracy, Precision, Recall, F1, MCC, Cohen's Kappa
Probabilistic:         AUC-ROC, AUC-PR, Brier Score, Log-Loss
Calibration:           Expected Calibration Error (ECE)

Graphs produced
---------------
1. Confusion matrix heatmap
2. ROC curve with AUC
3. Precision-Recall curve with AUC
4. Sentiment score distribution by true class
5. Calibration (reliability) diagram
6. Score vs star-rating box plot
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    matthews_corrcoef,
    cohen_kappa_score,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    log_loss,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    classification_report,
)

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "sentiment"

TEST_REVIEWS = [
    # (text, star_rating)
    # -- clearly positive (4-5 stars) --
    ("Excellent tutor! Very patient and explains concepts clearly. Highly recommend.", 5),
    ("Great teaching style. Helped me improve my grades significantly.", 5),
    ("Very knowledgeable and always well prepared for lessons.", 5),
    ("Amazing experience. My child's confidence has improved dramatically.", 5),
    ("The tutor uses creative methods that keep students engaged.", 5),
    ("Professional and punctual. Provides excellent study materials.", 5),
    ("Best tutor I've ever had. Patient with slow learners.", 5),
    ("Explains difficult concepts with real-world examples.", 4),
    ("Consistent quality over months of tutoring. Very reliable.", 4),
    ("Really enjoyed the lessons. Very interactive and fun.", 4),
    ("Wonderful teacher who truly cares about student success.", 5),
    ("My grades went from C to A after just two months.", 5),
    ("Highly professional and knowledgeable in the subject area.", 4),
    ("The lesson plans are well structured and easy to follow.", 4),
    ("Brilliant tutor. Makes even the hardest topics seem simple.", 5),
    ("Very helpful and supportive. Always goes the extra mile.", 4),
    ("Outstanding teaching methodology. Would recommend to anyone.", 5),
    ("Exceeded all my expectations. Truly gifted educator.", 5),
    ("Clear explanations and great exam preparation strategies.", 4),
    ("A fantastic tutor who genuinely loves teaching.", 5),
    # -- clearly negative (1-2 stars) --
    ("Terrible experience. Tutor was unprepared and constantly late.", 1),
    ("Complete waste of money. Learned nothing in three months.", 1),
    ("Very rude and dismissive when I asked questions.", 1),
    ("Lessons were disorganized and the tutor seemed uninterested.", 2),
    ("Would not recommend. My grades actually got worse.", 1),
    ("The tutor cancelled three times in a row without explanation.", 2),
    ("Very poor communication and unhelpful teaching style.", 2),
    ("I felt rushed through topics without proper understanding.", 2),
    ("The materials provided were outdated and full of errors.", 2),
    ("Overpriced for the quality of teaching received.", 2),
    ("Completely unprofessional. Often distracted during lessons.", 1),
    ("The tutor has no patience for struggling students.", 1),
    ("Worse tutor I have ever encountered. Very disappointing.", 1),
    ("No improvement after weeks of classes. Feels pointless.", 2),
    ("Rude and condescending when students make mistakes.", 1),
    ("The quality of lessons dropped significantly over time.", 2),
    ("Frequently changes schedules at the last minute.", 2),
    ("Not worth the price. Very generic and boring lessons.", 2),
    ("Failed to cover the syllabus topics promised.", 1),
    ("An awful experience from start to finish.", 1),
    # -- ambiguous / mixed (3 stars) --
    ("Good tutor but sometimes the lessons run over time.", 3),
    ("Average experience. Nothing special but not bad either.", 3),
    ("The tutor knows the subject but the teaching style is dry.", 3),
    ("OK for the price but I expected more interaction.", 3),
    ("Some good lessons, some not so good. Quite inconsistent.", 3),
    ("Decent tutor but needs to improve time management.", 3),
    ("Not bad, but there's room for improvement in explanations.", 3),
    ("The tutoring was acceptable but uninspiring.", 3),
    ("Mixed feelings. Some topics were taught well, others rushed.", 3),
    ("Fair enough but I've had better tutors for less money.", 3),
]


def run(output_dir: Path | None = None) -> dict:
    """Run full sentiment evaluation. Returns metrics dict."""
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    try:
        from app.ml.sentiment import analyze_sentiment
    except Exception as e:
        print(f"  [WARN] Could not import app.ml.sentiment: {e}")
        print("  Using transformers directly ...")
        analyze_sentiment = _fallback_sentiment()

    print("  Running sentiment model on test corpus ...")
    texts = [t for t, _ in TEST_REVIEWS]
    ratings = np.array([r for _, r in TEST_REVIEWS])
    scores = np.array([analyze_sentiment(t) for t in texts])

    # --- Metrics on binary subset (exclude rating=3) ---
    mask = ratings != 3
    bin_scores = scores[mask]
    bin_ratings = ratings[mask]
    y_true = (bin_ratings >= 4).astype(int)
    y_pred = (bin_scores >= 0.5).astype(int)

    metrics = {}
    metrics["accuracy"] = accuracy_score(y_true, y_pred)
    metrics["precision"] = precision_score(y_true, y_pred, zero_division=0)
    metrics["recall"] = recall_score(y_true, y_pred, zero_division=0)
    metrics["f1"] = f1_score(y_true, y_pred, zero_division=0)
    metrics["f1_macro"] = f1_score(y_true, y_pred, average="macro", zero_division=0)
    metrics["mcc"] = matthews_corrcoef(y_true, y_pred)
    metrics["cohens_kappa"] = cohen_kappa_score(y_true, y_pred)
    metrics["auc_roc"] = roc_auc_score(y_true, bin_scores)
    metrics["auc_pr"] = average_precision_score(y_true, bin_scores)
    metrics["brier_score"] = brier_score_loss(y_true, bin_scores)
    metrics["log_loss"] = log_loss(y_true, bin_scores)
    metrics["n_positive"] = int(y_true.sum())
    metrics["n_negative"] = int((1 - y_true).sum())
    metrics["n_total_binary"] = len(y_true)
    metrics["n_ambiguous_excluded"] = int((~mask).sum())
    metrics["mean_score_positive"] = float(bin_scores[y_true == 1].mean())
    metrics["mean_score_negative"] = float(bin_scores[y_true == 0].mean())
    metrics["std_score_positive"] = float(bin_scores[y_true == 1].std())
    metrics["std_score_negative"] = float(bin_scores[y_true == 0].std())

    # --- ECE (Expected Calibration Error) ---
    n_bins_cal = 10
    prob_true, prob_pred = calibration_curve(y_true, bin_scores, n_bins=n_bins_cal, strategy="uniform")
    bin_edges = np.linspace(0, 1, n_bins_cal + 1)
    bin_indices = np.digitize(bin_scores, bin_edges[1:-1])
    n_cal_bins = len(prob_true)
    bin_weights = np.array([np.sum(bin_indices == i) for i in range(n_cal_bins)])
    ece = float(np.sum(np.abs(prob_true - prob_pred) * bin_weights / len(bin_scores)))
    metrics["ece"] = ece

    # --- Print report ---
    print("\n  === Sentiment Analysis Metrics ===")
    print(f"  Test corpus: {len(TEST_REVIEWS)} reviews ({metrics['n_positive']} pos, {metrics['n_negative']} neg, {metrics['n_ambiguous_excluded']} ambiguous excluded)")
    print(f"  Accuracy:        {metrics['accuracy']:.4f}")
    print(f"  Precision:       {metrics['precision']:.4f}")
    print(f"  Recall:          {metrics['recall']:.4f}")
    print(f"  F1 (positive):   {metrics['f1']:.4f}")
    print(f"  F1 (macro):      {metrics['f1_macro']:.4f}")
    print(f"  MCC:             {metrics['mcc']:.4f}")
    print(f"  Cohen's Kappa:   {metrics['cohens_kappa']:.4f}")
    print(f"  AUC-ROC:         {metrics['auc_roc']:.4f}")
    print(f"  AUC-PR:          {metrics['auc_pr']:.4f}")
    print(f"  Brier Score:     {metrics['brier_score']:.4f}")
    print(f"  Log Loss:        {metrics['log_loss']:.4f}")
    print(f"  ECE:             {metrics['ece']:.4f}")
    print(f"  Mean score (pos): {metrics['mean_score_positive']:.4f} ± {metrics['std_score_positive']:.4f}")
    print(f"  Mean score (neg): {metrics['mean_score_negative']:.4f} ± {metrics['std_score_negative']:.4f}")

    print("\n  Classification Report:")
    print(classification_report(y_true, y_pred, target_names=["Negative", "Positive"], digits=4))

    # --- Graphs ---
    _plot_confusion_matrix(y_true, y_pred, out)
    _plot_roc_curve(y_true, bin_scores, metrics["auc_roc"], out)
    _plot_pr_curve(y_true, bin_scores, metrics["auc_pr"], out)
    _plot_score_distribution(bin_scores, y_true, out)
    _plot_calibration(y_true, bin_scores, out)
    _plot_score_vs_rating(scores, ratings, out)

    return metrics


def _fallback_sentiment():
    """Load model directly if app module import fails."""
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    import torch

    model_name = "distilbert-base-uncased-finetuned-sst-2-english"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    def analyze(text: str) -> float:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        return float(probs[0][1])

    return analyze


def _plot_confusion_matrix(y_true, y_pred, out: Path):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Negative", "Positive"],
        yticklabels=["Negative", "Positive"],
        ax=ax, cbar_kws={"label": "Count"},
    )
    ax.set_xlabel("Predicted Label", fontsize=12)
    ax.set_ylabel("True Label", fontsize=12)
    ax.set_title("Sentiment Classification — Confusion Matrix", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "sentiment_confusion_matrix.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_confusion_matrix.png'}")


def _plot_roc_curve(y_true, scores, auc_val, out: Path):
    fpr, tpr, _ = roc_curve(y_true, scores)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, color="#2E75B6", lw=2, label=f"ROC (AUC = {auc_val:.4f})")
    ax.plot([0, 1], [0, 1], color="#999", lw=1, linestyle="--", label="Random")
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("Sentiment Classification — ROC Curve", fontsize=13, fontweight="bold")
    ax.legend(loc="lower right")
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "sentiment_roc_curve.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_roc_curve.png'}")


def _plot_pr_curve(y_true, scores, ap_val, out: Path):
    precision_vals, recall_vals, _ = precision_recall_curve(y_true, scores)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(recall_vals, precision_vals, color="#12B76A", lw=2, label=f"PR (AP = {ap_val:.4f})")
    baseline = y_true.sum() / len(y_true)
    ax.axhline(y=baseline, color="#999", lw=1, linestyle="--", label=f"Baseline ({baseline:.2f})")
    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("Sentiment Classification — Precision-Recall Curve", fontsize=13, fontweight="bold")
    ax.legend(loc="lower left")
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([0, 1.05])
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "sentiment_pr_curve.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_pr_curve.png'}")


def _plot_score_distribution(scores, y_true, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(
        scores[y_true == 1], bins=20, alpha=0.65, color="#12B76A",
        label=f"Positive (n={int(y_true.sum())})", edgecolor="white",
    )
    ax.hist(
        scores[y_true == 0], bins=20, alpha=0.65, color="#F04438",
        label=f"Negative (n={int((1-y_true).sum())})", edgecolor="white",
    )
    ax.axvline(x=0.5, color="#344054", lw=1.5, linestyle="--", label="Threshold (0.5)")
    ax.set_xlabel("Sentiment Score", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("Sentiment Score Distribution by True Class", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "sentiment_score_distribution.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_score_distribution.png'}")


def _plot_calibration(y_true, scores, out: Path):
    prob_true, prob_pred = calibration_curve(y_true, scores, n_bins=8, strategy="uniform")
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(prob_pred, prob_true, "o-", color="#2E75B6", lw=2, label="DistilBERT")
    ax.plot([0, 1], [0, 1], "--", color="#999", label="Perfectly calibrated")
    ax.set_xlabel("Mean Predicted Probability", fontsize=12)
    ax.set_ylabel("Fraction of Positives", fontsize=12)
    ax.set_title("Sentiment Model — Calibration Curve", fontsize=13, fontweight="bold")
    ax.legend(loc="lower right")
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out / "sentiment_calibration.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_calibration.png'}")


def _plot_score_vs_rating(scores, ratings, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    data_by_rating = {r: scores[ratings == r] for r in sorted(set(ratings))}
    positions = sorted(data_by_rating.keys())
    box_data = [data_by_rating[r] for r in positions]

    bp = ax.boxplot(box_data, positions=positions, widths=0.5, patch_artist=True)
    colors = ["#F04438", "#F79009", "#F79009", "#12B76A", "#12B76A"]
    for patch, color in zip(bp["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.5)

    for r in positions:
        x_jittered = r + np.random.normal(0, 0.06, len(data_by_rating[r]))
        ax.scatter(x_jittered, data_by_rating[r], alpha=0.5, s=20, color="#344054", zorder=3)

    ax.axhline(y=0.5, color="#999", lw=1, linestyle="--", alpha=0.7)
    ax.set_xlabel("Star Rating", fontsize=12)
    ax.set_ylabel("Sentiment Score", fontsize=12)
    ax.set_title("Sentiment Score vs Star Rating", fontsize=13, fontweight="bold")
    ax.set_xticks(positions)
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "sentiment_score_vs_rating.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'sentiment_score_vs_rating.png'}")


if __name__ == "__main__":
    run()
