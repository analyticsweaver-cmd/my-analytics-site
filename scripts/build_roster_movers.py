#!/usr/bin/env python3
"""
Builds roster-movers.html (static, baked-in data) from cfb_power_ratings.csv.

Uses only columns the CFB pipeline already computes for all 136+ teams:
prior_z (personnel + coaching preseason prior, 75/25 blend), portal_net_z
(transfer portal net impact), returning_production_z (how much of last
year's production stayed). No new API calls, no hand-scoring - this is
Phase 3 roadmap content ("Biggest roster improvements/declines") built
entirely from data the pipeline already generates and nothing else.

Deliberately NOT included: Need-Fill and Stability (roadmap's other two
Phase 3 asks) - both are explicitly hand-scored analyst judgment per this
model's own methodology, not something to mass-produce unsupervised for
136 teams.

Usage (from the my-analytics-site folder):
    python3 scripts/build_roster_movers.py [path-to-cfb_model_pipeline]
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
    return df


def fmt_z(v):
    sign = "+" if v >= 0 else ""
    return f"{sign}{v:.2f}"


def rank_table_rows(df, col, ascending, n=15):
    sorted_df = df.sort_values(col, ascending=ascending).head(n)
    rows = []
    for i, (_, r) in enumerate(sorted_df.iterrows(), 1):
        rows.append(f"""      <tr><td class="rank">{i}</td><td>{r['team']}</td><td class="num">{fmt_z(r[col])}</td><td>{r.get('conference', '')}</td></tr>""")
    return "\n".join(rows)


def build_html(df, generated_at):
    best_outlook = rank_table_rows(df, "prior_z", ascending=False)
    worst_outlook = rank_table_rows(df, "prior_z", ascending=True)
    portal_winners = rank_table_rows(df, "portal_net_z", ascending=False)
    portal_losers = rank_table_rows(df, "portal_net_z", ascending=True)
    most_turnover = rank_table_rows(df, "returning_production_z", ascending=True)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CFB Offseason Roster Movement — Weaver Analytics</title>
<meta name="description" content="Which college football teams' rosters moved the most this offseason, by the model's own preseason personnel and coaching prior, transfer portal net impact, and returning production.">
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
    <h1>Who actually moved this offseason — by the numbers, not the headlines.</h1>
    <p class="lede">Ranked from the CFB model's own preseason inputs: recruiting talent, returning production, and transfer portal net impact (incoming production minus outgoing, weighted by real prior-season usage where available). These are the same numbers the model itself uses to set its preseason rating — nothing here is a separate "hot take" layer on top.</p>
    <p style="font-size:13px;color:var(--ink-faint);margin-top:10px;">Data as of {generated_at}. Deliberately not included: Need-Fill and Stability, the model's two roster-quality dimensions that are hand-scored analyst judgment rather than computed from data — see the <a href="cfb-model/methodology.html">CFB methodology page</a>.</p>
  </section>

  <h2 class="section-title"><span class="section-eyebrow">Overall offseason outlook</span>Best and worst preseason personnel + coaching prior</h2>
  <p style="color:var(--ink-muted);max-width:680px;">The model's own blended prior (75% personnel — talent, returning production, portal — plus 25% coaching continuity), z-scored against the FBS field. This is what the model shrinks each team's early-season rating toward before real games provide their own evidence.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-top:20px;">
    <div class="tblwrap"><table class="rank-table">
      <tr><th>#</th><th>Team</th><th class="num">Prior (z)</th><th>Conf.</th></tr>
{best_outlook}
    </table></div>
    <div class="tblwrap"><table class="rank-table">
      <tr><th>#</th><th>Team</th><th class="num">Prior (z)</th><th>Conf.</th></tr>
{worst_outlook}
    </table></div>
  </div>

  <h2 class="section-title"><span class="section-eyebrow">Transfer portal</span>Biggest net winners and losers</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Incoming transfer production minus outgoing, weighted primarily by each player's real prior-season usage rate at their origin team (blended with recruiting rating where a usage match exists, recruiting rating alone otherwise). This is the closest single number to "who won the portal."</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-top:20px;">
    <div class="tblwrap"><table class="rank-table">
      <tr><th>#</th><th>Team</th><th class="num">Portal net (z)</th><th>Conf.</th></tr>
{portal_winners}
    </table></div>
    <div class="tblwrap"><table class="rank-table">
      <tr><th>#</th><th>Team</th><th class="num">Portal net (z)</th><th>Conf.</th></tr>
{portal_losers}
    </table></div>
  </div>

  <h2 class="section-title"><span class="section-eyebrow">Continuity</span>Most roster turnover (least returning production)</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Lowest share of last year's on-field production (CFBD's usage/PPA-based returning-production metric) still on the roster. Low here isn't automatically bad — a team that replaced departed production with a strong portal class can still show up near the top of the outlook table above.</p>

  <div class="tblwrap" style="max-width:520px;"><table class="rank-table">
    <tr><th>#</th><th>Team</th><th class="num">Returning production (z)</th><th>Conf.</th></tr>
{most_turnover}
  </table></div>

  <p style="color:var(--ink-faint);font-size:13px;max-width:680px;margin-top:32px;">Full methodology: <a href="cfb-model/methodology.html">CFB Model Methodology</a>. This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser.</p>
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
    html = build_html(df, generated_at)
    out_path = os.path.join(REPO_ROOT, "roster-movers.html")
    with open(out_path, "w") as f:
        f.write(html)
    print(f"Wrote {out_path} ({len(df)} teams)")


if __name__ == "__main__":
    main()
