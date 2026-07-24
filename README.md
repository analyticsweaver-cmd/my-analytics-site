# Weaver Analytics site

Static personal site — dashboards + blog. No backend, no build step. Hosted on Netlify, deployed from this repo.

## Structure

```
my-analytics-site/
├── index.html          homepage
├── cfb-model/           "The Weaver Line" CFB dashboard (React via CDN, static data)
├── nfl-model/            "The Weaver Blitz" NFL dashboard (React via CDN, static data)
├── dashboards/           placeholder for future dashboards
├── blog/                 flat HTML posts
├── assets/
│   ├── css/site.css     shared site chrome (nav, home, blog, dashboards)
│   ├── data/            static JSON snapshots consumed by dashboards
│   └── img/              shared images (logo)
└── scripts/
    ├── refresh_cfb_data.py   regenerates assets/data/cfb-data.json from the CFB pipeline's CSVs
    └── refresh_nfl_data.py   regenerates assets/data/nfl-data.json from the NFL pipeline's CSVs
```

The `cfb-model/` and `nfl-model/` apps each have their own `styles.css` and local `assets/` (fonts, logo) — self-contained, don't touch the shared `assets/css/site.css`.

## Updating the CFB dashboard's data

The dashboard is a **static snapshot**, not a live connection to the pipeline. There's no server on Netlify running Python or holding your CFBD API key.

To refresh it:
1. Run your normal weekly pipeline locally in `CFB Model/cfb_model_pipeline` (`cfb_matchup.py`, `cfb_model.py`, etc. — same as always).
2. From this repo, run:
   ```bash
   python3 scripts/refresh_cfb_data.py
   ```
   (assumes `CFB Model/` sits next to this repo folder inside `Weaver Analytics/` — pass an explicit path otherwise)
3. Commit and push:
   ```bash
   git add -A
   git commit -m "refresh cfb data"
   git push
   ```
   Netlify redeploys automatically on push.

## Updating the NFL dashboard's data

Same static-snapshot model as the CFB dashboard — no backend, no live pipeline connection.

1. Run the NFL pipeline locally in `NFL Model/nfl_model_pipeline` (`nfl_model.py`, `nfl_win_probability.py`, `nfl_monte_carlo.py`, `nfl_playoff_simulation.py`, `nfl_key_person_dependency.py` — see that repo's README for the full run order). If you're updating scores in response to Phase 6's injury review queue, make that judgment call in `team_inputs.json` first, then re-run the pipeline — nothing here applies injury news automatically.
2. From this repo, run:
   ```bash
   python3 scripts/refresh_nfl_data.py
   ```
   (assumes `NFL Model/` sits next to this repo folder inside `Weaver Analytics/` — pass an explicit path otherwise)
3. Commit and push:
   ```bash
   git add -A
   git commit -m "refresh nfl data"
   git push
   ```
   Netlify redeploys automatically on push.

## Adding a blog post

Duplicate any existing `blog/post-N.html` as the next number, edit the title/date/content, and add a matching entry to `blog/index.html`.

## Local preview

From this folder:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.
