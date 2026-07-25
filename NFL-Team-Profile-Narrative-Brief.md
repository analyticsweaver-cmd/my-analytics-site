# NFL Team Profile Narrative — Flow + Visuals
*Written 2026-07-25 after reading the live Chiefs proof-of-concept (`nfl-model/app.jsx`, commit `fe2de31`) end to end. This is a review-and-improve brief, not a rebuild — the Chiefs copy itself (headline, exec summary, five questions, change-our-mind) is good and should stay close to as-is. The problems are structural: ordering, one broken data reference, and zero visuals in a section that's currently 100% prose.*

## What's there now, in actual page order (`tab === 'team'`)

1. Team `<select>` dropdown
2. `{profile && (...)}` block (`app.jsx:819-856`) — headline, one-liner, 3 exec-summary paragraphs, "Five Questions" ordered list, then a two-column "What Would Change Our Mind" grid. All text, no charts, no numbers pulled from the model beyond what's typed into prose.
3. *Then*, for the first time, the KPI snapshot (`app.jsx:859-892`) — Power Score / Division / Record / Strength of Schedule tiles, plus a rationale paragraph
4. Score Breakdown bars, Cone of Certainty, win-total histogram, Key-Person Dependency card, playoff tiles, schedule column (all pre-existing, unchanged)

## Problem 1 (real bug, fix first): the KPI snapshot's rationale text is silently blank

`app.jsx:891` renders `{activeRow.rationale}`. `activeRow` comes from the `power` array, and the 2026-07-25 in-season-updates migration moved the hand-written `rationale` text to a separate `preseason_power` array that `app.jsx` never loads into state. Confirmed directly against `assets/data/nfl-data.json`: `power` rows have no `rationale` key at all; `preseason_power` rows do. Same dead reference exists at `app.jsx:389` (Power Rankings table team-name tooltip).

**Decide one of two fixes, don't leave it blank:**
- (a) Load `data.preseason_power` into state (same pattern as `historyRows`) and pull `.rationale` from there, matched by team; or
- (b) Retire the old rationale paragraph entirely for any team with a `TEAM_PROFILES` entry, since the new exec-summary prose already supersedes it — and keep it (fixed per (a)) only as the fallback for teams *without* a profile yet, so those 31 other teams don't show blank text either.

Recommend (b): once a team has a real `TEAM_PROFILES` entry, the old one-paragraph rationale is redundant with the new 3-paragraph exec summary — showing both is duplicative, not additive. For teams without a profile entry yet, fix it via (a) so the fallback still works.

## Problem 2: narrative flow — KPIs and headline are split apart when they should be one Hero Summary

`TEAM_PROFILE_DESIGN_SYSTEM.md`'s Hero Summary (§1) is explicit: headline + one-liner + KPI tiles are *one section*, together. Right now the headline/one-liner render first (`app.jsx:822-825`), then Five Questions and Change-Our-Mind run their full course, and only *after all of that* do the KPI tiles show up (`app.jsx:861-885`) — a reader hits the full narrative before ever seeing the Power Score, Division, Record, or SOS numbers the narrative keeps referencing. That's backwards from the spec and from how the exec summary reads today (e.g. the Chiefs copy says "Power Score sits at -4.71" as if the reader already saw it — they haven't yet).

**Fix:** move the KPI tile block (`app.jsx:861-885`, everything inside the existing `{activeRow && (...)}` snapshot div *except* the rationale paragraph, which problem 1 handles separately) up to sit directly inside the `{profile && (...)}` block, between the headline/one-liner and the exec-summary paragraphs. One Hero Summary section, KPIs and headline together, exactly like the spec's own worked examples.

## Problem 3: zero visuals in the entire narrative block

Every single thing in `{profile && (...)}` today is text: a heading, three paragraphs, an ordered list, two bulleted lists. `TEAM_PROFILE_DESIGN_SYSTEM.md`'s own scroll-test priority list is Hero Statement → **Team DNA** → Talent Map → **Monte Carlo Distribution** → Five Questions — two of those five are visuals, and neither appears anywhere near the narrative today (both Cone of Certainty and the win-total histogram already exist, just much further down the page, disconnected from the story that's supposed to be citing them).

**Three concrete additions, in priority order:**

### 3a. Team DNA bar block (highest value, real data ready now)

A shared component already exists and is live on the CFB dashboard: `assets/js/team-dna.js`, exposing `percentileRank(values, target)` and a `<TeamDNA st={st} dimensions={[...]} />` component. Wire it into NFL the same way CFB does it:
1. Add `<script type="text/babel" data-presets="react" src="../assets/js/team-dna.js"></script>` to `nfl-model/index.html`, **before** the existing `app.jsx` script tag (same placement as `cfb-model/index.html`).
2. In `app.jsx`, compute percentiles across all 32 teams in `power` for whatever dimensions are actually available. **Important gotcha:** `need_fill`, `scheme`, and `stability` (the Trajectory sub-components) only exist in `preseason_power` now, not the blended `power` array — same schema split as Problem 1. Either pull those three from `preseason_power` (loaded per Problem 1's fix) or build the DNA block from what's already in `power`: `baseline`, `regression`, `trajectory` (the blended composite), plus SOS rank (already computed, see `sosRank` in the file). A defensible starting set: Record Strength (`baseline`), Roster/Coaching Trajectory (`trajectory`), Recent Form (`regression`, framed as "how much better/worse than the record suggests" rather than "luck" in DNA context), Schedule Difficulty (`sosRank`, inverted so a harder schedule reads as a higher bar). If `preseason_power` gets loaded anyway (Problem 1), add Roster Needs Addressed (`need_fill`), Scheme Fit (`scheme`), Organizational Stability (`stability`) as three more dimensions — closer parity with CFB's 8-dimension set.
3. Place it directly after the Hero Summary (KPI tiles), before the exec-summary paragraphs — same position as CFB's Team DNA card, so the two dashboards read consistently once someone's used to one.

### 3b. Move Key-Person Dependency up, right after Five Questions

The Chiefs exec summary's central claim is the "3.21-point swing between a healthy Mahomes (-4.71) and a hobbled one (-7.92)" — real, already-computed numbers (`key_person` array, `power_score_if_healthy: -4.71`, `power_score_if_down: -7.92`, `cliff: 3.21`). The chart that visualizes exactly this (`app.jsx:950+`, the existing Key-Person Dependency card) sits many screens below, past Score Breakdown and Cone of Certainty, fully disconnected from the paragraph that cites its numbers.

**Fix:** don't build a new chart — move the existing Key-Person Dependency card up into (or immediately after) the `{profile && (...)}` block, right after Five Questions and before "What Would Change Our Mind." This is exactly the spec's own logic for supporting evidence: it earns its place by backing up a claim already made above, so it belongs right after that claim, not three sections later. For teams without a flagged Key-Person entry, this card already renders a graceful fallback message (`app.jsx` handles the empty case) — safe to move unconditionally.

### 3c. Plain-language Monte Carlo callout, inline in the exec summary or right after Five Questions

`TEAM_PROFILE_DESIGN_SYSTEM.md`'s Monte Carlo section explicitly asks for callouts like *"31% chance to win at least nine games... Most likely finish: 7-8 wins."* This model already computes exactly that (20,000-sim histogram), it's just never spoken in plain language anywhere — only shown as a chart, further down. Real numbers for Chiefs, computed directly from `assets/data/nfl-data.json`'s `monte_carlo_histogram`, verified by hand:

- Most likely finish: **6 wins** (12% of simulations)
- **31% chance of at least 9 wins**
- Simulated 90% range: **2 to 12 wins**

Add a one- or two-sentence callout using this pattern (compute the "most likely" and "at least N" numbers per team the same way — mode of the histogram, and cumulative sum from a sensible threshold like 9 or 10 wins) either as the closing line of the exec summary, or as a small highlighted callout box between Five Questions and the moved-up Key-Person card. Don't hardcode Chiefs' specific numbers into shared code — compute them from `monteCarloHistogram` per team so this works for every team once more `TEAM_PROFILES` entries exist, not just Chiefs.

## Suggested final order for the `{profile && (...)}` block

1. Headline + one-liner (existing)
2. KPI tiles (moved up from the old snapshot box — Problem 2)
3. Team DNA bars (new — 3a)
4. Exec summary paragraphs (existing, ending with the Monte Carlo callout — 3c)
5. Five Questions (existing)
6. Key-Person Dependency card (moved up — 3b)
7. What Would Change Our Mind (existing)

Everything currently below this block (Score Breakdown, Cone of Certainty, win-total histogram in full, playoff tiles, schedule column) stays exactly where it is — that's the appendix-style supporting detail the spec expects underneath the story, and it's already reasonably built.

## Scope note

This affects shared rendering code (`app.jsx`'s `tab === 'team'` block), not just Chiefs' specific copy — get the structure right once and it applies to all 32 teams the moment they get a `TEAM_PROFILES` entry. Verify with the Chiefs entry (the only live one), but don't hardcode anything Chiefs-specific into the reordering itself.
