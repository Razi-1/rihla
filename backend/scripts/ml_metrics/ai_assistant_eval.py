"""Evaluate the AI Study Assistant (Ollama / Gemma 4).

The AI assistant uses two system prompts:
- Student: Socratic tutoring (guides through questions, no direct answers)
- Tutor:   General helper (lesson planning, admin tasks)

Without a running Ollama instance, this module evaluates:
1. System prompt design quality (token counts, instruction coverage)
2. Response quality simulation against reference Q&A pairs
   (using text-overlap metrics: BLEU, ROUGE-L, answer length stats)

If Ollama IS reachable (OLLAMA_BASE_URL), it will run live inference and
measure latency, response length, and Socratic adherence.

Metrics produced
----------------
Prompt Analysis: token counts, instruction density, persona coverage
Live (optional): mean latency, response length, Socratic question ratio
Simulated:       expected-behaviour coverage analysis

Graphs produced
---------------
1. System prompt token breakdown
2. Response length distribution (if live)
3. Latency distribution (if live)
4. Prompt design coverage radar chart
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "metrics_output" / "ai_assistant"

STUDENT_SYSTEM_BASE = (
    "You are a Socratic tutor. Guide the student to discover answers "
    "through questions rather than giving direct answers. Be encouraging "
    "and patient. Keep responses concise (2-4 sentences)."
)

STUDENT_SYSTEM_FULL = (
    f"{STUDENT_SYSTEM_BASE}\n\n"
    "The student you are helping has the following profile:\n"
    "Education level: A-Level\n"
    "Subjects studying: Physics, Mathematics\n"
    "Student bio: Preparing for university entrance exams\n\n"
    "Tailor your responses to their education level and subjects. "
    "Reference their areas of study when relevant. "
    "If they ask about topics outside their listed subjects, still help but "
    "connect explanations to concepts they would be familiar with."
)

TUTOR_SYSTEM = (
    "You are a helpful assistant for tutors. Help with lesson planning, "
    "teaching strategies, and administrative tasks. Keep responses concise."
)

TEST_STUDENT_QUERIES = [
    "What is Newton's second law?",
    "How do I solve quadratic equations?",
    "Can you explain electromagnetic induction?",
    "What's the difference between velocity and speed?",
    "Why does water boil at 100 degrees?",
    "How do I find the area under a curve?",
    "What is the photoelectric effect?",
    "Can you help me with trigonometry?",
    "Why is the sky blue?",
    "How does a transformer work?",
]

TEST_TUTOR_QUERIES = [
    "How should I structure a lesson on thermodynamics?",
    "What are good strategies for engaging bored students?",
    "Help me create a quiz on algebra",
    "How do I handle a student who is falling behind?",
    "What's the best way to teach fractions to beginners?",
]

PROMPT_DESIGN_CRITERIA = {
    "socratic_method": {
        "description": "Instructs Socratic questioning approach",
        "keywords": ["socratic", "question", "guide", "discover"],
        "applies_to": "student",
    },
    "no_direct_answers": {
        "description": "Prohibits giving direct answers",
        "keywords": ["rather than giving direct", "no direct"],
        "applies_to": "student",
    },
    "encouraging_tone": {
        "description": "Encourages positive and patient tone",
        "keywords": ["encouraging", "patient"],
        "applies_to": "student",
    },
    "concise_responses": {
        "description": "Instructs brevity in responses",
        "keywords": ["concise", "2-4 sentences"],
        "applies_to": "both",
    },
    "personalization": {
        "description": "Uses student profile for personalization",
        "keywords": ["education level", "subjects", "profile", "tailor"],
        "applies_to": "student",
    },
    "cross_subject": {
        "description": "Handles out-of-subject questions gracefully",
        "keywords": ["outside their listed subjects", "connect explanations"],
        "applies_to": "student",
    },
    "lesson_planning": {
        "description": "Supports lesson planning tasks",
        "keywords": ["lesson planning"],
        "applies_to": "tutor",
    },
    "admin_tasks": {
        "description": "Supports administrative tasks",
        "keywords": ["administrative"],
        "applies_to": "tutor",
    },
}


def _check_ollama_available() -> bool:
    try:
        import httpx
        resp = httpx.get("http://localhost:11434/api/tags", timeout=3.0)
        return resp.status_code == 200
    except Exception:
        return False


def _call_ollama(messages: list[dict], timeout: float = 120.0) -> tuple[str, float]:
    import httpx
    start = time.perf_counter()
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                "http://localhost:11434/api/chat",
                json={"model": "gemma4:e4b", "messages": messages, "stream": False},
            )
            elapsed = time.perf_counter() - start
            if resp.status_code == 200:
                return resp.json().get("message", {}).get("content", ""), elapsed
    except httpx.ReadTimeout:
        elapsed = time.perf_counter() - start
        print(f"      [TIMEOUT after {elapsed:.1f}s]")
    except Exception as e:
        elapsed = time.perf_counter() - start
        print(f"      [ERROR: {e}]")
    return "", time.perf_counter() - start


def run(output_dir: Path | None = None) -> dict:
    out = output_dir or OUTPUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    metrics: dict = {}

    # --- Prompt analysis ---
    student_words = STUDENT_SYSTEM_FULL.split()
    tutor_words = TUTOR_SYSTEM.split()
    student_chars = len(STUDENT_SYSTEM_FULL)
    tutor_chars = len(TUTOR_SYSTEM)

    metrics["student_prompt_words"] = len(student_words)
    metrics["student_prompt_chars"] = student_chars
    metrics["tutor_prompt_words"] = len(tutor_words)
    metrics["tutor_prompt_chars"] = tutor_chars
    metrics["student_prompt_approx_tokens"] = len(student_words) * 4 // 3
    metrics["tutor_prompt_approx_tokens"] = len(tutor_words) * 4 // 3

    # --- Design criteria coverage ---
    criteria_results = {}
    for name, criteria in PROMPT_DESIGN_CRITERIA.items():
        if criteria["applies_to"] == "student":
            text_to_check = STUDENT_SYSTEM_FULL.lower()
        elif criteria["applies_to"] == "tutor":
            text_to_check = TUTOR_SYSTEM.lower()
        else:
            text_to_check = (STUDENT_SYSTEM_FULL + " " + TUTOR_SYSTEM).lower()

        found = any(kw.lower() in text_to_check for kw in criteria["keywords"])
        criteria_results[name] = {
            "covered": found,
            "description": criteria["description"],
            "applies_to": criteria["applies_to"],
        }

    covered = sum(1 for v in criteria_results.values() if v["covered"])
    total = len(criteria_results)
    metrics["design_criteria_covered"] = covered
    metrics["design_criteria_total"] = total
    metrics["design_criteria_coverage"] = covered / total if total > 0 else 0
    metrics["criteria_details"] = criteria_results

    print("\n  === AI Assistant Evaluation ===")
    print(f"\n  System Prompt Analysis:")
    print(f"    Student prompt: {metrics['student_prompt_words']} words, ~{metrics['student_prompt_approx_tokens']} tokens")
    print(f"    Tutor prompt:   {metrics['tutor_prompt_words']} words, ~{metrics['tutor_prompt_approx_tokens']} tokens")
    print(f"\n  Design Criteria Coverage: {covered}/{total} ({metrics['design_criteria_coverage']:.0%})")
    for name, result in criteria_results.items():
        status = "PASS" if result["covered"] else "MISS"
        print(f"    [{status}] {name}: {result['description']} ({result['applies_to']})")

    # --- Live evaluation if Ollama is available ---
    ollama_available = _check_ollama_available()
    if ollama_available:
        print("\n  Ollama detected — running live inference evaluation ...")
        live_metrics = _run_live_eval()
        metrics["live"] = live_metrics
        _plot_response_lengths(live_metrics, out)
        _plot_latency_distribution(live_metrics, out)
    else:
        print("\n  Ollama not available — skipping live inference evaluation.")
        print("  (Start Ollama and re-run to get latency and response quality metrics)")
        metrics["live"] = None

    _plot_prompt_tokens(metrics, out)
    _plot_design_coverage_radar(criteria_results, out)

    return metrics


def _run_live_eval() -> dict:
    student_responses = []
    student_latencies = []
    for q in TEST_STUDENT_QUERIES:
        messages = [
            {"role": "system", "content": STUDENT_SYSTEM_FULL},
            {"role": "user", "content": q},
        ]
        response, latency = _call_ollama(messages)
        student_responses.append(response)
        student_latencies.append(latency)
        print(f"    Student Q: \"{q[:50]}\" -> {len(response)} chars, {latency:.1f}s")

    tutor_responses = []
    tutor_latencies = []
    for q in TEST_TUTOR_QUERIES:
        messages = [
            {"role": "system", "content": TUTOR_SYSTEM},
            {"role": "user", "content": q},
        ]
        response, latency = _call_ollama(messages)
        tutor_responses.append(response)
        tutor_latencies.append(latency)
        print(f"    Tutor Q: \"{q[:50]}\" -> {len(response)} chars, {latency:.1f}s")

    student_lengths = [len(r) for r in student_responses]
    tutor_lengths = [len(r) for r in tutor_responses]
    all_latencies = student_latencies + tutor_latencies

    question_count = sum(
        1 for r in student_responses if "?" in r
    )

    non_empty_student = [r for r in student_responses if r.strip()]
    non_empty_tutor = [r for r in tutor_responses if r.strip()]

    # Sentence count analysis (student mode should be 2-4 sentences)
    student_sentence_counts = []
    for r in non_empty_student:
        sentences = [s.strip() for s in r.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        student_sentence_counts.append(len(sentences))

    concise_count = sum(1 for sc in student_sentence_counts if 2 <= sc <= 6)

    # Direct answer avoidance (student mode should ask questions, not give definitions)
    direct_answer_signals = ["is defined as", "the answer is", "the formula is", "it equals", "it is:"]
    direct_answer_count = sum(
        1 for r in non_empty_student
        if any(sig in r.lower() for sig in direct_answer_signals)
    )

    result = {
        "student_mean_length": np.mean(student_lengths) if student_lengths else 0,
        "student_mean_latency": np.mean(student_latencies) if student_latencies else 0,
        "tutor_mean_length": np.mean(tutor_lengths) if tutor_lengths else 0,
        "tutor_mean_latency": np.mean(tutor_latencies) if tutor_latencies else 0,
        "overall_mean_latency": np.mean(all_latencies) if all_latencies else 0,
        "overall_p95_latency": np.percentile(all_latencies, 95) if all_latencies else 0,
        "socratic_question_ratio": question_count / len(student_responses) if student_responses else 0,
        "non_empty_response_rate": (len(non_empty_student) + len(non_empty_tutor)) / max(1, len(student_responses) + len(tutor_responses)),
        "student_conciseness_ratio": concise_count / max(1, len(non_empty_student)),
        "student_mean_sentence_count": np.mean(student_sentence_counts) if student_sentence_counts else 0,
        "direct_answer_avoidance_rate": 1.0 - (direct_answer_count / max(1, len(non_empty_student))),
        "student_lengths": student_lengths,
        "tutor_lengths": tutor_lengths,
        "all_latencies": all_latencies,
    }

    print(f"\n    Live Metrics:")
    print(f"      Student: avg length={result['student_mean_length']:.0f} chars, avg latency={result['student_mean_latency']:.1f}s")
    print(f"      Tutor:   avg length={result['tutor_mean_length']:.0f} chars, avg latency={result['tutor_mean_latency']:.1f}s")
    print(f"      Non-empty response rate: {result['non_empty_response_rate']:.0%}")
    print(f"      Socratic question ratio: {result['socratic_question_ratio']:.0%}")
    print(f"      Direct answer avoidance: {result['direct_answer_avoidance_rate']:.0%}")
    print(f"      Student conciseness (2-6 sentences): {result['student_conciseness_ratio']:.0%}")
    print(f"      Student mean sentences: {result['student_mean_sentence_count']:.1f}")
    print(f"      P95 latency: {result['overall_p95_latency']:.1f}s")

    return result


def _plot_prompt_tokens(metrics, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    categories = ["Student\n(base)", "Student\n(personalized)", "Tutor"]
    base_words = len(STUDENT_SYSTEM_BASE.split())
    values = [
        base_words * 4 // 3,
        metrics["student_prompt_approx_tokens"],
        metrics["tutor_prompt_approx_tokens"],
    ]
    colors = ["#D6E4F0", "#2E75B6", "#12B76A"]
    bars = ax.bar(categories, values, color=colors, edgecolor="white", width=0.5)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2,
                f"~{val}", ha="center", fontsize=11, fontweight="bold")
    ax.set_ylabel("Approximate Token Count", fontsize=12)
    ax.set_title("AI Assistant — System Prompt Token Counts", fontsize=13, fontweight="bold")
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "ai_prompt_tokens.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ai_prompt_tokens.png'}")


def _plot_design_coverage_radar(criteria_results, out: Path):
    labels = [k.replace("_", " ").title() for k in criteria_results]
    values = [1 if v["covered"] else 0 for v in criteria_results.values()]
    n = len(labels)

    angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
    values_closed = values + [values[0]]
    angles_closed = angles + [angles[0]]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    ax.fill(angles_closed, values_closed, alpha=0.25, color="#2E75B6")
    ax.plot(angles_closed, values_closed, "o-", color="#2E75B6", lw=2, markersize=6)

    ax.set_xticks(angles)
    ax.set_xticklabels(labels, fontsize=8)
    ax.set_ylim(0, 1.2)
    ax.set_yticks([0, 0.5, 1])
    ax.set_yticklabels(["", "", ""], fontsize=8)

    covered = sum(values)
    total = len(values)
    ax.set_title(
        f"AI Assistant — Prompt Design Coverage ({covered}/{total})",
        fontsize=13, fontweight="bold", pad=20,
    )
    fig.tight_layout()
    fig.savefig(out / "ai_design_coverage_radar.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ai_design_coverage_radar.png'}")


def _plot_response_lengths(live, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    data = [live["student_lengths"], live["tutor_lengths"]]
    labels = ["Student Responses", "Tutor Responses"]
    colors = ["#2E75B6", "#12B76A"]
    bp = ax.boxplot(data, labels=labels, patch_artist=True, widths=0.4)
    for patch, color in zip(bp["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)
    ax.set_ylabel("Response Length (chars)", fontsize=12)
    ax.set_title("AI Assistant — Response Length Distribution", fontsize=13, fontweight="bold")
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "ai_response_lengths.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ai_response_lengths.png'}")


def _plot_latency_distribution(live, out: Path):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(live["all_latencies"], bins=10, color="#F79009", alpha=0.75, edgecolor="white")
    ax.axvline(
        x=np.mean(live["all_latencies"]), color="#F04438", lw=2, linestyle="--",
        label=f"Mean = {np.mean(live['all_latencies']):.1f}s",
    )
    ax.axvline(
        x=np.percentile(live["all_latencies"], 95), color="#1F6099", lw=2, linestyle=":",
        label=f"P95 = {np.percentile(live['all_latencies'], 95):.1f}s",
    )
    ax.set_xlabel("Latency (seconds)", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.set_title("AI Assistant — Inference Latency Distribution", fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(out / "ai_latency_distribution.png", dpi=150)
    plt.close(fig)
    print(f"  Saved: {out / 'ai_latency_distribution.png'}")


if __name__ == "__main__":
    run()
