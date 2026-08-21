#!/usr/bin/env python3
"""
Builds disagreements.html (static, baked-in data) from cfb_power_ratings.csv.

Phase 5 roadmap item: "Biggest disagreements between Weaver Analytics and
public perception." Uses the model's own rank (POWER_RATING_SHRUNK) against
SP+ (Bill Connelly's public rating, already pulled into every row via the
CFBD /talent + advanced-stats endpoints and already shown on the CFB
dashboard as a benchmark). No new API calls, no hand-scoring - purely a
rank-difference calculation on two numbers that already exist per team.

SP+ is a defensible "public perception" proxy: it's a well-known, publicly
published rating, not a strawman. A couple of teams without an SP+ value
(most likely no historical data - e.g. a team's first FBS season) are
dropped from the comparison rather than guessed at.

Usage (from the my-analytics-site folder):
    python3 scripts/build_disagreements.py [path-to-cfb_model_pipeline]
"""
import sys
import os
import datetime
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
DEFAULT_SRC = os.path.join(REPO_ROOT, "..", "CFB Model", "cfb_model_pipeline")


def load_ratings(src):
    path = os.path.join(src, "cfb_power_ratings.csv")
    df = pd.read_csv(path)
    df = df.dropna(subset=["SP_PLUS", "POWER_RATING_SHRUNK"]).copy()
    df["our_rank"] = df["POWER_RATING_SHRUNK"].rank(ascending=False, method="min").astype(int)
    df["sp_rank"] = df["SP_PLUS"].rank(ascending=False, method="min").astype(int)
    df["rank_gap"] = df["our_rank"] - df["sp_rank"]  # negative = we rank them higher than SP+
    return df


def rows_for(df, ascending, n=15):
    sorted_df = df.reindex(df["rank_gap"].abs().sort_values(ascending=False).index) if False else None
    # Higher on us than SP+: most negative rank_gap first
    d = df.sort_values("rank_gap", ascending=ascending).head(n)
    out = []
    for _, r in d.iterrows():
        gap = int(r["rank_gap"])
        gap_label = f"{abs(gap)} spots higher" if gap < 0 else f"{abs(gap)} spots lower"
        out.append(
            f"""      <tr><td>{r['team']}</td><td class="num">#{int(r['our_rank'])}</td><td class="num">#{int(r['sp_rank'])}</td><td>{gap_label}</td><td>{r.get('conference','')}</td></tr>"""
        )
    return "\n".join(out)


def build_html(df, generated_at, n_teams):
    higher_rows = rows_for(df, ascending=True, n=15)   # most negative gap = we rate them highest relative to SP+
    lower_rows = rows_for(df, ascending=False, n=15)    # most positive gap = we rate them lowest relative to SP+

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Model vs. Public Perception — Weaver Analytics</title>
<meta name="description" content="Where the CFB model disagrees most with SP+, a well-known public rating - ranked by the gap, not a hot take.">
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
    <h1>Where the model disagrees hardest with public perception — and by how much, not by vibes.</h1>
    <p class="lede">SP+ (Bill Connelly's rating, one of the most widely cited public power ratings in college football) is the benchmark here, not a strawman. Every team below is ranked by real rank-position gap between our Power Score and SP+ — not cherry-picked, this is the full sorted list. Disagreement isn't proof either side is wrong; it's a flag for which games are worth watching more closely.</p>
    <p style="font-size:13px;color:var(--ink-faint);margin-top:10px;">Data as of {generated_at}, {n_teams} teams with both ratings available. Full methodology: <a href="cfb-model/methodology.html">CFB Model Methodology</a>.</p>
  </section>

  <h2 class="section-title"><span class="section-eyebrow">We're higher on them</span>Teams the model rates well above their SP+ rank</h2>
  <div class="tblwrap"><table class="rank-table">
    <tr><th>Team</th><th class="num">Our rank</th><th class="num">SP+ rank</th><th>Gap</th><th>Conf.</th></tr>
{higher_rows}
  </table></div>

  <h2 class="section-title"><span class="section-eyebrow">We're lower on them</span>Teams the model rates well below their SP+ rank</h2>
  <div class="tblwrap"><table class="rank-table">
    <tr><th>Team</th><th class="num">Our rank</th><th class="num">SP+ rank</th><th>Gap</th><th>Conf.</th></tr>
{lower_rows}
  </table></div>

  <p style="color:var(--ink-faint);font-size:13px;max-width:680px;margin-top:32px;">This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser. Re-run <code>scripts/build_disagreements.py</code> any time <code>cfb_power_ratings.csv</code> refreshes.</p>
</main>

<footer class="site-footer">
  Weaver Analytics — a personal project.
</footer>

</body>
</html>
"""


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    df = load_ratings(src)
    generated_at = datetime.date.today().isoformat()
    html = build_html(df, generated_at, len(df))
    out_path = os.path.join(REPO_ROOT, "disagreements.html")
    with open(out_path, "w") as f:
        f.write(html)
    print(f"Wrote {out_path} ({len(df)} teams compared)")


if __name__ == "__main__":
    main()
