#!/usr/bin/env python3
"""
Builds regression-watch.html (static, baked-in data) from assets/data/nfl-data.json.

Phase 5 roadmap item: "Teams likely to regress." Uses preseason_regression,
a field the NFL pipeline already computes for every team: -1 * (last
season's actual wins minus Pythagorean-expected wins) * REGRESSION_SCALE.
A team that won MORE games than its point differential predicted (got
"lucky") scores negative here and is due to fall back; a team that won
FEWER games than its point differential predicted ("unlucky") scores
positive and is due to bounce back. This is a formula, not a judgment
call - same status as Baseline, not the hand-scored Trajectory inputs.

No CFB equivalent: the CFB model is built from opponent-adjusted
efficiency stats, not a win-loss-vs-point-differential luck check, so
there's no matching field to rank there.

Usage (from the my-analytics-site folder):
    python3 scripts/build_regression_watch.py
"""
import os
import json
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
DATA_PATH = os.path.join(REPO_ROOT, "assets", "data", "nfl-data.json")


def fmt(v):
    sign = "+" if v >= 0 else ""
    return f"{sign}{v:.2f}"


def rows_for(power, ascending, n=12):
    d = sorted(power, key=lambda p: p["preseason_regression"], reverse=not ascending)[:n]
    out = []
    for p in d:
        out.append(
            f"""      <tr><td>{p['team']}</td><td class="num">{fmt(p['preseason_regression'])}</td><td>{p.get('division','')}</td></tr>"""
        )
    return "\n".join(out)


def build_html(power, generated_at):
    due_to_fall = rows_for(power, ascending=True, n=12)    # most negative first
    due_to_rise = rows_for(power, ascending=False, n=12)   # most positive first

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NFL Regression Watch — Weaver Analytics</title>
<meta name="description" content="Which NFL teams won more or fewer games last season than their point differential predicted - a formula-based luck check, not a hot take.">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>

<header class="site-header">
  <div class="brand">
    <img src="assets/img/logo-lockup-transparent.png" alt="Weaver Analytics">
  </div>
  <nav class="site-nav">
    <a href="index.html">Home</a>
    <a href="cfb-model/index.html">CFB Model</a>
    <a href="nfl-model/index.html">NFL Model</a>
    <a href="validation.html">Validation</a>
    <a href="pre-read/index.html">Pre-Read</a>
    <a href="dashboards/index.html">Dashboards</a>
    <a href="blog/index.html">Blog</a>
  </nav>
</header>

<main class="site-main">
  <section class="hero">
    <h1>Who got lucky last season, and who didn't — by the scoreboard, not the record.</h1>
    <p class="lede">Every team's win total implies an expected win total, based on how many points they scored and allowed (Pythagorean expectation). The gap between the two is the model's Regression component: teams that won more than their scoring margin justified are flagged as due to fall back, teams that won fewer are flagged as due to bounce back. This is a formula run on last season's real results, not a judgment call about this season.</p>
    <p style="font-size:13px;color:var(--ink-faint);margin-top:10px;">Data as of {generated_at}. NFL only — the CFB model doesn't compute an equivalent win-vs-point-differential luck check, so there's no matching CFB list.</p>
  </section>

  <h2 class="section-title"><span class="section-eyebrow">Due to fall back</span>Won more games than their point differential predicted</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Negative Regression pulls Power Score down heading into 2026 — these teams are the model's biggest bets against last year's record repeating.</p>
  <div class="tblwrap" style="max-width:520px;"><table class="rank-table">
    <tr><th>Team</th><th class="num">Regression</th><th>Division</th></tr>
{due_to_fall}
  </table></div>

  <h2 class="section-title"><span class="section-eyebrow">Due to bounce back</span>Won fewer games than their point differential predicted</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Positive Regression pulls Power Score up — these teams played better than their record showed last season, per the scoreboard, not the standings.</p>
  <div class="tblwrap" style="max-width:520px;"><table class="rank-table">
    <tr><th>Team</th><th class="num">Regression</th><th>Division</th></tr>
{due_to_rise}
  </table></div>

  <p style="color:var(--ink-faint);font-size:13px;max-width:680px;margin-top:32px;">Full methodology: <a href="nfl-model/methodology.html">NFL Model Methodology</a>. This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser. Re-run <code>scripts/build_regression_watch.py</code> any time <code>nfl-data.json</code> refreshes.</p>
</main>

<footer class="site-footer">
  Weaver Analytics — a personal project.
</footer>

</body>
</html>
"""


def main():
    with open(DATA_PATH) as f:
        data = json.load(f)
    power = data.get("power", [])
    generated_at = data.get("generated_at") or datetime.date.today().isoformat()
    html = build_html(power, generated_at)
    out_path = os.path.join(REPO_ROOT, "regression-watch.html")
    with open(out_path, "w") as f:
        f.write(html)
    print(f"Wrote {out_path} ({len(power)} teams)")


if __name__ == "__main__":
    main()
