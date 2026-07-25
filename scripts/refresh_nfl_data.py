#!/usr/bin/env python3
"""
Regenerates assets/data/nfl-data.json from the NFL model pipeline's CSV output.

Run this after refreshing the pipeline locally (nfl_model.py / nfl_win_probability.py /
nfl_monte_carlo.py / nfl_playoff_simulation.py / nfl_key_person_dependency.py in your
NFL Model/nfl_model_pipeline folder), then commit + push so Netlify redeploys with the
new snapshot. This site is static — the pipeline never runs in the browser or on Netlify.

Usage (from the my-analytics-site folder):
    python3 scripts/refresh_nfl_data.py [path-to-nfl_model_pipeline]

Defaults to "../NFL Model/nfl_model_pipeline" relative to this repo, which is where it
lives if my-analytics-site sits next to "NFL Model" inside your Weaver Analytics folder.
Pass an explicit path if you've moved things.
"""
import sys
import os
import json
import datetime
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)


def build_game_date_lookup(src, season):
    """
    {(week, frozenset({team_a, team_b})): "YYYY-MM-DD"} from nflverse_cache/games.csv,
    keyed by team pair (not home/away) so it's immune to the same neutral-site
    home-flag quirk build_matchup_by_week already works around. Requires
    nfl_team_colors.TEAM_ABBR to translate games.csv's abbreviations
    ("BUF") to the model's full team names ("Bills").
    """
    games_path = os.path.join(src, "nflverse_cache", "games.csv")
    if not os.path.exists(games_path):
        return {}
    sys.path.insert(0, src)
    from nfl_team_colors import TEAM_ABBR
    abbr_to_name = {v: k for k, v in TEAM_ABBR.items()}
    abbr_to_name["LA"] = "Rams"  # legacy nflverse code, harmless if unused

    df = pd.read_csv(games_path)
    df = df[(df["season"] == season) & (df["game_type"] == "REG")]
    lookup = {}
    for _, row in df.iterrows():
        home = abbr_to_name.get(row["home_team"])
        away = abbr_to_name.get(row["away_team"])
        if not home or not away:
            continue
        lookup[(int(row["week"]), frozenset([home, away]))] = row["gameday"]
    return lookup


def build_team_schedule(schedule_win_prob_rows, schedule, date_lookup):
    """
    Per-team ordered schedule (all 18 weeks, BYE included) with real calendar
    dates attached where available, for the Team Detail "upcoming schedule"
    column — lets the dashboard filter to "next N games" from today's date
    instead of showing a flat, undated 18-game list.
    """
    team_weeks = build_team_weeks(schedule)
    rows_by_team = {}
    for row in schedule_win_prob_rows:
        rows_by_team.setdefault(row["team"], []).append(row)

    team_schedule = {}
    for team, entries in schedule.items():
        weeks = team_weeks.get(team, [])
        rows = rows_by_team.get(team, [])
        rows_by_week = {}
        for entry, row in zip(weeks, rows):
            rows_by_week[entry["week"]] = row

        games = []
        for i, entry in enumerate(entries):
            week = i + 1
            if entry.get("type") != "GAME":
                games.append({"week": week, "bye": True})
                continue
            row = rows_by_week.get(week)
            date = date_lookup.get((week, frozenset([team, entry["opponent"]])))
            games.append({
                "week": week,
                "bye": False,
                "opponent": entry["opponent"],
                "home": entry["home"],
                "date": date,
                "spread": row["spread"] if row else None,
                "win_prob": row["win_prob"] if row else None,
            })
        team_schedule[team] = games
    return team_schedule


def records(path):
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    df = df.astype(object).where(pd.notnull(df), None)
    return df.to_dict("records")


def build_team_weeks(schedule):
    """
    parsed_schedule_final.json gives each team an ordered list of 18 entries
    (GAME or BYE) — list index + 1 is that team's week number, consistently,
    since BYE weeks are represented as their own entry rather than skipped.
    Returns {team: [{"week": int, "opponent": str, "home": bool} or None for BYE, ...]}
    """
    team_weeks = {}
    for team, entries in schedule.items():
        weeks = []
        for i, entry in enumerate(entries):
            week = i + 1
            if entry.get("type") == "GAME":
                weeks.append({"week": week, "opponent": entry["opponent"], "home": entry["home"]})
        team_weeks[team] = weeks
    return team_weeks


def build_matchup_by_week(schedule_win_prob_rows, schedule):
    """
    nfl_schedule_win_prob.csv has one row per (team, opponent) perspective —
    272 games x 2 rows = 544 rows (plus international games appear as "INTL"
    for both teams), no week number. compute_schedule_table() in
    nfl_win_probability.py builds this CSV by iterating `schedule.items()` in
    the exact same order used here to build team_weeks(), skipping non-GAME
    entries identically — so each team's rows in the CSV line up positionally,
    1:1 and in order, with that team's own week list. No name-matching or
    fuzzy game-pairing needed: zip them.

    Each row's own `site` (HOME/AWAY/INTL) is computed independently per team
    from that team's schedule entry, so it's immune to the documented
    neutral-site "home: true on both sides" parser quirk (§3h) that affects
    the raw `home` flag — use `site` directly rather than re-deriving home/away.
    """
    team_weeks = build_team_weeks(schedule)

    rows_by_team = {}
    for row in schedule_win_prob_rows:
        rows_by_team.setdefault(row["team"], []).append(row)

    matchup_by_week = {}
    seen_games = set()
    for team, weeks in team_weeks.items():
        rows = rows_by_team.get(team, [])
        for entry, row in zip(weeks, rows):
            week = entry["week"]
            opponent = row["opponent"]
            site = row["site"]

            if site == "AWAY":
                continue  # the opponent's own HOME-site row is the canonical one
            if site == "INTL" and team > opponent:
                continue  # arbitrary stable pick: alphabetically-first team's row is canonical

            game_key = (week, frozenset([team, opponent]))
            if game_key in seen_games:
                continue
            seen_games.add(game_key)

            # played/scores/winner (in-season-updates plan, Phase E): present
            # on schedule_win_prob rows as of the Phase D pipeline change;
            # absent (played=False, scores=None) for any snapshot generated
            # before that change, so this stays backward-compatible with
            # older CSVs rather than crashing on a missing column.
            played = bool(row.get("played")) if "played" in row else False
            home_score = row.get("team_score") if played else None
            away_score = row.get("opp_score") if played else None

            matchup_by_week.setdefault(str(week), []).append({
                "week": week,
                "home_team": team,
                "away_team": opponent,
                "home_power": row["team_power"],
                "away_power": row["opp_power"],
                "hfa_adj": row["hfa_adj"],
                "spread": row["spread"],
                "win_prob": row["win_prob"],
                "neutral_site": site == "INTL",
                "played": played,
                "home_score": home_score,
                "away_score": away_score,
                "winner": row.get("winner") if played else None,
            })

    for week in matchup_by_week:
        matchup_by_week[week].sort(key=lambda g: (g["home_team"], g["away_team"]))

    return matchup_by_week


def main():
    default_src = os.path.join(REPO_ROOT, "..", "NFL Model", "nfl_model_pipeline")
    src = sys.argv[1] if len(sys.argv) > 1 else default_src
    src = os.path.abspath(src)

    if not os.path.isdir(src):
        print(f"Pipeline folder not found: {src}")
        print("Pass the path explicitly: python3 scripts/refresh_nfl_data.py /path/to/nfl_model_pipeline")
        sys.exit(1)

    power = records(os.path.join(src, "nfl_power_ratings.csv"))
    win_projections = records(os.path.join(src, "nfl_win_projections.csv"))
    monte_carlo = records(os.path.join(src, "nfl_monte_carlo_comparison.csv"))
    playoff = records(os.path.join(src, "nfl_playoff_probabilities.csv"))
    key_person = records(os.path.join(src, "nfl_key_person_dependency.csv"))
    schedule_win_prob = records(os.path.join(src, "nfl_schedule_win_prob.csv"))

    schedule_path = os.path.join(src, "parsed_schedule_final.json")
    matchup_by_week = {}
    team_schedule = {}
    weeks = []
    if os.path.exists(schedule_path) and schedule_win_prob:
        with open(schedule_path) as f:
            schedule = json.load(f)
        matchup_by_week = build_matchup_by_week(schedule_win_prob, schedule)
        weeks = sorted(int(w) for w in matchup_by_week.keys())
        date_lookup = build_game_date_lookup(src, season=2026)
        team_schedule = build_team_schedule(schedule_win_prob, schedule, date_lookup)

    data = {
        "power": power,
        "win_projections": win_projections,
        "monte_carlo": monte_carlo,
        "playoff": playoff,
        "key_person": key_person,
        "matchup_by_week": matchup_by_week,
        "team_schedule": team_schedule,
        "available_weeks": weeks,
        "generated_at": datetime.date.today().isoformat(),
    }

    out_dir = os.path.join(REPO_ROOT, "assets", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "nfl-data.json")
    with open(out_path, "w") as f:
        json.dump(data, f)

    total_games = sum(len(v) for v in matchup_by_week.values())
    print(f"Wrote {out_path}")
    print(f"  power rows: {len(power)}, win_projections: {len(win_projections)}, "
          f"monte_carlo: {len(monte_carlo)}, playoff: {len(playoff)}, key_person: {len(key_person)}")
    print(f"  weeks: {weeks}, total games across all weeks: {total_games}")
    print("Next: git add -A && git commit -m 'refresh nfl data' && git push")


if __name__ == "__main__":
    main()
