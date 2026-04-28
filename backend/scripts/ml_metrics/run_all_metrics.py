#!/usr/bin/env python3
"""Run all AI/ML evaluation metrics and generate a comprehensive report.

Usage:
    python -m scripts.ml_metrics.run_all_metrics          # run all
    python -m scripts.ml_metrics.run_all_metrics sentiment # run one module
    python -m scripts.ml_metrics.run_all_metrics --list    # list modules

Each module evaluates one AI/ML component of the Rihla platform:

  sentiment          DistilBERT binary sentiment classification
  ranking            scikit-learn GradientBoosting ranking model
  reliability        Deterministic reliability feature engineering
  nlp_extraction     Regex-based NLP search parameter extraction
  composite_ranking  Model + confidence-weight ranking pipeline
  ai_assistant       Ollama/Gemma 4 AI study assistant

All graphs are saved to backend/data/metrics_output/<module>/
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.ml_metrics import (
    sentiment_eval,
    ranking_eval,
    reliability_eval,
    nlp_extraction_eval,
    composite_ranking_eval,
    ai_assistant_eval,
)

OUTPUT_ROOT = Path(__file__).parent.parent.parent / "data" / "metrics_output"

MODULES = {
    "sentiment": sentiment_eval,
    "ranking": ranking_eval,
    "reliability": reliability_eval,
    "nlp_extraction": nlp_extraction_eval,
    "composite_ranking": composite_ranking_eval,
    "ai_assistant": ai_assistant_eval,
}


def _serializable(obj):
    """Make metrics dict JSON-serializable."""
    if isinstance(obj, dict):
        return {k: _serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serializable(x) for x in obj]
    if isinstance(obj, (int, float, str, bool, type(None))):
        return obj
    return str(obj)


def run_module(name: str) -> dict:
    mod = MODULES[name]
    print(f"\n{'='*60}")
    print(f"  Running: {name}")
    print(f"{'='*60}")
    start = time.perf_counter()
    metrics = mod.run()
    elapsed = time.perf_counter() - start
    print(f"\n  Completed {name} in {elapsed:.1f}s")
    return metrics


def main():
    args = sys.argv[1:]

    if "--list" in args:
        print("Available evaluation modules:")
        for name in MODULES:
            print(f"  {name:20s}  {MODULES[name].__doc__.strip().splitlines()[0]}")
        return

    if args and args[0] != "--all":
        targets = [a for a in args if a in MODULES]
        if not targets:
            print(f"Unknown module(s): {args}. Use --list to see available modules.")
            return
    else:
        targets = list(MODULES.keys())

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    all_metrics = {}
    total_start = time.perf_counter()

    for name in targets:
        try:
            all_metrics[name] = run_module(name)
        except Exception as e:
            print(f"\n  ERROR in {name}: {e}")
            import traceback
            traceback.print_exc()
            all_metrics[name] = {"error": str(e)}

    total_elapsed = time.perf_counter() - total_start

    # --- Summary ---
    print(f"\n{'='*60}")
    print(f"  ALL EVALUATIONS COMPLETE — {total_elapsed:.1f}s total")
    print(f"{'='*60}")
    print(f"\n  Modules run: {len(targets)}")
    errors = [n for n, m in all_metrics.items() if "error" in m]
    if errors:
        print(f"  Errors: {', '.join(errors)}")

    # Key metrics summary
    print(f"\n  -- Key Metrics Summary --")
    if "sentiment" in all_metrics and "error" not in all_metrics["sentiment"]:
        s = all_metrics["sentiment"]
        print(f"  Sentiment:   F1={s.get('f1', 'N/A'):.4f}, AUC-ROC={s.get('auc_roc', 'N/A'):.4f}, Accuracy={s.get('accuracy', 'N/A'):.4f}")

    if "ranking" in all_metrics and "error" not in all_metrics["ranking"]:
        r = all_metrics["ranking"]
        print(f"  Ranking:     R²={r.get('r2', 'N/A'):.4f}, RMSE={r.get('rmse', 'N/A'):.6f}, MAE={r.get('mae', 'N/A'):.6f}")

    if "reliability" in all_metrics and "error" not in all_metrics["reliability"]:
        rel = all_metrics["reliability"]
        if "reliability_score" in rel:
            rs = rel["reliability_score"]
            print(f"  Reliability: mean={rs['mean']:.4f}, std={rs['std']:.4f}, range=[{rs['min']:.4f}, {rs['max']:.4f}]")

    if "nlp_extraction" in all_metrics and "error" not in all_metrics["nlp_extraction"]:
        nlp = all_metrics["nlp_extraction"]
        regex = nlp.get("regex", nlp)
        print(f"  NLP Regex:   exact_match={regex.get('exact_match_ratio', 0):.4f}, field_accuracy={regex.get('overall_field_accuracy', 0):.4f}")
        ollama_nlp = nlp.get("ollama")
        if ollama_nlp:
            print(f"  NLP Ollama:  exact_match={ollama_nlp.get('exact_match_ratio', 0):.4f}, field_accuracy={ollama_nlp.get('overall_field_accuracy', 0):.4f}, latency={ollama_nlp.get('mean_latency', 0):.1f}s")

    if "composite_ranking" in all_metrics and "error" not in all_metrics["composite_ranking"]:
        c = all_metrics["composite_ranking"]
        ndcg = c.get("ndcg_at_k", {})
        ndcg10 = ndcg.get(10, "N/A")
        print(f"  Composite:   NDCG@10={ndcg10:.4f}, score_range={c.get('score_range', 'N/A'):.4f}")

    if "ai_assistant" in all_metrics and "error" not in all_metrics["ai_assistant"]:
        a = all_metrics["ai_assistant"]
        print(f"  AI Assist:   design_coverage={a.get('design_criteria_coverage', 'N/A'):.0%}")
        if a.get("live"):
            live = a["live"]
            print(f"               latency={live.get('overall_mean_latency', 'N/A'):.1f}s, socratic_ratio={live.get('socratic_question_ratio', 'N/A'):.0%}")

    # Save full report JSON
    report_path = OUTPUT_ROOT / "metrics_report.json"
    with open(report_path, "w") as f:
        json.dump(_serializable(all_metrics), f, indent=2)
    print(f"\n  Full report saved to: {report_path}")

    # List all generated graphs
    png_files = sorted(OUTPUT_ROOT.rglob("*.png"))
    if png_files:
        print(f"\n  Generated {len(png_files)} graphs:")
        for p in png_files:
            print(f"    {p.relative_to(OUTPUT_ROOT)}")


if __name__ == "__main__":
    main()
