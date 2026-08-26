#!/usr/bin/env python3
"""
Regenerates assets/data/cfb-data.json from the CFB model pipeline's CSV output.

Run this after refreshing the pipeline locally (cfb_backtest.py / cfb_matchup.py /
cfb_model.py in your CFB Model/cfb_model_pipeline folder), then commit + push so
Netlify redeploys with the new snapshot. This site is static — the pipeline and
its API key never run in the browser or on Netlify.

Usage (from the my-analytics-site folder):
    python3 scripts/refresh_cfb_data.py [path-to-cfb_model_pipeline]

Defaults to "../CFB Model/cfb_model_pipeline" relative to this repo, which is
where it lives if my-analytics-site sits next to CFB Model inside your
Weaver Analytics folder. Pass an explicit path if you've moved things.
"""
import sys
import os
import glob
import re
import json
import datetime
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)


def records(path):
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path)
    df = df.astype(object).where(pd.notnull(df), None)
    return df.to_dict("records")


def main():
    default_src = os.path.join(REPO_ROOT, "..", "CFB Model", "cfb_model_pipeline")
    src = sys.argv[1] if len(sys.argv) > 1 else default_src
    src = os.path.abspath(src)

    if not os.path.isdir(src):
        print(f"Pipeline folder not found: {src}")
        print("Pass the path explicitly: python3 scripts/refresh_cfb_data.py /path/to/cfb_model_pipeline")
        sys.exit(1)

    power = records(os.path.join(src, "cfb_power_ratings.csv"))
    history = records(os.path.join(src, "ratings_history.csv"))

    matchup_by_week = {}
    weeks = []
    for path in glob.glob(os.path.join(src, "matchup_predictions_week*.csv")):
        m = re.search(r"matchup_predictions_week(\d+)\.csv$", path)
        if m:
            wk = int(m.group(1))
            weeks.append(wk)
            matchup_by_week[str(wk)] = records(path)
    weeks = sorted(weeks)

    team_schedule = {}
    team_schedule_path = os.path.join(src, "cfb_team_schedule.json")
    if os.path.exists(team_schedule_path):
        with open(team_schedule_path) as f:
            team_schedule = json.load(f)

    # The aggregate model's rating-diff -> point-margin conversion (scale)
    # and flat home edge, refit against completed seasons by
    # cfb_backtest_multiseason.py - NOT static, so the site should always
    # read it live rather than hardcoding it in copy. None when the file
    # doesn't exist yet (backtest never run).
    margin_fit = None
    margin_fit_path = os.path.join(src, "cfb_margin_fit.json")
    if os.path.exists(margin_fit_path):
        with open(margin_fit_path) as f:
            margin_fit = json.load(f)
        margin_fit["last_calibrated"] = datetime.date.fromtimestamp(
            os.path.getmtime(margin_fit_path)
        ).isoformat()

    data = {
        "power": power,
        "history": history,
        "matchup_by_week": matchup_by_week,
        "available_weeks": weeks,
        "team_schedule": team_schedule,
        "margin_fit": margin_fit,
        "generated_at": datetime.date.today().isoformat(),
    }

    out_path = os.path.join(REPO_ROOT, "assets", "data", "cfb-data.json")
    with open(out_path, "w") as f:
        json.dump(data, f)

    print(f"Wrote {out_path}")
    print(f"  power rows: {len(power)}, history rows: {len(history)}, weeks: {weeks}, "
          f"team_schedule teams: {len(team_schedule)}, margin_fit: {margin_fit}")
    print("Next: git add -A && git commit -m 'refresh cfb data' && git push")


if __name__ == "__main__":
    main()
