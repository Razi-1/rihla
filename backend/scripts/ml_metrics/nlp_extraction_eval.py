"""Evaluate the NLP search-parameter extraction pipeline.

The extraction pipeline has two stages:
1. Primary: Ollama/Gemma 4 structured JSON extraction (ollama_client.extract_search_params)
2. Fallback: Regex-based extraction (search_service._apply_regex_extraction)

This module tests BOTH the Ollama/LLM extraction (if available) and the regex
fallback against a curated test set of 50 natural-language tutor search queries
with expected field values.

Metrics produced
----------------
Per-field: Accuracy, Precision, Recall, F1 for subject, mode, gender, budget
Aggregate: Exact Match Ratio, Partial Match Ratio, Mean Fields Extracted
Ollama:    Per-field accuracy, latency, JSON parse success rate
Comparison: Regex vs Ollama head-to-head per field

Graphs produced
---------------
1. Per-field accuracy bar chart (regex)
2. Per-field F1 score comparison (regex)
3. Extraction success breakdown (stacked bar)
4. Field extraction heatmap (query × field)
5. Regex vs Ollama accuracy comparison (if Ollama available)
6. Ollama latency distribution (if Ollama available)
"""
import json as json_mod
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "nlp_extraction"

# (query, expected_subject_keyword, expected_mode, expected_gender, expected_budget_max)
# None = not specified in the query
TEST_QUERIES = [
    ("I need a math tutor online under 3000", "math", "online", None, 3000),
    ("Looking for a female physics tutor in Colombo", "physics", None, "female", None),
    ("Find me a computer science tutor for A-Levels", "computer science", None, None, None),
    ("Want an online chemistry teacher below 2500", "chemistry", "online", None, 2500),
    ("Need a male tutor for biology near Kandy", "biology", None, "male", None),
    ("Cheap English tutor for O-Level online", "english", "online", None, None),
    ("Looking for in-person maths lessons", "mathematics", "physical", None, None),
    ("I want a female economics tutor under 4000 in Galle", "economics", None, "female", 4000),
    ("Find a coding tutor online budget 3500", "computer science", "online", None, 3500),
    ("Need someone to teach physics face to face", "physics", "physical", None, None),
    ("Online tutor for IELTS preparation below 5000", None, "online", None, 5000),
    ("History tutor in Colombo", "history", None, None, None),
    ("Science tutor for my daughter max 2000", "science", None, None, 2000),
    ("Art teacher near Negombo physical classes", "art", "physical", None, None),
    ("bio tutor remote lessons", "biology", "online", None, None),
    ("ICT tutor online less than 3000", "ict", "online", None, 3000),
    ("cs tutor for programming", "computer science", None, None, None),
    ("Tamil language tutor hybrid mode", "tamil", "hybrid", None, None),
    ("Sinhala tutor in person under 1500", "sinhala", "physical", None, 1500),
    ("Female tutor for combined mathematics A-Level", "mathematics", None, "female", None),
    ("Male tutor for physics zoom classes", "physics", "online", "male", None),
    ("Chemistry tutor at most 2800", "chemistry", None, None, 2800),
    ("English literature tutor online", "english", "online", None, None),
    ("Need tutor for primary school physical", None, "physical", None, None),
    ("Lady tutor for my son's O-Level exams", None, None, "female", None),
    ("Economics tutor remote budget up to 3000", "economics", "online", None, 3000),
    ("math teacher less than 2000 per hour", "math", None, None, 2000),
    ("Looking for a virtual biology teacher", "biology", "online", None, None),
    ("Find home tutor for chemistry in Kandy", "chemistry", "physical", None, None),
    ("Online female tutor for English below 2500", "english", "online", "female", 2500),
    ("Physics tutor above 2000", "physics", None, None, None),
    ("Affordable math tutor for school kids", "math", None, None, None),
    ("Male CS tutor in Colombo hybrid", "computer science", "hybrid", "male", None),
    ("Woman who teaches history online", "history", "online", "female", None),
    ("IT tutor for A/L students online under 4000", "ict", "online", None, 4000),
    ("econ tutor physical classes in Galle", "economics", "physical", None, None),
    ("Tutor for programming online max 3500", "computer science", "online", None, 3500),
    ("I need help with biology homework", "biology", None, None, None),
    ("Chinese tutor in Sri Lanka", None, None, None, None),
    ("Someone to teach me piano online", None, "online", None, None),
    ("Mathematics tutor for A-Level cheaper than 3000", "mathematics", None, None, 3000),
    ("Best rated physics tutor near me", "physics", None, None, None),
    ("Tutor for grade 5 student in Matara physical", None, "physical", None, None),
    ("Online tutor under 1500 for any subject", None, "online", None, 1500),
    ("Female biology tutor Colombo in-person", "biology", "physical", "female", None),
    ("I want hybrid classes for computer science", "computer science", "hybrid", None, None),
    ("Chemistry and physics tutor", "chemistry", None, None, None),
    ("Maths tutor who can come to my home", "mathematics", "physical", None, None),
    ("Need a tutor urgently for English exam prep online", "english", "online", None, None),
    ("Looking for tutors between 2000 and 4000", None, None, None, 4000),
]

SUBJECT_ALIASES = {
    "math": "mathematics", "maths": "mathematics",
    "bio": "biology", "cs": "computer science",
    "ict": "ict", "it": "ict", "coding": "computer science",
    "programming": "computer science", "econ": "economics",
}


def _extract_regex(query: str) -> dict:
    """Replicate the regex extraction logic from search_service.py."""
    q = query.lower()
    result = {"subject": None, "mode": None, "gender": None, "budget": None}

    if any(w in q for w in ["online", "remote", "virtual", "zoom"]):
        result["mode"] = "online"
    elif any(w in q for w in ["in-person", "in person", "physical", "face to face", "home"]):
        result["mode"] = "physical"
    elif "hybrid" in q:
        result["mode"] = "hybrid"

    if "female" in q or "woman" in q or "lady" in q:
        result["gender"] = "female"
    elif "male" in q and "female" not in q:
        result["gender"] = "male"

    price_match = re.search(
        r"(?:under|below|less than|max|budget|cheaper than|up to|at most)\s*(\d[\d,]*)",
        q,
    )
    if price_match:
        result["budget"] = int(price_match.group(1).replace(",", ""))

    known_subjects = [
        "mathematics", "physics", "chemistry", "biology", "english",
        "computer science", "ict", "economics", "art", "history",
        "science", "sinhala", "tamil",
    ]
    for subj in known_subjects:
        if subj in q:
            result["subject"] = subj
            break

    if not result["subject"]:
        for alias, canonical in SUBJECT_ALIASES.items():
            if alias in q.split():
                result["subject"] = canonical
                break

    return result


def _check_ollama_available() -> bool:
    try:
        import httpx
        resp = httpx.get("http://localhost:11434/api/tags", timeout=3.0)
        return resp.status_code == 200
    except Exception:
        return False


def _extract_ollama(query: str, timeout: float = 60.0) -> tuple[dict, float]:
    """Call Ollama to extract search params, returning (parsed_dict, latency)."""
    import httpx

    system = (
        "You are a search parameter extractor for a tutoring platform in Sri Lanka. "
        "Given a natural language query about finding a tutor, extract structured parameters as JSON.\n\n"
        "Fields to extract (use null if not mentioned):\n"
        "- subject: the academic subject (e.g. \"mathematics\", \"physics\", \"english\", \"computer science\")\n"
        "- gender_preference: \"male\" or \"female\" if specified\n"
        "- mode: \"online\", \"physical\", or \"hybrid\" if specified\n"
        "- budget: maximum price as a number if mentioned\n"
        "- location: city or region name if mentioned (e.g. \"Colombo\", \"Kandy\", \"Galle\")\n"
        "- education_level: e.g. \"O-Level\", \"A-Level\", \"Primary\" if mentioned\n\n"
        "Return ONLY valid JSON, no other text or explanation."
    )

    start = time.perf_counter()
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "gemma4:e4b",
                    "prompt": query,
                    "system": system,
                    "temperature": 0.1,
                    "stream": False,
                    "keep_alive": -1,
                },
            )
            elapsed = time.perf_counter() - start
            if resp.status_code == 200:
                raw = resp.json().get("response", "")
                cleaned = raw.strip()
                brace_start = cleaned.find("{")
                brace_end = cleaned.rfind("}") + 1
                if brace_start >= 0 and brace_end > brace_start:
                    cleaned = cleaned[brace_start:brace_end]
                parsed = json_mod.loads(cleaned)
                return parsed, elapsed
    except (json_mod.JSONDecodeError, Exception):
        pass
    return {}, time.perf_counter() - start


def _normalize_ollama_result(parsed: dict) -> dict:
    """Normalize Ollama JSON output to match our expected fields."""
    result = {"subject": None, "mode": None, "gender": None, "budget": None}

    subj = parsed.get("subject")
    if subj and subj != "null":
        subj_lower = str(subj).lower().strip()
        if subj_lower in SUBJECT_ALIASES:
            subj_lower = SUBJECT_ALIASES[subj_lower]
        result["subject"] = subj_lower

    mode = parsed.get("mode")
    if mode and mode != "null":
        mode_lower = str(mode).lower().strip()
        MODE_MAP = {
            "online": "online", "remote": "online", "virtual": "online",
            "in-person": "physical", "in person": "physical",
            "physical": "physical", "face to face": "physical",
            "hybrid": "hybrid",
        }
        result["mode"] = MODE_MAP.get(mode_lower, mode_lower)

    gender = parsed.get("gender_preference")
    if gender and gender != "null":
        g = str(gender).lower().strip()
        if g in ("female", "male"):
            result["gender"] = g

    budget = parsed.get("budget")
    if budget is not None and budget != "null":
        try:
            result["budget"] = int(float(str(budget).replace(",", "")))
        except (ValueError, TypeError):
            pass

    return result


def _evaluate_method(method_fn, method_name, fields, test_queries) -> tuple[dict, list]:
    """Evaluate an extraction method, returning (metrics_dict, per_query_results)."""
    predictions = {f: [] for f in fields}
    truths = {f: [] for f in fields}
    per_query_results = []

    for query, exp_subj, exp_mode, exp_gender, exp_budget in test_queries:
        extracted = method_fn(query)

        exp_subj_canonical = exp_subj
        if exp_subj and exp_subj in SUBJECT_ALIASES:
            exp_subj_canonical = SUBJECT_ALIASES[exp_subj]

        subj_correct = (extracted["subject"] == exp_subj_canonical) or (
            extracted["subject"] is None and exp_subj_canonical is None
        )
        mode_correct = extracted["mode"] == exp_mode
        gender_correct = extracted["gender"] == exp_gender
        budget_correct = extracted["budget"] == exp_budget

        predictions["subject"].append(1 if extracted["subject"] else 0)
        truths["subject"].append(1 if exp_subj_canonical else 0)
        predictions["mode"].append(1 if extracted["mode"] else 0)
        truths["mode"].append(1 if exp_mode else 0)
        predictions["gender"].append(1 if extracted["gender"] else 0)
        truths["gender"].append(1 if exp_gender else 0)
        predictions["budget"].append(1 if extracted["budget"] else 0)
        truths["budget"].append(1 if exp_budget else 0)

        correct_fields = sum([subj_correct, mode_correct, gender_correct, budget_correct])
        specified_fields = sum([
            exp_subj_canonical is not None,
            exp_mode is not None,
            exp_gender is not None,
            exp_budget is not None,
        ])

        per_query_results.append({
            "query": query,
            "subject_correct": subj_correct,
            "mode_correct": mode_correct,
            "gender_correct": gender_correct,
            "budget_correct": budget_correct,
            "correct_count": correct_fields,
            "total_fields": 4,
            "specified_fields": specified_fields,
            "exact_match": correct_fields == 4,
            "partial_match": correct_fields > 0,
        })

    metrics = {}
    n = len(test_queries)
    for f in fields:
        y_t = np.array(truths[f])
        y_p = np.array(predictions[f])
        field_correct = sum(r[f"{f}_correct"] for r in per_query_results)
        metrics[f"accuracy_{f}"] = field_correct / n

        if y_t.sum() > 0 and y_p.sum() > 0:
            metrics[f"precision_{f}"] = precision_score(y_t, y_p, zero_division=0)
            metrics[f"recall_{f}"] = recall_score(y_t, y_p, zero_division=0)
            metrics[f"f1_{f}"] = f1_score(y_t, y_p, zero_division=0)
        else:
            metrics[f"precision_{f}"] = 1.0 if y_t.sum() == 0 and y_p.sum() == 0 else 0.0
            metrics[f"recall_{f}"] = 1.0 if y_t.sum() == 0 else 0.0
            metrics[f"f1_{f}"] = 0.0

    exact_matches = sum(1 for r in per_query_results if r["exact_match"])
    partial_matches = sum(1 for r in per_query_results if r["partial_match"])
    total_correct = sum(r["correct_count"] for r in per_query_results)

    metrics["exact_match_ratio"] = exact_matches / n
    metrics["partial_match_ratio"] = partial_matches / n
    metrics["overall_field_accuracy"] = total_correct / (n * 4)
    metrics["mean_fields_correct"] = total_correct / n
    metrics["n_queries"] = n
    metrics["n_exact_match"] = exact_matches
    metrics["n_partial_match"] = partial_matches

    return metrics, per_query_results


def run(output_dir: Path | None = None) -> dict:
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    fields = ["subject", "mode", "gender", "budget"]

    # --- Regex evaluation ---
    print("\n  === NLP Extraction Metrics (Regex Fallback) ===")
    regex_metrics, regex_results = _evaluate_method(_extract_regex, "regex", fields, TEST_QUERIES)

    print(f"  Test queries: {regex_metrics['n_queries']}")
    print(f"\n  Per-Field Accuracy:")
    for f in fields:
        print(f"    {f:12s}  acc={regex_metrics[f'accuracy_{f}']:.4f}  "
              f"P={regex_metrics[f'precision_{f}']:.4f}  "
              f"R={regex_metrics[f'recall_{f}']:.4f}  "
              f"F1={regex_metrics[f'f1_{f}']:.4f}")

    exact_matches = regex_metrics["n_exact_match"]
    n = regex_metrics["n_queries"]
    total_correct = int(regex_metrics["overall_field_accuracy"] * n * 4)
    total_fields = n * 4
    print(f"\n  Aggregate:")
    print(f"    Exact Match Ratio:     {regex_metrics['exact_match_ratio']:.4f} ({exact_matches}/{n})")
    print(f"    Partial Match Ratio:   {regex_metrics['partial_match_ratio']:.4f}")
    print(f"    Overall Field Accuracy:{regex_metrics['overall_field_accuracy']:.4f} ({total_correct}/{total_fields})")
    print(f"    Mean Fields Correct:   {regex_metrics['mean_fields_correct']:.2f} / 4")

    failed = [r for r in regex_results if not r["exact_match"]]
    if failed:
        print(f"\n  Queries with at least one wrong field ({len(failed)}):")
        for r in failed[:10]:
            wrong = [f for f in fields if not r[f"{f}_correct"]]
            print(f"    \"{r['query'][:60]}...\" -> wrong: {', '.join(wrong)}")

    _plot_per_field_accuracy(regex_metrics, fields, out)
    _plot_f1_comparison(regex_metrics, fields, out)
    _plot_extraction_success(regex_results, out)
    _plot_field_heatmap(regex_results, fields, out)

    metrics = {"regex": regex_metrics}

    # --- Ollama/LLM evaluation ---
    ollama_available = _check_ollama_available()
    if ollama_available:
        print("\n  === NLP Extraction Metrics (Ollama / Gemma 4 E4B) ===")
        print("  Running live LLM extraction on all test queries ...")

        ollama_latencies = []
        json_parse_successes = 0

        def _ollama_extract_wrapper(query):
            parsed, latency = _extract_ollama(query)
            ollama_latencies.append(latency)
            if parsed:
                nonlocal json_parse_successes
                json_parse_successes += 1
            return _normalize_ollama_result(parsed)

        ollama_metrics, ollama_results = _evaluate_method(
            _ollama_extract_wrapper, "ollama", fields, TEST_QUERIES
        )

        ollama_metrics["mean_latency"] = float(np.mean(ollama_latencies)) if ollama_latencies else 0
        ollama_metrics["p95_latency"] = float(np.percentile(ollama_latencies, 95)) if ollama_latencies else 0
        ollama_metrics["json_parse_success_rate"] = json_parse_successes / len(TEST_QUERIES)

        print(f"  Test queries: {ollama_metrics['n_queries']}")
        print(f"  JSON parse success rate: {ollama_metrics['json_parse_success_rate']:.0%}")
        print(f"  Mean latency: {ollama_metrics['mean_latency']:.2f}s, P95: {ollama_metrics['p95_latency']:.2f}s")
        print(f"\n  Per-Field Accuracy:")
        for f in fields:
            print(f"    {f:12s}  acc={ollama_metrics[f'accuracy_{f}']:.4f}  "
                  f"P={ollama_metrics[f'precision_{f}']:.4f}  "
                  f"R={ollama_metrics[f'recall_{f}']:.4f}  "
                  f"F1={ollama_metrics[f'f1_{f}']:.4f}")

        print(f"\n  Aggregate:")
        print(f"    Exact Match Ratio:     {ollama_metrics['exact_match_ratio']:.4f}")
        print(f"    Overall Field Accuracy:{ollama_metrics['overall_field_accuracy']:.4f}")

        ollama_failed = [r for r in ollama_results if not r["exact_match"]]
        if ollama_failed:
            print(f"\n  Ollama queries with errors ({len(ollama_failed)}):")
            for r in ollama_failed[:10]:
                wrong = [f for f in fields if not r[f"{f}_correct"]]
                print(f"    \"{r['query'][:55]}\" -> wrong: {', '.join(wrong)}")

        _plot_regex_vs_ollama(regex_metrics, ollama_metrics, fields, out)
        _plot_ollama_latency(ollama_latencies, out)

        metrics["ollama"] = ollama_metrics
    else:
        print("\n  Ollama not available — skipping LLM extraction evaluation.")
        metrics["ollama"] = None

    return metrics


def _plot_per_field_accuracy(metrics, fields, out: Path):
    fig, ax = plt.subplots(figsize=(8, 5))
    accs = [metrics[f"accuracy_{f}"] for f in fields]
    colors = ["#2E75B6", "#12B76A", "#F79009", "#F04438"]
    bars = ax.bar(fields, accs, color=colors, alpha=0.8, edgecolor="white")
    for bar, val in zip(bars, accs):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                f"{val:.1%}", ha="center", fontsize=11, fontweight="bold")
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("NLP Extraction — Per-Field Accuracy (Regex Fallback)", fontsize=13, fontweight="bold")
    ax.set_ylim(0, 1.12)
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "nlp_per_field_accuracy.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_per_field_accuracy.png'}")


def _plot_f1_comparison(metrics, fields, out: Path):
    fig, ax = plt.subplots(figsize=(10, 5))
    x = np.arange(len(fields))
    w = 0.25
    p_vals = [metrics[f"precision_{f}"] for f in fields]
    r_vals = [metrics[f"recall_{f}"] for f in fields]
    f1_vals = [metrics[f"f1_{f}"] for f in fields]

    ax.bar(x - w, p_vals, w, label="Precision", color="#2E75B6", alpha=0.8)
    ax.bar(x, r_vals, w, label="Recall", color="#12B76A", alpha=0.8)
    ax.bar(x + w, f1_vals, w, label="F1 Score", color="#F79009", alpha=0.8)

    ax.set_xticks(x)
    ax.set_xticklabels(fields, fontsize=11)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title("NLP Extraction — Precision / Recall / F1 per Field", fontsize=13, fontweight="bold")
    ax.legend()
    ax.set_ylim(0, 1.15)
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "nlp_field_f1_scores.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_field_f1_scores.png'}")


def _plot_extraction_success(results, out: Path):
    exact = sum(1 for r in results if r["exact_match"])
    partial_only = sum(1 for r in results if r["partial_match"] and not r["exact_match"])
    none_match = len(results) - exact - partial_only

    fig, ax = plt.subplots(figsize=(7, 5))
    sizes = [exact, partial_only, none_match]
    labels = [f"Exact Match\n({exact})", f"Partial Match\n({partial_only})", f"No Match\n({none_match})"]
    colors = ["#12B76A", "#F79009", "#F04438"]
    explode = (0.03, 0.03, 0.06)

    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, explode=explode,
        autopct="%1.1f%%", startangle=90, pctdistance=0.75,
        textprops={"fontsize": 11},
    )
    for at in autotexts:
        at.set_fontweight("bold")
    ax.set_title("NLP Extraction — Query Match Breakdown", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / "nlp_extraction_success.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_extraction_success.png'}")


def _plot_field_heatmap(results, fields, out: Path):
    n = min(30, len(results))
    data = np.zeros((n, len(fields)))
    query_labels = []

    for i in range(n):
        r = results[i]
        for j, f in enumerate(fields):
            data[i, j] = 1 if r[f"{f}_correct"] else 0
        label = r["query"][:45] + ("..." if len(r["query"]) > 45 else "")
        query_labels.append(label)

    fig, ax = plt.subplots(figsize=(8, max(8, n * 0.35)))
    sns.heatmap(
        data, annot=False, cmap=["#F04438", "#12B76A"],
        xticklabels=[f.title() for f in fields],
        yticklabels=query_labels, ax=ax,
        cbar=False, linewidths=0.5, linecolor="white",
    )
    ax.set_title("NLP Extraction — Per-Query Field Correctness", fontsize=13, fontweight="bold")
    ax.set_xlabel("Field", fontsize=12)

    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor="#12B76A", label="Correct"),
        Patch(facecolor="#F04438", label="Incorrect"),
    ]
    ax.legend(handles=legend_elements, loc="upper right", bbox_to_anchor=(1.25, 1))

    fig.tight_layout()
    fig.savefig(out / "nlp_field_heatmap.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_field_heatmap.png'}")


def _plot_regex_vs_ollama(regex_m, ollama_m, fields, out: Path):
    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(fields))
    w = 0.35

    regex_accs = [regex_m[f"accuracy_{f}"] for f in fields]
    ollama_accs = [ollama_m[f"accuracy_{f}"] for f in fields]

    bars1 = ax.bar(x - w / 2, regex_accs, w, label="Regex Fallback", color="#2E75B6", alpha=0.85)
    bars2 = ax.bar(x + w / 2, ollama_accs, w, label="Ollama / Gemma 4", color="#12B76A", alpha=0.85)

    for bar, val in zip(bars1, regex_accs):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                f"{val:.0%}", ha="center", fontsize=9, color="#2E75B6", fontweight="bold")
    for bar, val in zip(bars2, ollama_accs):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                f"{val:.0%}", ha="center", fontsize=9, color="#12B76A", fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels([f.title() for f in fields], fontsize=11)
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("NLP Extraction — Regex vs Ollama Per-Field Accuracy", fontsize=13, fontweight="bold")
    ax.legend(fontsize=11)
    ax.set_ylim(0, 1.15)
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "nlp_regex_vs_ollama.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_regex_vs_ollama.png'}")


def _plot_ollama_latency(latencies, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(latencies, bins=15, color="#F79009", alpha=0.75, edgecolor="white")
    mean_lat = np.mean(latencies)
    p95_lat = np.percentile(latencies, 95)
    ax.axvline(x=mean_lat, color="#F04438", lw=2, linestyle="--",
               label=f"Mean = {mean_lat:.2f}s")
    ax.axvline(x=p95_lat, color="#1F6099", lw=2, linestyle=":",
               label=f"P95 = {p95_lat:.2f}s")
    ax.set_xlabel("Latency (seconds)", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("Ollama NLP Extraction — Latency Distribution", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "nlp_ollama_latency.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'nlp_ollama_latency.png'}")


if __name__ == "__main__":
    run()
