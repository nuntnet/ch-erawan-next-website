#!/usr/bin/env python3
"""
mstack AEO Panel Summary
Summarizes a monthly manual prompt-panel results CSV (data/aeo/results-YYYY-MM.csv):
mention / recommend / citation rates by platform and category, inaccurate answers,
top competitors, and optional month-over-month delta. Stdlib only.
"""

import argparse
import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent
YESNO = {"yes", "no"}
REQUIRED = ["platform", "prompt_id", "mentioned", "recommended", "cited_our_site", "info_accurate"]


def load_prompts(path: Path) -> dict:
    with open(path, newline="", encoding="utf-8") as f:
        return {r["prompt_id"]: r for r in csv.DictReader(f)}


def validate(rows: list, prompts: dict) -> list:
    """Return a list of human-readable problems; empty = clean."""
    problems = []
    seen = set()
    for i, r in enumerate(rows, start=2):
        for col in REQUIRED:
            if not (r.get(col) or "").strip():
                problems.append(f"row {i}: missing {col}")
        pid = (r.get("prompt_id") or "").strip()
        if prompts and pid not in prompts:
            problems.append(f"row {i}: unknown prompt_id {pid!r}")
        for col in ("mentioned", "recommended", "cited_our_site"):
            if (r.get(col) or "").strip().lower() not in YESNO:
                problems.append(f"row {i}: {col} must be yes/no, got {r.get(col)!r}")
        if (r.get("info_accurate") or "").strip().lower() not in YESNO | {"na"}:
            problems.append(f"row {i}: info_accurate must be yes/no/na, got {r.get('info_accurate')!r}")
        # Logical consistency: can't recommend/cite/judge accuracy of something not mentioned
        mentioned = (r.get("mentioned") or "").strip().lower()
        if mentioned == "no":
            if (r.get("recommended") or "").strip().lower() == "yes":
                problems.append(f"row {i}: recommended=yes but mentioned=no")
            if (r.get("info_accurate") or "").strip().lower() in ("yes", "no"):
                problems.append(f"row {i}: info_accurate should be na when mentioned=no")
        key = (r.get("platform", "").strip().lower(), pid)
        if key in seen:
            problems.append(f"row {i}: duplicate {key}")
        seen.add(key)
    return problems


def load_results(path: Path) -> list:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def rate(rows, col):
    if not rows:
        return None
    return sum(1 for r in rows if (r.get(col) or "").strip().lower() == "yes") / len(rows)


def fmt(x):
    return "  - " if x is None else f"{x * 100:4.0f}%"


def group(rows, keyfn):
    g = defaultdict(list)
    for r in rows:
        g[keyfn(r)].append(r)
    return g


def summarize(rows: list, prompts: dict) -> dict:
    cat = lambda r: (prompts.get(r["prompt_id"], {}).get("category") or "unknown")
    return {
        "n": len(rows),
        "overall": {c: rate(rows, c) for c in ("mentioned", "recommended", "cited_our_site")},
        "by_platform": {k: {c: rate(v, c) for c in ("mentioned", "recommended", "cited_our_site")} | {"n": len(v)}
                        for k, v in group(rows, lambda r: r["platform"].strip().lower()).items()},
        "by_category": {k: {c: rate(v, c) for c in ("mentioned", "recommended", "cited_our_site")} | {"n": len(v)}
                        for k, v in group(rows, cat).items()},
        "inaccurate": [r for r in rows if (r.get("info_accurate") or "").strip().lower() == "no"],
        "competitors": Counter(c.strip() for r in rows for c in (r.get("competitors") or "").split(";") if c.strip()),
    }


def print_table(title, data, prev=None):
    print(f"\n{title}")
    print(f"  {'':16} {'n':>4} {'mention':>8} {'recommend':>10} {'cited':>7}" + ("   Δ mention  Δ recommend" if prev is not None else ""))
    for k in sorted(data):
        d = data[k]
        line = f"  {k:16} {d['n']:>4} {fmt(d['mentioned']):>8} {fmt(d['recommended']):>10} {fmt(d['cited_our_site']):>7}"
        if prev is not None:
            p = prev.get(k)
            def delta(c):
                if not p or p[c] is None or d[c] is None:
                    return "     n/a"
                return f"{(d[c] - p[c]) * 100:+7.0f}pt"
            line += f"  {delta('mentioned')}  {delta('recommended')}"
        print(line)


def main():
    ap = argparse.ArgumentParser(description="Summarize a monthly AEO prompt-panel CSV")
    ap.add_argument("results", help="results-YYYY-MM.csv")
    ap.add_argument("--prev", help="previous month's results CSV for delta")
    ap.add_argument("--prompts", default=str(DATA / "prompts.csv"))
    args = ap.parse_args()

    for p in [args.results, args.prompts] + ([args.prev] if args.prev else []):
        if not Path(p).exists():
            print(f"❌ file not found: {p}")
            sys.exit(2)

    prompts = load_prompts(Path(args.prompts))
    rows = load_results(Path(args.results))
    if not rows:
        print("❌ no result rows")
        sys.exit(2)

    problems = validate(rows, prompts)
    if problems:
        print(f"❌ {len(problems)} data problem(s) — fix the CSV before reading the numbers:")
        for p in problems[:30]:
            print(f"  - {p}")
        sys.exit(1)

    s = summarize(rows, prompts)
    ps = summarize(load_results(Path(args.prev)), prompts) if args.prev else None

    print(f"AEO panel: {s['n']} answers, {len(s['by_platform'])} platform(s), {len(set(r['prompt_id'] for r in rows))} prompt(s)")
    o = s["overall"]
    print(f"Overall  mention {fmt(o['mentioned']).strip()} · recommend {fmt(o['recommended']).strip()} · cited our site {fmt(o['cited_our_site']).strip()}")
    print_table("By platform", s["by_platform"], ps["by_platform"] if ps else None)
    print_table("By category", s["by_category"], ps["by_category"] if ps else None)

    if s["competitors"]:
        print("\nRecommended instead of us (top 10)")
        for name, n in s["competitors"].most_common(10):
            print(f"  {n:>3} × {name}")

    if s["inaccurate"]:
        print(f"\n⚠️  {len(s['inaccurate'])} inaccurate answer(s) — fix at the source (site/GBP/directories):")
        for r in s["inaccurate"]:
            print(f"  - [{r['platform']}] {r['prompt_id']}: {(r.get('notes') or '').strip() or '(no note)'}")

    print("\nNote: AI answers vary run to run; judge monthly trends, not single results.")
    # Exit 0: this is a report. Data problems exit 1 above.


if __name__ == "__main__":
    main()
