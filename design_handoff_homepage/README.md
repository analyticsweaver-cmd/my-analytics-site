# Handoff: Weaver Analytics homepage redesign

## Overview

Replacement for `index.html` in `analyticsweaver-cmd/my-analytics-site` (branch `main`).

The current homepage is a wall of prose followed by ten near-identical destination cards. Two problems: no visual or data interest, and flat hierarchy — nothing tells a first-time visitor what the site is or why the models should be trusted.

The redesign leads with a plain-English statement of what Weaver Analytics is, pairs it with a real accuracy chart, and reorganizes the ten destinations into two labeled columns (Dashboards & tools / Writing). Target audience is friends, word-of-mouth visitors, and future Substack subscribers — not practitioners. Plain English first, numbers in support.

**Every figure on the page is pulled from the repo's existing `validation.html`. Nothing is estimated, rounded to fit, or invented.** This is a stated brand rule. If a number below doesn't match what's in `validation.html` at implementation time, `validation.html` wins — flag the discrepancy rather than picking one.

## About the design files

`Weaver Homepage.dc.html` in this bundle is a **design reference created in HTML** — a prototype showing intended look and structure, not production code to copy directly. It uses a component runtime that does not exist in the target repo.

The target repo is a **static multi-page site: hand-written HTML files sharing `assets/css/site.css`, no build step, no framework.** Implement this as a plain `index.html` in that same style — semantic HTML, classes defined in `site.css`, no JS required for the page to render. Do not introduce a framework or a build step for this page.

The design file uses inline styles throughout because of its prototype runtime. **Do not carry inline styles into the repo.** Translate them into classes in `site.css` following whatever naming convention that file already uses.

## Fidelity

**High-fidelity.** Colors, type, spacing, and copy are final. Recreate pixel-accurately using the values in the Design tokens section below. All values come from the Weaver Analytics Design System.

## Page structure

Single scrolling page, seven bands top to bottom. Max content width **1240px**, centered, with **44px** horizontal padding inside that. Body background `--paper`.

### 1. Header

Full-width, `border-bottom: 1px solid var(--hairline)`. Inner row is max-width 1240px, `display:flex`, `align-items:center`, `justify-content:space-between`, `gap:24px`, padding `22px 44px`.

- **Left:** logo lockup image, `height:44px`. See Assets.
- **Right:** nav row, `display:flex`, `gap:22px`. Links are 12px / 700 / `letter-spacing:0.09em` / uppercase / color `--ink-muted`. Current page (`Home`) is `--steel`.
- Nav items in order: Home, CFB Model, NFL Model, Validation, Pre-Read, Dashboards, Blog → `index.html`, `cfb-model/index.html`, `nfl-model/index.html`, `validation.html`, `pre-read/index.html`, `dashboards/index.html`, `blog/index.html`.

### 2. Hero — ink scoreboard

Full-bleed `--ink` background, `--paper` text. This is the design system's "scoreboard mode," reserved for high-emphasis moments; the rest of the page stays on paper. Inner container max-width 1240px, padding `56px 44px 52px`, `display:grid`, `grid-template-columns:1fr 1fr`, `gap:56px`, `align-items:center`.

**Left column:**
- Eyebrow: `WEAVER ANALYTICS` — 12px / 700 / `0.09em` / uppercase / `--brass`, `margin-bottom:18px`.
- H1: "Football models, scored against seasons that already happened." — 46px / 900 / `line-height:1.08` / `text-wrap:pretty`, margin `0 0 20px`.
- Body: "Every NFL and FBS team gets a rating, every game gets a projection, and all of it is graded against 2023–2025. No betting lines feed the models." — 21px / 400 / `line-height:1.5`, `--paper` at `opacity:.86`, `max-width:500px`, margin `0 0 28px`.
- Link: "See the record →" → `validation.html` — 19px / 700 / `--brass`.

**Right column — accuracy chart card:**
- Container: `border:1px solid rgba(247,244,236,.18)`, `border-radius:14px`, padding `28px 30px`. No shadow (dark cards take no border-shadow treatment in this system).
- Header row: `display:flex`, `align-items:baseline`, `justify-content:space-between`, `gap:16px`, `margin-bottom:8px`. Left: `PROBABILITY ACCURACY` 12px / 700 / `0.09em` / uppercase / `--brass`. Right: "Brier · lower is better" 13px / `rgba(247,244,236,.6)`.
- Explainer: "How well a stated probability matches what happened. A coin flip scores 0.250." — 18px / `line-height:1.45` / `rgba(247,244,236,.75)`, `margin-bottom:24px`.
- Three bar rows in a `display:flex; flex-direction:column; gap:20px`.

Each bar row:
- Label/value row: `display:flex`, `align-items:baseline`, `justify-content:space-between`, `margin-bottom:8px`. Label 13px / 700 / `0.06em` / uppercase / `rgba(247,244,236,.75)`. Value 26px / 900 / `font-variant-numeric:tabular-nums`.
- Track: `height:14px`, `background:rgba(247,244,236,.12)`, `border-radius:8px`, `overflow:hidden`. Fill: `height:100%`, `border-radius:8px`, width per table below.

| Row | Value | Fill width | Fill color |
| --- | --- | --- | --- |
| CFB MODEL | 0.208 | 25.7% | `--green-light` |
| NFL MODEL | 0.2375 | 67.9% | `--steel` |
| COIN FLIP | 0.250 (in `rgba(247,244,236,.6)`) | 85.7% | `--neutral-tan` |

- Footnote: "1,979 CFB games and 816 NFL games, pooled 2023–2025. Axis starts at 0.190." — 13px / `rgba(247,244,236,.55)` / `line-height:1.45`, `margin-top:20px`.

**Important — the chart axis.** Bar widths encode a Brier scale running **0.190 to 0.260**, not 0 to 1. Width = `(value − 0.190) / 0.070`. A true-zero axis makes all three bars visually identical and hides the entire point of the chart. The zoomed axis is a deliberate call, and the footnote disclosing it is **not optional** — it must ship with the chart. If the numbers in `validation.html` change, recompute widths with that formula rather than eyeballing them.

### 3. Stat band

Full-width `--surface`, `border-bottom:1px solid var(--hairline)`. Inner max-width 1240px, `display:grid`, `grid-template-columns:repeat(4,1fr)`. Each cell padding `26px 28px`; cells 1–3 have `border-right:1px solid var(--hairline)`.

Per cell: label 12px / 700 / `0.09em` / uppercase / `--ink-muted` / `margin-bottom:10px`; value 40px / 900 / `line-height:1` / tabular-nums; sublabel 13px / `--ink-muted` / `margin-top:6px`.

| Label | Value | Sublabel |
| --- | --- | --- |
| CFB MARGIN ERROR | 13.71 | points off per game |
| NFL WINS CORRELATION | 0.382 | p < 0.001 |
| GAMES BACKTESTED | 2,795 | 816 NFL · 1,979 CFB |
| SIMULATED SEASONS | 20,000 | per NFL projection run |

2,795 = 816 + 1,979. Keep it consistent if either component changes.

### 4. How it works

Max-width 1240px, padding `52px 44px 8px`.

- Eyebrow: `HOW IT WORKS` — 12px / 700 / `0.09em` / uppercase / `--steel` / `margin-bottom:8px`.
- Heading: "Rate, project, then grade" — 30px / 900 / `margin-bottom:26px`.
- Three rows, each `display:grid`, `grid-template-columns:44px 1fr 1.4fr`, `gap:24px`, padding `22px 0`, `align-items:baseline`, `border-top:1px solid var(--hairline)`. The last row also takes `border-bottom`.
- Row number: 19px / 900 / `--brass`. Row title: 21px / 900. Row body: 19px / `line-height:1.5` / `--ink-muted`.

| # | Title | Body |
| --- | --- | --- |
| 01 | Rate every team | A Power Score built from personnel, coaching, transfer portal movement, and returning production. |
| 02 | Project the season | Ratings become matchup margins and win probabilities. The NFL model simulates the season 20,000 times for win totals and playoff odds. |
| 03 | Grade the guesses | Every projection is checked against 2023–2025. Features that don't improve accuracy come out — scheme continuity did, and the win correlation rose from 0.352 to 0.382. |

### 5. The record

Max-width 1240px, padding `44px 44px 8px`.

- Eyebrow: `THE RECORD` — 12px / 700 / `0.09em` / uppercase / `--steel` / `margin-bottom:8px`.
- Heading: "Caught, not hidden" — 30px / 900 / `margin-bottom:8px`.
- Intro: "The largest miss so far was overconfidence, not a bad pick: games the NFL model called at 76.5% were actually won 68.1% of the time. The gap is what the simulation fix closed." — 19px / `line-height:1.5` / `--ink-muted` / `max-width:680px` / `margin-bottom:26px`.
- Two-up: `display:grid`, `grid-template-columns:1fr 1.3fr`, `gap:28px`, `align-items:start`.

**Left — calibration bars.** Card: `--surface`, `border-radius:14px`, card shadow, padding `28px 30px`.
- Label `CALLED VS. ACTUAL` — 12px / 700 / `0.09em` / uppercase / `--ink-muted` / `margin-bottom:22px`.
- Bar area: `display:flex`, `align-items:flex-end`, `gap:22px`, `height:150px`. Two columns, each `flex:1`, `display:flex`, `flex-direction:column`, `justify-content:flex-end`. First column `height:100%`, second `height:89%` (68.1 / 76.5).
- Each column: value 22px / 900 / tabular-nums / `margin-bottom:8px`, then a filled div `height:100%`, `border-radius:8px 8px 0 0`. First bar `--steel` labeled 76.5%; second `--red-light` labeled 68.1%.
- Caption row below: `display:flex`, `gap:22px`, `margin-top:12px`, two `flex:1` cells at 13px / `--ink-muted` — "model said" and "actually happened".

**Right — comparison table.** Card: `--surface`, `border-radius:14px`, card shadow, `overflow:hidden`.
- Every row: `display:grid`, `grid-template-columns:1.5fr 1fr 1fr`, `gap:16px`, padding `16px 26px`. All rows except the last take `border-bottom:1px solid var(--hairline)`.
- Header row: 12px / 700 / `0.09em` / uppercase / `--ink-faint` — Check / NFL / CFB.
- Body rows: 18px. First cell `--ink-muted`; value cells `font-weight:600`.

| Check | NFL | CFB |
| --- | --- | --- |
| Games backtested | 816 | 1,979 |
| Calibration (Brier) | 0.2375 | 0.208 *(`--green`)* |
| Season simulation | 20,000 runs | Not built yet *(`--ink-faint`)* |
| Home-field advantage | Flat 2 pts | Team-specific *(`--green`)* |

- Below the two-up, `margin-top:22px`: link "Every miss, and what changed because of it →" → `validation.html`, 19px / 700.

### 6. Destination index

Max-width 1240px, padding `48px 44px 64px`. `display:grid`, `grid-template-columns:1fr 1fr`, `gap:40px`.

Each column header: 12px / 700 / `0.09em` / uppercase, `padding-bottom:14px`, `border-bottom:2px solid` its own color. Left column `DASHBOARDS & TOOLS` in `--brass`; right column `WRITING` in `--steel`.

Each link row: `display:flex`, `align-items:baseline`, `justify-content:space-between`, `gap:16px`, padding `18px 0`, `border-bottom:1px solid var(--hairline)` except the last in each column. Title 20px / 900 / `--ink`. Action 18px / 700 / `--steel` / `white-space:nowrap`.

**Dashboards & tools** — action text "Open →":
| Title | Href |
| --- | --- |
| The Weaver Line — CFB | `cfb-model/index.html` |
| The Weaver Blitz — NFL | `nfl-model/index.html` |
| CFB Roster Movement | `roster-movers.html` |
| Model vs. SP+ | `disagreements.html` |
| NFL Regression Watch | `regression-watch.html` |

**Writing** — action text "Read →":
| Title | Href |
| --- | --- |
| 2026 NFL Preseason Pre-Read | `pre-read/index.html` |
| Arkansas 2026: A Roster Rebuilt | `spotlights/arkansas-2026.html` |
| Blog | `blog/index.html` |
| What's next | `dashboards/index.html` — action "See plans →", whole row dimmed to `--ink-faint` |

Verify every href against the repo before shipping; correct any that have moved.

### 7. Footer

Full-width `--surface`, `border-top:1px solid var(--hairline)`. Inner max-width 1240px, `display:flex`, `align-items:center`, `justify-content:space-between`, `gap:24px`, padding `26px 44px`.

- Left: "Weaver Analytics — a personal project." 15px / `--ink-muted`.
- Right: `display:flex`, `gap:20px`, 12px / 700 / `0.09em` / uppercase — Validation (`validation.html`), NFL methodology (`nfl-model/methodology.html`), CFB methodology (`cfb-model/methodology.html`).

## Interactions & behavior

Deliberately minimal — this is a static page with no JS requirement.

- **Links:** define `a` and `a:hover` colors explicitly using `--link` / `--link-hover`. Do not leave any link at browser-default blue.
- **Destination rows:** add a hover state. Nothing was specified in the design; a background tint of `rgba(20,23,27,.03)` on the row, or the title shifting to `--steel`, both fit the system. Pick one and apply it consistently across both columns.
- **No animation.** The design system has no motion vocabulary and is explicitly print-first. Don't add scroll reveals, counters, or transitions beyond a hover color change.
- **Focus states:** the prototype doesn't define them. Add a visible keyboard focus ring using `--steel` — required for accessibility, and its absence in the mock is an omission, not a decision.

## Responsive behavior

Not specified in the design — it was built at desktop width. It needs a mobile story before shipping, and these are recommendations, not established design:

- **Hero grid** `1fr 1fr` → single column below ~900px. Chart card sits under the text. Drop H1 to ~34px.
- **Stat band** `repeat(4,1fr)` → `repeat(2,1fr)` on tablet, single column on phone. Swap `border-right` for `border-bottom` as cells stack.
- **How it works** `44px 1fr 1.4fr` → stack title above body, number inline with title.
- **The record** `1fr 1.3fr` → single column, calibration chart first.
- **Destination index** `1fr 1fr` → single column, Dashboards above Writing.
- **Table** — at narrow widths the 3-column grid gets cramped; either allow horizontal scroll or restack as label/value pairs.
- Reduce the 44px page padding to ~20px on phone.

Confirm the approach with Anna if any of it changes the desktop design.

## State management

None. No client state, no data fetching, no JS. Every number is hard-coded in the markup, sourced from `validation.html`.

If these figures are later generated from the model pipeline rather than hand-written, the four stat-band values, the three Brier bars, and the comparison table are the places to template — but that's a future change, not part of this handoff.

## Design tokens

From the Weaver Analytics Design System. `assets/css/site.css` may already define equivalents — reuse the repo's existing variables where they match rather than duplicating.

**Colors**
| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#14171B` | Primary text, hero background |
| `--paper` | `#F7F4EC` | Page background, text on ink |
| `--surface` | `#FFFFFF` | Cards, stat band, footer |
| `--ink-muted` | mid-gray | Secondary text, nav |
| `--ink-faint` | light gray | Footnotes, disabled rows |
| `--hairline` | subtle warm gray | All 1px borders |
| `--steel` | blue-gray | Neutral accent, current nav, links |
| `--brass` | gold | Highlight, eyebrows, step numbers |
| `--green` / `--green-light` | green | Value / efficiency |
| `--red-light` | red | Risk, the "actually happened" bar |
| `--neutral-tan` | tan | Diverging-scale midpoint, coin-flip bar |
| `--link` / `--link-hover` | — | Link colors |

Exact values are in `_ds/…/tokens/colors.css`. Copy them verbatim — the guide's rule is not to round or approximate.

Accent colors are **semantic, not decorative**: green = value, red = risk, brass = highlight, steel = neutral. Don't recolor for visual variety.

**Typography** — Archivo throughout, self-hosted woff2, weights 400/600/700/900.

| Role | Size / weight | Notes |
| --- | --- | --- |
| H1 | 46 / 900 | `line-height:1.08`, `text-wrap:pretty` |
| Section heading | 30 / 900 | |
| Big numeral | 40 / 900 | `line-height:1`, tabular-nums |
| Chart value | 26 / 900 | tabular-nums |
| Card title | 20–21 / 900 | |
| Hero body | 21 / 400 | `line-height:1.5` |
| Body / link | 19 / 400–700 | `line-height:1.5` |
| Table cell | 18 / 400–600 | |
| Small caption | 15 / 400 | Footer only |
| Footnote | 13 / 400 | Chart notes, sublabels |
| Eyebrow / label | 12 / 700 | `letter-spacing:0.09em`, uppercase |

**Card copy has a hard floor of 18px.** 14–15px body text inside a card is explicitly wrong in this system. The 13px footnotes and 12px eyebrows are the two sanctioned exceptions.

Apply `font-variant-numeric:tabular-nums` to every figure that sits in a column or next to another figure.

**Spacing** — 4px base. Used: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 40, 44, 52, 56, 64.

**Radii** — 8px bars and small elements, 14px cards, 20px large containers, pill for tags.

**Shadows** — cards only, on light surfaces: `0 1px 2px rgba(20,23,27,.05), 0 8px 24px rgba(20,23,27,.06)`. Dark cards get a `rgba(247,244,236,.18)` border and no shadow. Never a hard drop shadow.

## Assets

- `assets/logo-lockup-mono.png` — header logo, rendered at `height:44px`. Included in this bundle. The repo may already have this or an equivalent; prefer the repo's copy if so.
- **Archivo** (400/600/700/900) — self-hosted woff2 in the design system at `_ds/…/assets/fonts/`. If `site.css` already loads Archivo, use that. Otherwise copy the woff2 files in and add `@font-face` rules; don't switch to a Google Fonts CDN link.
- No other images. This brand has **no photography** — player/coach imagery is replaced by a jersey/helmet badge system, none of which appears on this page.
- No icon set is used. Arrows are the literal character `→`.

## Files

**In this bundle:**
- `Weaver Homepage.dc.html` — the design reference. Open it in a browser to see the intended result. Ignore the `<x-dc>` wrapper, the `<helmet>` block, and the `class Component` script — those belong to the prototype runtime. The markup between them is the page.
- `assets/logo-lockup-mono.png` — header logo.
- This README.

**In the target repo:**
- `index.html` — the file being replaced.
- `assets/css/site.css` — shared stylesheet; add the new classes here.
- `validation.html` — source of truth for every number on the page. Cross-check before shipping.

**Note on the prototype's tweak controls.** The design file exposes three switches used during review: hero surface (ink vs. paper), stat band on/off, and chart axis (zoomed vs. true zero). These are review affordances, not features. Ship the defaults only: **ink hero, stat band on, zoomed axis.** Don't port the switching logic.
