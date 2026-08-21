#!/usr/bin/env python3
"""
Builds position-turnover.html (static, baked-in data) from
roster_turnover_all_teams_{season}.json — the league-wide output of
CFB Model/cfb_model_pipeline/cfb_roster_turnover.py --all-teams.

Ranks teams by real, counted roster turnover, split out by position
group (QB, RB, WR/TE, OL, DL, LB, Secondary) and by side of the ball
(Offense = QB+RB+WR/TE+OL, Defense = DL+LB+Secondary). This is the
Phase 3/5 roadmap payoff: "biggest offensive/defensive rebuilds" and
"position groups with the largest turnover."

Deliberately framed as TURNOVER, not "upgrade" or "improvement" - the
underlying data (who left, who's incoming, at what position) is real
and countable, but scoring whether a swap was actually a net talent
gain would mean inventing a weighting scheme across recruiting stars,
transfer usage%, and PPA that this model doesn't validate anywhere
else. Turnover share is honest; a quality score wouldn't be.

Usage (from the my-analytics-site folder):
    python3 scripts/build_position_turnover.py [path-to-cfb_model_pipeline]
"""
import sys
import os
import json
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
DEFAULT_SRC = os.path.join(REPO_ROOT, "..", "CFB Model", "cfb_model_pipeline")

POSITION_GROUP_ORDER = ["QB", "RB", "WR/TE", "OL", "DL", "LB", "Secondary"]
OFFENSE_GROUPS = ["QB", "RB", "WR/TE", "OL"]
DEFENSE_GROUPS = ["DL", "LB", "Secondary"]


def find_data_file(src):
    # season isn't hardcoded - pick up whatever roster_turnover_all_teams_*.json
    # is newest in the pipeline folder, so this doesn't need an edit every year.
    candidates = [f for f in os.listdir(src) if f.startswith("roster_turnover_all_teams_") and f.endswith(".json")]
    if not candidates:
        raise SystemExit(f"No roster_turnover_all_teams_*.json found in {src} - "
                          f"run `python cfb_roster_turnover.py --all-teams` there first.")
    candidates.sort(key=lambda f: os.path.getmtime(os.path.join(src, f)), reverse=True)
    return os.path.join(src, candidates[0])


def load_turnover(src):
    path = find_data_file(src)
    with open(path) as f:
        data = json.load(f)
    return data, path


def team_group_counts(team_data):
    """Returns {group: {returning, departed, incoming, turnover_pct}} for one team."""
    out = {}
    for g in team_data["position_groups"]:
        returning = len(g["returning"])
        departed = len(g["departed"])
        incoming = len(g["incoming"])
        denom = returning + departed
        pct = (departed / denom) if denom > 0 else None
        out[g["group"]] = {"returning": returning, "departed": departed, "incoming": incoming, "turnover_pct": pct}
    return out


def side_turnover(counts, groups):
    """Aggregate turnover % across a set of position groups (e.g. all of Offense)."""
    returning = sum(counts[g]["returning"] for g in groups)
    departed = sum(counts[g]["departed"] for g in groups)
    denom = returning + departed
    return (departed / denom) if denom > 0 else None


def build_rows(all_teams, keyfn, n=15):
    scored = [(team, keyfn(counts)) for team, counts in all_teams.items()]
    scored = [(t, v) for t, v in scored if v is not None]
    scored.sort(key=lambda x: x[1], reverse=True)
    rows = []
    for i, (team, pct) in enumerate(scored[:n], 1):
        rows.append(f'      <tr><td class="rank">{i}</td><td>{team}</td><td class="num">{pct*100:.0f}%</td></tr>')
    return "\n".join(rows)


def build_group_rows(all_teams, group, n=10):
    scored = [(team, counts[group]["turnover_pct"], counts[group]["departed"], counts[group]["returning"])
              for team, counts in all_teams.items() if counts[group]["turnover_pct"] is not None]
    scored.sort(key=lambda x: x[1], reverse=True)
    rows = []
    for i, (team, pct, dep, ret) in enumerate(scored[:n], 1):
        rows.append(f'      <tr><td class="rank">{i}</td><td>{team}</td><td class="num">{pct*100:.0f}%</td>'
                     f'<td class="num">{dep} out / {ret} back</td></tr>')
    return "\n".join(rows)


def build_html(data, generated_at, source_generated_at):
    all_teams = {team: team_group_counts(td) for team, td in data["teams"].items()}

    offense_rows = build_rows(all_teams, lambda c: side_turnover(c, OFFENSE_GROUPS))
    defense_rows = build_rows(all_teams, lambda c: side_turnover(c, DEFENSE_GROUPS))

    group_tables = []
    for g in POSITION_GROUP_ORDER:
        rows = build_group_rows(all_teams, g)
        group_tables.append(f"""    <div class="tblwrap"><table class="rank-table">
      <tr><th colspan="4" style="text-align:left;font:700 13px var(--font-sans);color:var(--ink);padding-bottom:2px;">{g}</th></tr>
      <tr><th>#</th><th>Team</th><th class="num">Turnover</th><th class="num">Departed / Returning</th></tr>
{rows}
    </table></div>""")
    group_grid = "\n".join(group_tables)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CFB Position-Group Roster Turnover — Weaver Analytics</title>
<meta name="description" content="Which college football teams rebuilt the most by position group this offseason — real counted departures (portal, draft, presumed graduation) vs. returning players, split by offense/defense and by QB, RB, WR/TE, OL, DL, LB, and Secondary.">
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
    <h1>Which rosters actually turned over this offseason — position by position, not just top-line.</h1>
    <p class="lede">Every FBS team's last-known roster, reconstructed player by player: who left (transfer portal, NFL draft, or presumed graduated), who's incoming (transfer portal or HS signing class), broken out across seven position groups. Turnover share, not a quality score — this counts who changed, it doesn't grade whether the swap was a good one.</p>
    <p style="font-size:13px;color:var(--ink-faint);margin-top:10px;">Data as of {generated_at} (source roster/portal/draft/recruiting/usage/PPA pulls: {source_generated_at}). "Presumed graduated" departures are a labeled guess for 4th+ year players not found in the portal or draft data — not a confirmed fact. See the <a href="cfb-model/methodology.html">CFB methodology page</a>.</p>
  </section>

  <h2 class="section-title"><span class="section-eyebrow">Side of the ball</span>Biggest offensive rebuilds</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Share of QB + RB + WR/TE + OL that departed (portal, draft, or presumed graduated) rather than returning.</p>
  <div class="tblwrap" style="max-width:520px;"><table class="rank-table">
    <tr><th>#</th><th>Team</th><th class="num">Offense turnover</th></tr>
{offense_rows}
  </table></div>

  <h2 class="section-title"><span class="section-eyebrow">Side of the ball</span>Biggest defensive rebuilds</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Share of DL + LB + Secondary that departed rather than returning.</p>
  <div class="tblwrap" style="max-width:520px;"><table class="rank-table">
    <tr><th>#</th><th>Team</th><th class="num">Defense turnover</th></tr>
{defense_rows}
  </table></div>

  <h2 class="section-title"><span class="section-eyebrow">Position group</span>Most turnover by group</h2>
  <p style="color:var(--ink-muted);max-width:680px;">Top 10 per group, by share departed. A small group (e.g. a team that only rostered a handful of true QBs) can swing to 100% turnover on a single departure — read the "departed / returning" counts alongside the percentage, not the percentage alone.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-top:20px;">
{group_grid}
  </div>

  <p style="color:var(--ink-faint);font-size:13px;max-width:680px;margin-top:32px;">Full methodology: <a href="cfb-model/methodology.html">CFB Model Methodology</a>. See also: <a href="roster-movers.html">Offseason Roster Movement</a> (team-level talent/portal/returning-production view). This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser.</p>
</main>

<footer class="site-footer">
  Weaver Analytics — a personal project.
</footer>

</body>
</html>
"""


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    data, path = load_turnover(src)
    generated_at = datetime.date.today().isoformat()
    html = build_html(data, generated_at, data.get("generated_at", "unknown"))
    out_path = os.path.join(REPO_ROOT, "position-turnover.html")
    with open(out_path, "w") as f:
        f.write(html)
    print(f"Wrote {out_path} ({len(data['teams'])} teams, source: {os.path.basename(path)})")


if __name__ == "__main__":
    main()
