import json
import os
from collections import defaultdict

RESULTS_PATH = "eval/results.json"

def score():
    if not os.path.exists(RESULTS_PATH):
        print(f"Error: {RESULTS_PATH} not found. Run eval/run_eval.py first.")
        return

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    total = len(results)
    if total == 0:
        print("No evaluation results to score.")
        return

    correct = sum(1 for r in results if r.get("predicted_accent") == r.get("true_accent"))
    overall_acc = (correct / total) * 100

    # Per-class accuracy
    per_class = defaultdict(lambda: {"correct": 0, "total": 0})
    for r in results:
        true_cls = r.get("true_accent", "Unknown")
        per_class[true_cls]["total"] += 1
        if r.get("predicted_accent") == true_cls:
            per_class[true_cls]["correct"] += 1

    # Confusion matrix
    confusion = defaultdict(lambda: defaultdict(int))
    all_classes = set()
    for r in results:
        t = r.get("true_accent", "Unknown")
        p = r.get("predicted_accent", "Unknown")
        confusion[t][p] += 1
        all_classes.add(t)
        all_classes.add(p)

    print("\n" + "=" * 64)
    print("           EMPIRICAL BLIND EVALUATION METRICS REPORT            ")
    print("=" * 64)
    print(f"\nTOTAL EVALUATED SAMPLES : {total}")
    print(f"CORRECT PREDICTIONS     : {correct}")
    print(f"OVERALL ACCURACY        : {overall_acc:.2f}%\n")

    print("-" * 64)
    print(f"{'ACCENT CLASS':<22} {'CORRECT':<10} {'TOTAL':<10} {'ACCURACY'}")
    print("-" * 64)
    for cls in sorted(per_class.keys()):
        stats = per_class[cls]
        acc = (stats["correct"] / stats["total"]) * 100
        print(f"{cls:<22} {stats['correct']:<10} {stats['total']:<10} {acc:>6.1f}%")
    print("-" * 64)

    print("\n" + "=" * 64)
    print("        CONFUSION MATRIX (Ground Truth -> Model Predictions)    ")
    print("=" * 64)
    for true_cls in sorted(confusion.keys()):
        preds = confusion[true_cls]
        print(f"\n[TRUE: {true_cls}] (n={sum(preds.values())})")
        for pred_cls in sorted(preds.keys()):
            count = preds[pred_cls]
            marker = "✓ [CORRECT]" if pred_cls == true_cls else "✗ [CONFUSED]"
            pct = (count / sum(preds.values())) * 100
            print(f"    {marker:<14} -> {pred_cls:<20}: {count} ({pct:.0f}%)")

    # Confusable dialect pair analysis
    confusions = []
    for t in confusion:
        for p, cnt in confusion[t].items():
            if t != p:
                confusions.append((t, p, cnt))

    print("\n" + "-" * 64)
    print("DIALECT CONFUSIONS / WEAK SPOTS IDENTIFIED:")
    if not confusions:
        print("  ✓ Zero cross-accent confusions observed in this evaluation set.")
    else:
        for t, p, cnt in confusions:
            print(f"  • Confused '{t}' with '{p}' ({cnt} sample{'s' if cnt > 1 else ''})")
    print("-" * 64 + "\n")

if __name__ == "__main__":
    score()
