# Weaver Analytics — Site Clarity & Functionality Audit

Reviewed cold, no prior context, standing in for a friend/family member of Anna's with general curiosity but no sports-analytics or data-science background. Read every page listed in scope, both React dashboards' JSX logic, and both data snapshots.

---

## 1. Home page (`index.html`)

**1a. "Blog" card is labeled "Coming Soon" but the blog is fully live with 3 posts.**
- Where: home page card grid, the `<div class="card disabled">` block with `<span class="tag">Coming Soon</span><h2>Blog</h2>`.
- Why it trips people: the card is greyed out (CSS `.card.disabled{opacity:.55}`) exactly like the genuinely-empty "More Dashboards" card next to it, so a visitor has no reason to click it. But the CTA link (`Read posts →`) goes to a real blog with 3 substantive posts dated today. Anyone skimming the home page will conclude there's no blog yet and never find it.
- Fix: remove `class="disabled"` and the `<span class="tag">Coming Soon</span>` from the Blog card; replace the tag with something like `<span class="tag">New</span>` or match the "Live Dashboard"/"Read" tag style used on the other real cards.

**1b. Nav link order is inconsistent across the site (low severity, listed here since home is the reference point).**
- Where: `index.html` / `blog/*.html` / `dashboards/index.html` nav = Home, CFB Model, NFL Model, **Pre-Read, Dashboards**, Blog. `pre-read/index.html` nav = Home, CFB Model, NFL Model, **Dashboards, Pre-Read**, Blog (swapped). `cfb-model/app.jsx` and `nfl-model/app.jsx` nav omit "Dashboards" entirely (see 5a).
- Why it trips people: minor, but a returning visitor navigating by muscle memory ("5th link is Dashboards") gets a different item depending which page they're on.
- Fix: standardize nav order to Home, CFB Model, NFL Model, Pre-Read, Dashboards, Blog everywhere, including inside the two React apps.

---

## 2. Pre-Read (`pre-read/index.html`)

**2a. Executive Summary stat says "4 Toss-Up Divisions" but only lists 3.**
- Where: `#exec-summary`, the stat-card with `<div class="num">4</div><div class="label">Toss-Up Divisions</div>` and note "(AFC South, NFC East, NFC South)".
- Why it trips people: this is the very first data point on the page. Careful readers will count the parenthetical and immediately hit a contradiction — is it 4 or 3? Cross-checked against the later "Division Confidence Ratings" table: exactly 3 divisions are rated "Low" (AFC South, NFC East, NFC South) — the same three named. So "4" appears to be a copy error; it should be "3."
- Fix: change the stat-card `<div class="num">` from `4` to `3` (or, if a 4th toss-up division was intended, add it to both the parenthetical and confirm the Confidence Ratings table matches).

**2b. Heavy jargon used with no on-page definition: "EPA/dropback," "QBR," "SOS."**
- Where: `#qb-situations` rookie cards ("lowest EPA/dropback in 2025," "18.8 QBR"); `#predictions` → "Strength of Schedule Impacts" section (SOS is spelled out once via the section header, but "EPA/dropback" and "QBR" never are, anywhere on the page or site).
- Why it trips people: neither the CFB nor NFL dashboard glossary covers these (they're NFL-scouting-stat terms, not model terms), so there's no glossary a curious reader can flip to. A "smart 13-year-old" has no way to resolve these without leaving the page.
- Fix: add a one-line parenthetical the first time each appears, e.g. "EPA/dropback (a per-play efficiency stat — higher is better)" and "QBR (ESPN's 0–100 quarterback rating)." Alternatively add a tiny "Stats used in this section" footnote in the QB Situations section.

**2c. "Volatility" is used in a formula but never defined anywhere on the site.**
- Where: `#predictions`, "Division Confidence Ratings" dek — "Confidence = gap between the #1 and #2 team's Power Score, minus their average Volatility ÷ 6" — and repeated in the Appendix formula card `Confidence Rating: Gap(#1 vs #2) − Avg. Volatility(#1,#2) ÷ 6`.
- Why it trips people: "Volatility" sounds like it should map to Upside/Downside (which *are* defined in the NFL dashboard glossary), but the pre-read never says whether Volatility = Upside+Downside, an average of them, or something else. A reader can't verify or even sanity-check the Confidence Rating numbers.
- Fix: add one sentence defining Volatility where it first appears, e.g. "Volatility = a team's Upside + Downside score added together" (if that's what it is) — or, if it's a distinct internal number, say so explicitly.

**2d. "Cone of Uncertainty" here vs. "Cone of Certainty" everywhere else on the site — same concept, opposite-sounding names.**
- Where: pre-read `#predictions` → "Cone of Uncertainty, by Division" heading and the Appendix formula card "Cone of Uncertainty." Compare: home page card copy says "win-total uncertainty (**Cone of Certainty**)" and the NFL dashboard glossary defines "**Cone of Certainty**" — clearly the same concept (a projected win-total range).
- Why it trips people: "Certainty" and "Uncertainty" are literal opposites. A reader who read the home page or NFL dashboard first, then hits "Cone of Uncertainty" on the pre-read, will reasonably wonder if this is a different, contradictory metric.
- Fix: rename both instances in `pre-read/index.html` from "Cone of Uncertainty" to "Cone of Certainty" to match the dashboard and home page.

**2e. "Stability" means two different things on the same site.**
- Where: pre-read `#predictions` → "The Team Risk Map" dek: "Y = Stability (inverse of Upside + Downside range)." Compare: blog `post-3.html` defines Trajectory's "Stability" sub-component as "the catch-all for off-field risk: injuries, age, legal situations, unresolved QB competitions" — a completely different quantity (it's about a team's roster risk, not chart-axis volatility).
- Why it trips people: a reader who's already learned "Stability" from the blog (off-field risk score, part of Trajectory) will misread the risk-map axis as the same thing, when it's actually derived from Upside/Downside range instead.
- Fix: rename the risk-map Y-axis label to something distinct, e.g. "Certainty" or "Consistency," so it doesn't collide with the Trajectory sub-component name.

**2f. No "how to read this" framing anywhere on a 500+ line data-dense page.**
- Where: whole page — it jumps straight from the cover into the Executive Summary with no orientation.
- Why it trips people: both dashboards have a "What do these mean?" glossary toggle and (NFL) a "How well does this model actually work?" validation panel. The pre-read has neither, despite using nearly as many model-specific terms (Power Score, Trajectory, Regression, Cone of Certainty/Uncertainty, Confidence Rating, SOS, Volatility). A first-time reader has to reach the Appendix at the very bottom to find any formulas at all, and even those aren't defined in plain English.
- Fix: add a short "How to read this page" callout near the top (after the Executive Summary) that either links to the NFL dashboard's glossary or repeats the plain-English definitions of Power Score, Trajectory, Baseline, Regression, and Cone of Certainty inline.

---

## 3. CFB Dashboard (`cfb-model/app.jsx`)

**3a. Week selector jumps from Week 5 to Week 10 with zero on-page explanation.**
- Where: top toolbar `<select>` for Week (`s.availableWeeks.map(...)`); confirmed in `assets/data/cfb-data.json`, `available_weeks: [5, 10]`.
- Why it trips people: a dropdown that only offers two non-adjacent weeks looks broken — like weeks 1-4 and 6-9 failed to load — rather than "this is a hand-run snapshot pipeline and Anna only generated two checkpoints so far this season." The generic footer note ("This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser") explains that it's not live, but doesn't explain the specific week gap.
- Fix: add a small inline note next to the Week selector, e.g. "Snapshots so far: Week 5, Week 10 — more added as the season progresses," so the gap reads as intentional/in-progress rather than broken.

**3b. No "Model Validation" / backtest panel, unlike the NFL dashboard.**
- Where: compare `cfb-model/app.jsx` (no `VALIDATION_STATS`, no "How well does this model actually work?" button) to `nfl-model/app.jsx` lines ~56-58 and the `toggleValidation` button.
- Why it trips people: a visitor who explores the NFL dashboard first, sees its backtest stats (r = 0.352, Brier score, etc.), and then opens the CFB dashboard will wonder whether the CFB model has ever been checked against real outcomes at all, since there's no equivalent panel or claim either way.
- Fix: either add an equivalent lightweight validation panel to the CFB dashboard (even just "the model is checked weekly against SP+ as a sanity check" per the glossary's SP+ definition), or add one line clarifying that formal backtest validation is NFL-only for now.

---

## 4. NFL Dashboard (`nfl-model/app.jsx`)

**4a. "r = 0.352 (p < 0.001, n = 96)" and "Brier score" are shown with no plain-English definition.**
- Where: `VALIDATION_STATS` array (~line 56), rendered in the "How well does this model actually work?" panel.
- Why it trips people: the *headline* numbers on the model's own credibility panel — the thing meant to build trust — are stated in statistics notation (p-value, sample size, Brier score) that the glossary panel doesn't cover at all (the glossary only defines the 9 model-specific terms, not general stats vocabulary). This is the single biggest "smart 13-year-old" bar failure on the whole site, because it's exactly the panel meant to reassure a lay reader.
- Fix: add a short plain-English gloss to each headline, e.g. "p < 0.001 means this result is very unlikely to be random chance" and "Brier score measures how well-calibrated the predictions are — lower is better, 0 would be perfect." The `gloss` text already does some of this for the correlation number ("a real, if modest, relationship, not a coin flip") — extend the same treatment to the other two stats.

**4b. "See the model's Team Trajectory README for scope details" points to nothing a visitor can reach.**
- Where: Playoff Picture tab footer note (~line 698) and Schedule tab equivalent — references a README with no link, and there's no GitHub/repo link anywhere on the public site.
- Why it trips people: it reads like a broken or forgotten cross-reference — a curious reader who wants "scope details" has no way to get them.
- Fix: either link directly to the GitHub README (if the repo is public) or drop the reference and fold the one sentence of scope detail that matters into the tooltip itself.

**4c. Key-Person Dependency section silently disappears for teams without a flagged player (minor).**
- Where: `activeKeyPerson.length > 0 &&` conditional (~line 641); only 8 of 32 teams have `key_person` entries in `assets/data/nfl-data.json`.
- Why it trips people: switching the Team Detail dropdown between, say, the Chiefs (has a Key-Person card) and a division rival (no card) with no explanation could read as a missing feature rather than "only 8 teams currently have a flagged high-impact player."
- Fix: low priority, but consider a one-line fallback when absent, e.g. "No single flagged player currently drives this team's projection."

---

## 5. Navigation / cross-page consistency

**5a. CFB and NFL dashboards' nav bars omit the "Dashboards" link that every other page has.**
- Where: `cfb-model/app.jsx` and `nfl-model/app.jsx` nav (`<nav>` block near the header, ~line 570 and ~447) list only Home / CFB Model or NFL Model / Pre-Read / Blog.
- Why it trips people: low severity since `dashboards/index.html` itself just points back to these two dashboards and has no unique content — but it's still an inconsistent nav across the site's 8 pages, and a visitor who lands directly on a dashboard (e.g. via a shared link) has one fewer way back to the rest of the site than someone who starts at Home.
- Fix: add the Dashboards link to both dashboards' nav for consistency (5-minute fix, matches 1b above).

**5b. `dashboards/index.html` reads as intentional, not broken — no action needed, but worth confirming.** See "not flagged" section below.

---

## 6. Blog (`blog/index.html`, `post-1/2/3.html`)

**6a. `post-3.html` fails the "smart 13-year-old" bar badly — this is the densest, most jargon-heavy writing on the entire site.**
- Where: whole post, especially the paragraphs on the 45/35/20 weight-selection process and the Regression scale/weight identifiability wrinkle.
- Why it trips people: terms used with zero definition or gloss anywhere on the site: "grid search," "held out" / "out of sample," "fold" (used 4 times as in "beat 45/35/20 out of sample... two of three folds"), "leave-one-season-out," "floating-point precision," "identifiable as a product." None of these appear in either dashboard's glossary, and post-3 is the only place on the site that uses them. A 13-year-old (or a "curious but not technical" adult, which is the site's real audience per the pre-read's own framing) will lose the thread by paragraph 2. This is the clearest violation of the site's own stated bar ("a smart 13-year-old could follow it").
- Fix: this is a rewrite, not a patch — but the highest-value fix is: (1) replace "grid search... rotating which season got held out" with something like "we tried every reasonable weight combination and tested each one on a season it hadn't seen," (2) replace "fold" with "test" or "season" throughout, (3) drop or plain-English "floating-point precision" (e.g. "these two numbers always move together, so changing one and not the other doesn't actually change anything"). Consider running this post specifically past the site's own voice bar before publishing further posts like it.

**6b. Blog posts 1–3 use "Power Score" (NFL) and CFB's "Power Rating" correctly and consistently — no issue, noted for completeness.** No fix needed; see "not flagged" section.

**6c. All three posts are dated the same day (today), with no indication this is a launch batch vs. ongoing cadence (very minor).**
- Where: `blog/index.html` post-list meta dates, all "July 24, 2026."
- Why it trips people: barely — a visitor might just assume 3 posts went up on launch day, which is accurate. Only worth a glance if Anna wants the blog to read as an ongoing habit rather than a one-time dump.
- Fix: none required; optional only if it bothers Anna.

---

## Priority order (highest-impact first, across the whole site)

1. **1a** — Home page "Blog" card mislabeled Coming Soon (real content is hidden from visitors)
2. **2a** — "4 Toss-Up Divisions" vs. 3 listed (first stat on the pre-read, visibly wrong)
3. **2d** — Cone of Certainty vs. Cone of Uncertainty naming collision (contradicts itself across pages)
4. **3a** — CFB week selector gap (5 → 10) with no explanation
5. **4a** — Validation panel stats (p-value, Brier score) undefined on the NFL dashboard's own trust-building panel
6. **6a** — Blog post-3 jargon density, worst offender against the site's stated voice bar
7. **2c** — "Volatility" used but never defined
8. **2e** — "Stability" means two different things on the site
9. **2b** — EPA/dropback, QBR, undefined scouting jargon in pre-read
10. **3b** — CFB dashboard missing validation panel that NFL has (polish gap)
11. **4b** — Dead README reference on NFL dashboard
12. **5a** / **1b** — Nav inconsistencies (missing Dashboards link in dashboards; nav order swap on pre-read)
13. **2f** — Pre-read lacks any "how to read this" framing
14. **4c** — Key-Person Dependency silently absent for most teams
15. **6c** — All blog posts dated same day (optional, cosmetic)

---

## Not flagged — considered fine

- **`dashboards/index.html` as a placeholder page**: its copy ("Nothing else in the pipeline right now... find them under CFB Model / NFL Model in the nav") reads as an intentional, honest placeholder, not an abandoned/broken page. No fix needed.
- **CFB dashboard's glossary**: covers every model-specific term used in the CFB dashboard and in blog post-1 (Power Rating, Success Rate, Explosiveness, Havoc Rate, Run/Pass Game, Coaching Continuity, Model Edge, Home Field Edge, SP+) — thorough and consistent. Left alone.
- **NFL dashboard's glossary**: covers all 9 of its own model terms (Baseline, Trajectory, Regression, Power Score, Upside/Downside, Cone of Certainty, Key-Person Dependency, Spread/Win Probability) consistently with the blog posts and home page (aside from the Cone of Uncertainty naming issue on the pre-read specifically, flagged above). The glossary itself is fine.
- **"Snapshot, not live" framing**: both dashboards and the pre-read Appendix explicitly say the data is a manually-generated, periodically-redeployed snapshot rather than a live feed. This is well-flagged in general terms; only the CFB week-gap specifically needed a callout (3a).
- **Empty-state dev messages** ("run the pipeline to generate cfb_power_ratings.csv", "run nfl_playoff_simulation.py"): technically visible-to-anyone code paths, but both data files are always fully populated in the current snapshot, so a real visitor will never see these. Not worth fixing unless the data pipeline breaks.
- **Blog voice on post-1 and post-2**: both stay close to the "smart 13-year-old" bar — technical terms (success rate, explosiveness, Monte Carlo, Key-Person Dependency) are introduced with an in-line plain-English gloss almost every time. Only post-3 crosses the line (flagged in 6a).
- **Data accuracy spot-check**: verified Ohio State tops the CFB power ratings (matches blog post-1's claim) and that CFB's `available_weeks` / NFL's `available_weeks` genuinely reflect what's in `matchup_by_week` — no silent data/UI mismatches beyond what's flagged above.
