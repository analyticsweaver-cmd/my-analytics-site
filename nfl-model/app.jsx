const { useState, useEffect } = React;

// ----------------------------------------------------------------------
// Team colors (from nfl_team_colors.json — primary used for team-identifying
// accents throughout, same role CFB's TEAM_COLORS plays in that dashboard)
// ----------------------------------------------------------------------
const TEAM_COLORS = {
  "Bills": { primary: "#00338D", secondary: "#C60C30", abbr: "BUF" },
  "Dolphins": { primary: "#008E97", secondary: "#FC4C02", abbr: "MIA" },
  "Patriots": { primary: "#002244", secondary: "#C60C30", abbr: "NE" },
  "Jets": { primary: "#125740", secondary: "#000000", abbr: "NYJ" },
  "Ravens": { primary: "#241773", secondary: "#000000", abbr: "BAL" },
  "Bengals": { primary: "#FB4F14", secondary: "#000000", abbr: "CIN" },
  "Browns": { primary: "#311D00", secondary: "#FF3C00", abbr: "CLE" },
  "Steelers": { primary: "#FFB612", secondary: "#101820", abbr: "PIT" },
  "Texans": { primary: "#03202F", secondary: "#A71930", abbr: "HOU" },
  "Colts": { primary: "#002C5F", secondary: "#A2AAAD", abbr: "IND" },
  "Jaguars": { primary: "#101820", secondary: "#D7A22A", abbr: "JAX" },
  "Titans": { primary: "#0C2340", secondary: "#4B92DB", abbr: "TEN" },
  "Broncos": { primary: "#FB4F14", secondary: "#002244", abbr: "DEN" },
  "Chiefs": { primary: "#E31837", secondary: "#FFB81C", abbr: "KC" },
  "Raiders": { primary: "#000000", secondary: "#A5ACAF", abbr: "LV" },
  "Chargers": { primary: "#0080C6", secondary: "#FFC20E", abbr: "LAC" },
  "Cowboys": { primary: "#003594", secondary: "#041E42", abbr: "DAL" },
  "Giants": { primary: "#0B2265", secondary: "#A71930", abbr: "NYG" },
  "Eagles": { primary: "#004C54", secondary: "#000000", abbr: "PHI" },
  "Commanders": { primary: "#5A1414", secondary: "#FFB612", abbr: "WAS" },
  "Bears": { primary: "#0B162A", secondary: "#C83803", abbr: "CHI" },
  "Lions": { primary: "#0076B6", secondary: "#000000", abbr: "DET" },
  "Packers": { primary: "#203731", secondary: "#FFB612", abbr: "GB" },
  "Vikings": { primary: "#4F2683", secondary: "#FFC62F", abbr: "MIN" },
  "Panthers": { primary: "#0085CA", secondary: "#101820", abbr: "CAR" },
  "Buccaneers": { primary: "#D50A0A", secondary: "#FF7900", abbr: "TB" },
  "Falcons": { primary: "#A71930", secondary: "#000000", abbr: "ATL" },
  "Saints": { primary: "#D3BC8D", secondary: "#101820", abbr: "NO" },
  "Rams": { primary: "#003594", secondary: "#FFA300", abbr: "LAR" },
  "49ers": { primary: "#AA0000", secondary: "#B3995D", abbr: "SF" },
  "Seahawks": { primary: "#002244", secondary: "#69BE28", abbr: "SEA" },
  "Cardinals": { primary: "#97233F", secondary: "#000000", abbr: "ARI" },
};
function teamColor(team) { return (TEAM_COLORS[team] && TEAM_COLORS[team].primary) || '#8C8F93'; }

const GLOSSARY_TERMS = [
  { term: 'Baseline', def: 'Prior-season win total, rescaled ((wins − 8.5) × 2) so an 8.5-win team scores zero — the model\'s starting point before any judgment adjustments.' },
  { term: 'Trajectory', def: 'Need-Fill + Stability — the hand-scored judgment layer covering roster needs and off-field risk. Scheme Continuity (coaching turnover) is scored and shown elsewhere but no longer feeds this number as of a 2026-07-24 audit correction — see Model Validation below.' },
  { term: 'Regression', def: "A Pythagorean-wins luck adjustment: how much a team's point differential says they should have won vs. what they actually won. Teams that overperformed their point differential get pulled back down, and vice versa." },
  { term: 'Power Score', def: '45% Baseline + 35% Trajectory + 20% Regression — the model\'s single overall team-strength number, backtest-validated across 3 seasons (see Model Validation below).' },
  { term: 'Upside / Downside', def: "The Power Score cone's judgment-based bounds — the model's own estimate of how much better (Upside) or worse (Downside) a team could plausibly play than its Power Score, driven by specific flagged players or situations." },
  { term: 'Cone of Certainty', def: "A team's projected win-total range, from a 20,000-season Monte Carlo simulation — shows both the simple analytical estimate and the (correctly wider) simulated range that accounts for how uncertain the underlying Power Score really is." },
  { term: 'Key-Person Dependency', def: "What a team's Power Score becomes if a specific flagged player (most reliably, the starting QB) goes down — a real, data-derived number, not just a risk label." },
  { term: 'Spread / Win Probability', def: "The model's predicted point margin and win chance for a given matchup. Power Score converts to spread 1-for-1: subtract the two teams' Power Scores, add a fixed 2-point home-field edge, and that's the predicted margin — no hidden scaling factor. This model doesn't ingest betting lines, so there's no market comparison — just the model's own number." },
  { term: 'HFA (Home Field Adjustment)', def: "Points added to the home team's spread for playing at home; zeroed out for international/neutral-site games." },
  { term: 'Playoff / Super Bowl probability', def: 'From the same season simulation as the Cone of Certainty, carried through a full playoff bracket (with correct re-seeding) 5,000 times per team.' },
];

const VALIDATION_STATS = [
  { headline: 'Power Score vs. actual wins: r = 0.382 (p < 0.001, n = 96)', gloss: '3 seasons (2023–2025) of leave-one-season-out backtesting — the strongest, most confident result in this whole project. Power Score reliably tracks how teams actually perform.' },
  { headline: 'Simulated win-total uncertainty is ~1.6x wider than simple math suggests', gloss: "A 20,000-run Monte Carlo season simulation showed the analytical (non-simulated) confidence intervals understate real uncertainty. This dashboard's Cone of Certainty uses the wider, simulation-based numbers." },
  { headline: 'Win-probability calibration improved: Brier score 0.2375 → 0.2372', gloss: 'Brier score measures how well-calibrated a set of predicted probabilities is (0 = perfect, 0.25 = no better than always guessing 50/50) — games predicted as heavy favorites/underdogs were overconfident at the extremes; simulating uncertainty rather than using a single point estimate pulled those predictions back toward reality.' },
  { headline: 'A 2026-07-24 audit correction removed Scheme Continuity from Power Score', gloss: 'Three independent tests found it was quietly hurting accuracy, not helping — full methodology, evidence, and a documented correction (including a fix that turned out to be unnecessary once this one was applied) in the full audit.', link: { href: 'methodology.html', label: 'Read the full technical audit →' } },
];

// Team Profile narrative content (TEAM_PROFILE_DESIGN_SYSTEM.md) — hand-authored
// per team, not derived from the data pipeline. Teams without an entry here just
// get today's Team Detail tab unchanged; this is deliberately sparse rather than
// templated from data thresholds, since the site's voice rules treat that kind of
// generic auto-generated narrative as worse than no narrative at all.
const TEAM_PROFILES = {
  Chiefs: {
    headline: 'Chiefs: Contention on Hold',
    oneLiner: "The Chiefs' 2026 outlook comes down to one question: how much of Patrick Mahomes comes back from a torn ACL and LCL.",
    execSummary: [
      "A reigning-dynasty franchise coming off a rare losing season — 6-11 in 2025 — driven almost entirely by Mahomes tearing his ACL and LCL in Week 15.",
      "Power Score sits at -4.71, well back of a dominant Broncos team (+8.4) atop the AFC West. The model's Key-Person Dependency data shows a 3.21-point swing between a healthy Mahomes (-4.71, the number already baked into the Power Score above) and a hobbled one (-7.92) — the same swing size the model applies to any starting-caliber QB, but for the Chiefs specifically it's a live, unresolved situation, not a hypothetical.",
      'Rehab reports have him "ahead of schedule," and Kansas City added Kenneth Walker III to reduce pressure on his return — but Week 1 availability is genuinely uncertain.',
    ],
    fiveQuestions: [
      'How much of Mahomes returns from the ACL+LCL tear, and how fast?',
      'Does "ahead of schedule" rehab hold up through Week 1, or slip into the season?',
      "Is Kenneth Walker III enough of a hedge if Mahomes isn't full-strength early?",
      'Even with a healthy Mahomes, can the Chiefs close an 8-to-10-point Power Score gap on a dominant Broncos team in one offseason?',
      "How much of the 6-11 finish was Mahomes' injury specifically, versus a broader decline the model hasn't fully separated out yet?",
    ],
    whyModelThinks: {
      optimism: [
        "Regression sits at +10.5, the largest positive correction on the roster — the 6-11 record ran meaningfully worse than the team's actual point differential.",
        'Kansas City already added Kenneth Walker III this offseason, a concrete roster move addressing the QB-injury risk directly.',
        'Key-Person Dependency data isolates the injury\'s exact effect (3.21 points) rather than leaving it a vague risk label — the current -4.71 Power Score already assumes a healthy Mahomes, not a discounted one.',
        'The 6-11 finish traces to one flagged event (the Week 15 injury), not a decline spread across the roster.',
      ],
      risks: [
        'Power Score (-4.71) trails the division-leading Broncos (+8.4) by roughly 13 points, the largest gap in the AFC West.',
        'Trajectory — the model\'s roster/coaching judgment component — sits at -13.0, the most negative of the three Power Score inputs.',
        'The 3.21-point Key-Person cliff is the largest single-player dependency swing on the roster, concentrating real risk in one position.',
        'Baseline (-5.0) still reflects the 6-11 record directly — the weakest of the three components before any judgment adjustment is applied.',
      ],
    },
    changeOurMind: {
      pessimisticIf: [
        'Mahomes returns for Week 1 and looks like his pre-injury self, not just "active."',
        'Kansas City is competitive with Denver or the Chargers head-to-head, not blown out.',
        'The 3.21-point key-person cliff never materializes because the hedge and backup plan hold.',
      ],
      lowerIf: [
        "Mahomes' return slips past Week 1, or he's limited/inconsistent once back.",
        "The Power Score gap to Denver doesn't close even after Mahomes is fully healthy, suggesting 2025's decline wasn't just about the QB.",
        'A setback in the ACL/LCL rehab becomes public before the season.',
      ],
    },
  },
    Cowboys: {
      headline: "Cowboys: The Defense Is the Story, Not the Record",
      oneLiner: "A 7-9-1 finish undersells what Dallas built on defense this offseason — the model's Trajectory score (+7) is doing more to lift the Cowboys than any other team's is doing for them.",
      execSummary: [
        "Dallas finished 7-9-1 in 2025, but the roster building since then reads nothing like a rebuild — the defense got major additions on a new defensive coordinator, and cornerback depth is the only real hole left unaddressed.",
        "Power Score sits at 1.66, the highest in a genuinely competitive NFC East (Eagles at 0.97, Giants at -0.45, Commanders at -5.24) — and almost all of that number comes from Trajectory (+7), not Baseline (-2.0, still dragged down by last year's record). The model is betting on the roster more than the past.",
        "The one real swing factor is DeMarvion Overshown, still working back from a severe multi-ligament knee injury — the data on his impact is thin (low confidence), but if he's not right, that's the clearest single risk on an otherwise “rare drama-free summer.”",
      ],
      fiveQuestions: [
        "Does the defensive overhaul translate to actual results, or is Trajectory (+7) pricing in more improvement than a new DC alone can deliver?",
        "How much is Overshown able to play, and at what level, coming off a severe multi-ligament knee injury?",
        "Is a thin cornerback room the one hole that keeps this defense from taking the next step?",
        "Can Dallas actually hold off Philadelphia for the division, or does experience and talent close a 0.69-point Power Score gap?",
        "Does a 7-9-1 baseline undersell a genuinely retooled roster, or was last year's record closer to the team's real level than Trajectory assumes?",
      ],
      whyModelThinks: {
        optimism: [
          "Trajectory sits at +7, the largest positive component on the roster — real defensive additions and a new coordinator, not last year's record, are driving this year's call.",
          "Dallas leads the NFC East by Power Score despite a below-.500 Baseline (-2.0), meaning the model rates the current roster well ahead of last year's record.",
          "Regression is close to neutral (+0.5), meaning last year's 7-9-1 finish tracked the team's actual point differential — no hidden bad-luck cushion propping up the number.",
        ],
        risks: [
          "Baseline (-2.0) still reflects last year's below-.500 finish directly — the record hasn't caught up to the roster bet yet.",
          "DeMarvion Overshown's Key-Person data (healthy: 1.66, down: -1.08, cliff: 2.74) is flagged low-confidence due to a thin sample, leaving real uncertainty around the single biggest swing factor on the roster.",
          "Cornerback depth remains the one roster hole the defensive rebuild left unaddressed.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The defense performs like a top-half unit early, validating the Trajectory bet.",
          "Overshown returns at anything close to his pre-injury level.",
          "Dallas beats Philadelphia and/or other strong competition, not just weaker NFC East opponents.",
        ],
        lowerIf: [
          "Cornerback depth gets exposed by good passing offenses.",
          "Overshown's recovery stalls or he's limited/inactive for a real stretch.",
          "The defensive rebuild looks more like scheme change than actual improvement.",
        ],
      },
    },
    Eagles: {
      headline: "Eagles: Trading Away the Farm, Betting on What's Left",
      oneLiner: "Philadelphia is the rare 11-6 team the model has cooling off — real subtractions (A.J. Brown traded away, a starting safety lost) outweighing an otherwise stable, zero-turnover coaching staff.",
      execSummary: [
        "The Eagles won 11 games in 2025, but the offseason wasn't a stand-pat victory lap — Philadelphia traded away A.J. Brown and lost its starting safety, both real subtractions from a roster that just went to the mat in a strong season.",
        "Power Score sits at 0.97, second in the NFC East behind Dallas's 1.66. Baseline (+5.0) still reflects last year's strong record, but Trajectory (-2) and Regression (-2.91) both pull the number down — the model reads the subtractions as outweighing full coaching continuity.",
        "The swing factors both run through health: DeVonta Smith Jr. and Jalen Hunt are real breakout candidates if Smith's recurring triceps injury stays managed, but an aging core is genuinely closer to the end of its title window than the start of one.",
      ],
      fiveQuestions: [
        "Does trading A.J. Brown get replaced in the passing game, or is that hole as real as Trajectory suggests?",
        "How much does losing the starting safety show up on defense before it's fixed?",
        "Is Smith Jr.'s recurring triceps injury a season-long limiter or a non-issue once camp starts?",
        "Is this core aging out of its window now, or is 2026 still inside it?",
        "Can Philadelphia hold off Dallas in a division where the gap is only 0.69 points, or does last year's record flatter Philadelphia more than this year's roster earns?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+5.0) still reflects an 11-6 season, the strongest raw-record input of any NFC East team besides Dallas's Trajectory bet.",
          "The coaching staff carries zero turnover into 2026 — the only real continuity anchor on a roster that lost personnel.",
          "DeVonta Smith Jr. and Jalen Hunt are already real, rostered pieces the model reads as upside if health holds.",
        ],
        risks: [
          "Trajectory (-2.0) and Regression (-2.91) both pull down from Baseline — the model reads last year's subtractions as outweighing coaching continuity.",
          "A.J. Brown was traded away and the starting safety departed — two real, already-completed subtractions from last year's roster.",
          "This is described as an aging core closer to the end of its title window than the start of one.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The passing game doesn't miss Brown as much as expected — Smith Jr. and Hunt genuinely break out.",
          "Smith Jr.'s triceps issue is a non-factor once the season starts.",
          "The defense doesn't visibly regress despite the safety loss.",
        ],
        lowerIf: [
          "The receiving corps looks thin without Brown in real games, not just on paper.",
          "Smith Jr. misses time or plays limited.",
          "Age-related decline shows up somewhere specific and obvious.",
        ],
      },
    },
    Giants: {
      headline: "Giants: The Record Says Disaster, the Model Says Otherwise",
      oneLiner: "A 4-13 season was about as bad as it looks on the scoreboard — but the model's own luck adjustment says New York was closer to a .500 team than that record shows, and thinks the roster fixes were real.",
      execSummary: [
        "New York finished 4-13 in 2025, the worst record on this shortlist — but “most other holes excellently patched” after a full, well-reviewed coaching staff overhaul is not the offseason of a team resigned to another bottom-five finish.",
        "Power Score comes in at -0.45 — well ahead of where a 4-13 record alone would put a team. Baseline (-9.0) reflects the actual record, but Regression (+9.26), the model's Pythagorean luck adjustment, is doing enormous work: New York's point differential says they should have won meaningfully more games than they did. Trajectory (+5) backs that up with real roster improvement.",
        "Center remains a weak link, and the defensive-line and scheme rebuild risk is already priced into the Scheme score rather than sitting as an open question — this reads as a team the model thinks was unlucky, not bad.",
      ],
      fiveQuestions: [
        "Does a +9.26 luck adjustment actually show up as more wins in 2026, or was 4-13 closer to the truth than Regression assumes?",
        "Is center the one hole that keeps an otherwise “excellently patched” roster from taking a real step forward?",
        "Does the full coaching staff overhaul translate on the field, not just look good on paper?",
        "How much does the defensive-line and scheme rebuild risk, already priced in, actually cost them in-season?",
        "Is Darius Alexander's role opportunity enough of a real contribution to matter, or just a depth note?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression sits at +9.26, the second-largest positive correction of any team in the model — New York's actual point differential was meaningfully better than the 4-13 record shows.",
          "Trajectory is positive (+5.0), reflecting real roster improvement layered on top of the luck correction.",
          "The coaching staff overhaul is already complete and well-reviewed, not a pending question.",
        ],
        risks: [
          "Baseline (-9.0) is one of the most negative in the league, directly reflecting the 4-13 finish.",
          "Center remains an unaddressed weak link on the offensive line.",
          "The defensive-line and scheme rebuild risk is already priced into the Stability score, meaning the model itself is uncertain how it plays out.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "New York's record improves significantly even without a marquee offseason addition — the luck-adjustment bet pays off.",
          "Center is a non-issue once the season starts.",
          "The new coaching staff's results match the well-reviewed offseason buzz.",
        ],
        lowerIf: [
          "The record stays bad even accounting for better luck, suggesting 4-13 was closer to their real level than the model thinks.",
          "Center struggles are visible and costly.",
          "The D-line and scheme rebuild looks more like a step back than the model's pricing assumed.",
        ],
      },
    },
    Commanders: {
      headline: "Commanders: Last in the Division, First in Schedule Difficulty",
      oneLiner: "Washington's 2026 outlook comes down to two things outside anyone's control: how much of Jayden Daniels stays healthy, and a schedule the model rates as the toughest in the league.",
      execSummary: [
        "The Commanders finished 5-12 in 2025 and enter 2026 last in the NFC East by Power Score (-5.24) — the only team in the division still in negative Baseline and negative Trajectory territory at the same time.",
        "The offense never got a real answer at WR2 opposite Terry McLaurin, and the model rates Washington's 2026 schedule as the hardest of any team on this list — strength-of-schedule rank #1, meaning no other team's average opponent is projected stronger. A tough schedule on top of a below-average roster is a difficult combination.",
        "Everything about the offense's ceiling runs through Jayden Daniels' health — McLaurin has a real explicit career-year case in a new offensive scheme (OC and DC both changed, head coach retained), but that all depends on Daniels staying on the field.",
      ],
      fiveQuestions: [
        "Does McLaurin's real career-year case materialize in the new offensive scheme?",
        "How much of the season does Jayden Daniels actually play, and at what level?",
        "Does the WR2 hole opposite McLaurin get addressed in-season, or does it cap the passing game all year?",
        "Does the league's hardest projected schedule turn a mediocre roster into a genuinely bad record?",
        "Is retaining the head coach while changing both coordinators enough continuity to show real improvement, or too much churn to matter?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is positive (+3.53), meaning the model reads 2025 as somewhat unlucky relative to Washington's underlying point differential.",
          "Terry McLaurin remains a proven, established WR1 the model already trusts.",
        ],
        risks: [
          "Baseline (-7.0) and Trajectory (-8.0) are both negative at the same time — the only team in the division carrying that combination.",
          "Washington's 2026 schedule is rated the hardest in the league (SOS rank #1).",
          "WR2 opposite McLaurin was never addressed this offseason.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Daniels stays healthy for close to a full season.",
          "McLaurin has the career year the model's Upside case describes.",
          "Washington is competitive even against the league's hardest schedule, not blown out by it.",
        ],
        lowerIf: [
          "Daniels misses real time or plays through injury at a diminished level.",
          "The WR2 hole is exposed and never fixed.",
          "The tough schedule produces the kind of results a #1 SOS rank would predict for a below-average roster.",
        ],
      },
    },
    Saints: {
      headline: "Saints: From 6-11 to Division Favorite, on the Back of a Rookie QB Find",
      oneLiner: "New Orleans' turnaround case rests on one thing: whether Tyler Shough's rookie-year emergence at QB was real, or a one-year sample the model is trusting too much.",
      execSummary: [
        "The Saints finished 6-11 in 2025, but the model has them projected as the strongest team in the NFC South for 2026 — Power Score 1.77, ahead of Carolina, Tampa Bay, and Atlanta — on the back of the largest Trajectory jump (+11) of any team on this list.",
        "Two things are doing the work: Shough's emergence “solved QB for free” after New Orleans also drafted Tyson 8th overall, and the model rates New Orleans' 2026 schedule as the easiest in the league (SOS rank 32nd of 32). A weak schedule inflates the raw win total some, but the underlying roster bet — zero coaching turnover, real mid-round finds in Riley and Sanker — is what's actually driving the Power Score.",
        "The obvious risk is right there in the numbers: Shough is a one-year-sample rookie QB, and “solved QB for free” is exactly the kind of call that either ages very well or doesn't hold up to a second look from opposing defenses.",
      ],
      fiveQuestions: [
        "Does Shough's rookie emergence hold up over a full season, or was it a small-sample honeymoon?",
        "How much of the projected win total is really the easiest schedule in the league doing the work, versus genuine roster strength?",
        "Does the Tyson pick (8th overall) pan out fast enough to matter in 2026?",
        "Do Riley and Sanker's mid-round finds hold up as full-season starters, not just camp standouts?",
        "Is zero coaching turnover an underrated stabilizer here, or does it mean no real answer for whatever didn't work in a 6-11 season?",
      ],
      whyModelThinks: {
        optimism: [
          "Trajectory sits at +11, the single largest positive Trajectory jump of any team in the model.",
          "New Orleans carries zero coaching turnover into 2026.",
          "The 2026 schedule is rated the easiest in the league (SOS rank 32nd of 32).",
        ],
        risks: [
          "Baseline (-5.0) still reflects a 6-11 finish directly.",
          "The Trajectory jump rests heavily on Tyler Shough, a one-year-sample rookie quarterback.",
          "The easy schedule inflates the raw win-total projection independent of roster strength.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Shough performs like a legitimate starting QB against a full slate of NFL defenses, not just early flashes.",
          "New Orleans is competitive even against tougher opponents, not just padding the record against a weak schedule.",
          "Riley and Sanker hold up as real full-season contributors.",
        ],
        lowerIf: [
          "Shough regresses once defenses have a full season of tape on him.",
          "The weak schedule turns out to be doing most of the work, and results against good teams specifically are poor.",
          "The 6-11 record turns out to be closer to the roster's true level than an +11 Trajectory jump suggests.",
        ],
      },
    },
    Raiders: {
      headline: "Raiders: A Full Rebuild, Not a Retool",
      oneLiner: "Las Vegas isn't dressing up a bad season as a step forward — the model reads this as an honest, full rebuild, from an unresolved WR1 hole to an unproven rookie QB succession plan.",
      execSummary: [
        "The Raiders finished 3-14 in 2025 and the model doesn't see a quick turnaround: Power Score sits at -7.85, last in the AFC West and the lowest of any team profiled here. Baseline (-11) and Trajectory (-9) are both deeply negative — this isn't a team papering over one bad year.",
        "There's no legitimate WR1 or true X-receiver on the roster, and the coaching staff saw a full overhaul. The one real bright spot the model flags is Ashton Jeanty, viewed as a genuine buy-low, regression-to-mean case rather than a name attached for hype.",
        "The clearest long-term risk is the QB succession plan — unproven and unresolved — layered on top of an otherwise full rebuild. This is a team the model expects to be building for the future as much as competing in 2026.",
      ],
      fiveQuestions: [
        "Does a legitimate WR1 emerge from the current room, or does the passing game stay capped all year?",
        "How much does Ashton Jeanty's regression-to-mean case actually show up in per-game production?",
        "Is the new coaching staff able to install its system fast enough to matter in Year 1?",
        "How does the unproven QB succession plan actually play out once the season starts?",
        "Is a -9 Trajectory a fair read on a full rebuild, or does the model risk underrating young talent that hasn't shown up in the data yet?",
      ],
      whyModelThinks: {
        optimism: [
          "Ashton Jeanty is already on the roster as a real, model-flagged buy-low regression-to-mean case.",
          "Regression is mildly positive (+1.23), a small offsetting correction on an otherwise deeply negative profile.",
        ],
        risks: [
          "Baseline (-11.0) and Trajectory (-9.0) are both deeply negative — Power Score (-7.85) is the lowest of any team profiled.",
          "There is no legitimate WR1 or true X-receiver currently on the roster.",
          "The coaching staff saw a full overhaul, adding installation risk to an already rebuilding roster.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Jeanty's regression-to-mean case is real and shows up immediately.",
          "A legitimate WR1 emerges, even unexpectedly, from the current room.",
          "The new coaching staff's system is competitive out of the gate, not a Year 1 struggle.",
        ],
        lowerIf: [
          "The WR1 hole stays unresolved and visibly caps the offense.",
          "QB play is a clear, costly weakness rather than a manageable question mark.",
          "The rebuild looks more like -9 Trajectory suggests than like a quick turnaround.",
        ],
      },
    },
    Broncos: {
      headline: "Broncos: The Model's Overall Favorite, With One Real Caveat",
      oneLiner: "Denver enters 2026 as the model's strongest team in this group — but the same Pythagorean math that flags other teams' bad luck flags the Broncos for good luck, which is the one thing keeping this from being a totally clean bill of health.",
      execSummary: [
        "Denver went 14-3 in 2025 and returns the least roster turnover in the league — full continuity, a minor gap at tight end aside. Power Score leads the AFC West at 4.89, comfortably ahead of the Chargers, Chiefs, and Raiders.",
        "Baseline (+11) is the highest of any team profiled here, and Trajectory (+5) adds more on top. The one number working against Denver is Regression (-9.04) — the model's largest single luck adjustment in either direction on this list, reflecting that the Broncos' point differential in 2025 didn't fully back up a 14-3 record. Some regression toward the mean is baked into the Power Score already.",
        "The model's own language calls this “the most complete, healthiest roster in the league — lowest risk in the AFC.” That's a genuine strength, but it also means there's very little hidden upside left to find — the swing factors here are more about how much regression actually shows up than about any single injury or personnel question.",
      ],
      fiveQuestions: [
        "How much does the -9.04 Regression adjustment actually show up as fewer wins in 2026?",
        "Does the tight end gap become a real problem, or stay a minor note?",
        "Is a soft 2026 schedule propping up the projection, or is Denver good enough that it wouldn't matter either way?",
        "Can a team already rated as low-risk find any real upside beyond what's already priced in?",
        "Does the AFC West gap to Kansas City and Las Vegas hold, or does one of them close it faster than expected?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+11.0) is the highest of any team in the model, and Trajectory (+5.0) adds on top of it — Denver carries the least roster turnover in the league into 2026.",
          "Power Score (4.89) leads not just the AFC West but the entire league.",
        ],
        risks: [
          "Regression (-9.04) is the largest single luck correction, in either direction, of any team in the model — 2025's point differential didn't fully back up the 14-3 record.",
          "There's a real gap at tight end, the one roster hole the model flags.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Denver's results don't show meaningful regression — 2025's point-differential gap turns out to not matter.",
          "The tight end position is a non-issue.",
          "Denver is competitive even in a tougher stretch of the schedule than its SOS rank suggests.",
        ],
        lowerIf: [
          "The -9.04 Regression adjustment plays out as real, visible schedule-adjusted underperformance.",
          "Injuries erode the “healthiest roster in the league” framing.",
          "The AFC West race tightens because a divisional competitor closes the gap faster than the model expects.",
        ],
      },
    },
    Rams: {
      headline: "Rams: One Trade Away From the Model's Second-Best Team",
      oneLiner: "The Garrett trade is doing real work in the Rams' number — the model rates this as an elite, well-built roster with only two soft spots: WR3 depth and a 37-year-old quarterback.",
      execSummary: [
        "Los Angeles went 12-5 in 2025 and enters 2026 with the model's second-highest Power Score in this group at 4.72 — trailing only Denver. Zero coaching turnover and a major boost from the Garrett trade are the headline additions to an already strong roster.",
        "Baseline (+7.0) and Trajectory (+4) both point the same direction, and Scheme sits at the maximum score in the dataset (+10). Stewart now has a real complementary role with Garrett aboard, and the only roster hole the model flags is WR3 depth — a minor concern on what's described as “an otherwise elite roster.”",
        "The one real long-term risk is obvious and not hidden: this is a deep, talented, but aging core led by a 37-plus-year-old Stafford. The Power Score reflects the team the Rams are right now, not necessarily the team they'll be if Stafford's play or availability slips.",
      ],
      fiveQuestions: [
        "How much does the Garrett trade actually change the defense's ceiling in real games, not just on paper?",
        "Is WR3 depth ever actually tested, or does the passing game not need a third option this year?",
        "How much does Stafford's age show up in 2026 — arm strength, durability, or neither?",
        "Does zero coaching turnover translate to a faster start than teams with new systems to install?",
        "Is this Rams roster genuinely the second-best team in the model's eyes, or does the gap to Denver close or widen?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+7.0) and Trajectory (+4.0) both point the same direction, and Scheme sits at the maximum score in the entire dataset.",
          "The Myles Garrett trade is already completed, adding a real, on-roster defensive upgrade.",
          "Zero coaching turnover carries into 2026.",
        ],
        risks: [
          "WR3 depth is the one roster hole the model flags on an otherwise elite roster.",
          "Matthew Stafford is a 37-plus-year-old quarterback — the Power Score reflects the team as currently built, not a guarantee that holds if his play or availability slips.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The Garrett trade's impact shows up immediately and clearly on defense.",
          "Stafford plays at or near his established level for a full season.",
          "WR3 depth is never actually a problem.",
        ],
        lowerIf: [
          "Stafford's age shows up as declining arm strength, durability, or both.",
          "WR3 depth gets exposed by injury elsewhere in the receiving corps.",
          "The defense doesn't show the boost the Garrett trade was supposed to provide.",
        ],
      },
    },
    Steelers: {
      headline: "Steelers: Division Leader by a Coin Flip, One Injury From a Cliff",
      oneLiner: "Pittsburgh's 2026 outlook comes down to one number: what happens to a 42-year-old Aaron Rodgers, whose Key-Person cliff (3.21 points) is almost identical in size to the Chiefs' Mahomes situation — just driven by age instead of a torn ACL.",
      execSummary: [
        "The Steelers went 10-7 in 2025 and hold the AFC North's top spot by the thinnest possible margin — Power Score -1.85 to Baltimore's -1.87, a gap of two-hundredths of a point. This is as close to a coin-flip division race as the model produces anywhere.",
        "Trajectory (-7) reflects real turmoil: a full coaching staff overhaul and an unsettled right guard spot protecting the league's most closely watched age-risk starter. The model's Key-Person Dependency data makes it explicit and high-confidence: Pittsburgh's Power Score is -1.85 with a healthy Rodgers and -5.06 if he goes down — a 3.21-point swing, essentially the same size cliff the model assigns the Chiefs for a healthy-vs-hobbled Mahomes.",
        "Regression (-3.73) adds a second headwind: the model reads Pittsburgh as having overperformed its point differential in 2025, meaning some pullback toward the mean is already priced into the number, on top of the Rodgers risk.",
      ],
      fiveQuestions: [
        "Does Aaron Rodgers, at 42, hold up for a full season, or does the 3.21-point cliff become a live in-season problem the way it did for the Chiefs and Mahomes?",
        "Does an unsettled right guard spot actually cost Rodgers protection in a way that shows up in results?",
        "Is the full coaching staff overhaul a net positive by midseason, or does the -7 Trajectory number hold up?",
        "Does the AFC North race stay a coin flip with Baltimore all year, or does one team pull away?",
        "How much of 2025's 10-7 record was overperformance the model expects to correct in 2026?",
      ],
      whyModelThinks: {
        optimism: [
          "Power Score (-1.85) leads the AFC North, ahead of Baltimore's -1.87, by the thinnest margin in the model.",
          "Baseline is positive (+3.0), reflecting a 10-7 finish.",
        ],
        risks: [
          "Trajectory (-7.0) reflects a full coaching staff overhaul on top of an unsettled right guard spot.",
          "The Key-Person Dependency data is explicit: Power Score is -1.85 with a healthy Aaron Rodgers and -5.06 if he goes down — a 3.21-point cliff on a 42-year-old quarterback.",
          "Regression (-3.73) adds a second headwind — the model reads 2025 as overperformance against the team's own point differential.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Rodgers plays a full, healthy season at a level close to his career norm.",
          "Zach Frazier and the interior line hold up better than the “unsettled” framing suggests.",
          "Pittsburgh separates from Baltimore in the AFC North, rather than the race staying a coin flip.",
        ],
        lowerIf: [
          "Rodgers' 3.21-point cliff materializes — injury, decline, or both.",
          "The right guard spot is a real, visible liability in protection.",
          "2025's overperformance shows up as a real step back in the standings.",
        ],
      },
    },
    Patriots: {
      headline: "Patriots: 14-3 and Still Have Real Question Marks",
      oneLiner: "New England's turnaround under a new coaching staff is real by the record — but the model still flags an unaddressed pass-rush hole and bakes in some pullback from an overperforming 2025.",
      execSummary: [
        "The Patriots went 14-3 in 2025 and lead the AFC East by a wide margin — Power Score 2.63, well clear of Buffalo's 1.96. Baseline sits at +11.0, tied for the highest of any team profiled here, a direct reflection of that record.",
        "Two things pull the number back down from where the raw record alone would put it. Trajectory (-4) reflects a real, unaddressed hole at edge rusher, offset only partly by acquiring A.J. Brown (traded away by Philadelphia). Regression (-4.62) adds a second pullback: the model reads 2025 as somewhat better than New England's underlying point differential supports, meaning some regression toward the mean is already priced in for 2026.",
        "The genuine bright spot in the model's own language: no major star-injury flag on the downside case. This isn't a team with one obvious cliff the way Pittsburgh or Kansas City have — the risk here is more diffuse, spread across an unaddressed pass-rush need and an expected step back from an overperforming record.",
      ],
      fiveQuestions: [
        "Does the edge rusher hole get addressed in-season, or is it a full-year weakness?",
        "How much does A.J. Brown's arrival actually offset the hole at edge rusher?",
        "Does 2025's record hold up, or does the Regression pullback show up as real, visible decline?",
        "Is Jared Wilson's modest breakout case enough to matter, or just a depth note?",
        "Can New England hold off Buffalo by a wide-enough margin to make the AFC East a non-race?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline sits at +11.0, tied for the highest in the model, directly reflecting a 14-3 season.",
          "Power Score (2.63) leads the AFC East by a wide margin over Buffalo's 1.96.",
          "A.J. Brown was acquired via trade from Philadelphia, a real, already-completed roster addition.",
        ],
        risks: [
          "Trajectory (-4.0) reflects a real, unaddressed hole at edge rusher.",
          "Regression (-4.62) is a real pullback — the model reads 2025 as somewhat better than New England's underlying point differential supports.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The pass rush performs better than an unaddressed-hole framing suggests, even without a marquee addition.",
          "2025's record holds up with minimal regression — the point-differential gap the model flags doesn't show up as fewer wins.",
          "New England pulls away from Buffalo rather than the AFC East tightening.",
        ],
        lowerIf: [
          "The edge rusher hole is visibly exploited by good offensive lines.",
          "The Regression pullback materializes as a real step back in results.",
          "Buffalo, or another AFC East team, closes the gap faster than the model's current spread suggests.",
        ],
      },
    },
    Texans: {
      headline: "Texans: The Safest Bet in the AFC",
      oneLiner: "Houston's 2026 case is almost boringly simple — the model's own language calls this the roster with the fewest issues in the entire conference, and the risk here is mostly the risk of nothing going wrong.",
      execSummary: [
        "Houston went 12-5 in 2025 and enters 2026 with the model's third-highest Power Score of any team profiled here (4.62, trailing only Denver and Los Angeles) — full continuity, and the “fewest roster issues in the AFC” by the model's own language.",
        "Baseline (+7.0) and Trajectory (+5) both point up, and Regression (-1.42) is only a mild pullback — nothing close to the double-digit swings some other teams on this list are carrying. Calen Bullock is already rated excellent, with the model noting there's limited room for him to climb further — a nice problem to have.",
        "The one real question mark, a minor RB2 concern, is explicitly framed as the exception rather than the rule: the model's downside case for Houston isn't an injury flag or a scheme risk, it's simply “stable, healthy core — lowest risk in the division.”",
      ],
      fiveQuestions: [
        "Does the RB2 spot ever actually become a problem, or does it stay a non-factor all season the way the model expects?",
        "Is there any real ceiling left above Calen Bullock's already-excellent rating, or has the model already priced in his full value?",
        "Does full continuity translate to a fast start, or does familiarity breed a slow-developing complacency?",
        "How much does the -1.42 Regression pullback actually cost Houston in the standings?",
        "Is “fewest roster issues in the AFC” still true by midseason, or does a division rival close the gap?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+7.0) and Trajectory (+5.0) both point up, and Regression (-1.42) is only a mild pullback — nothing like the double-digit swings other teams on this list carry.",
          "Power Score (4.62) is the third-highest of any team in the model, trailing only Denver and the Rams.",
          "The roster carries full continuity into 2026, with the model's own language calling it the fewest roster issues in the AFC.",
        ],
        risks: [
          "A minor RB2 concern is the one real question mark the model flags, though it's explicitly framed as the exception rather than the rule.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Houston's record holds up close to 12-5 with minimal regression.",
          "Bullock's excellent play continues without a real ceiling showing up.",
          "The RB2 concern never actually costs the offense anything.",
        ],
        lowerIf: [
          "An unexpected injury or scheme issue emerges where the model currently sees none.",
          "The RB2 hole is exposed by a tougher opponent.",
          "Regression toward the mean shows up as a real, visible step back.",
        ],
      },
    },
    Bears: {
      headline: "Bears: A Real Record, With the Model's Biggest Single Pullback",
      oneLiner: "Chicago's 11-6 season and Caleb Williams' breakout momentum are real — but Regression (-5.67), the model's largest overperformance correction on this list, says some of that record won't repeat.",
      execSummary: [
        "The Bears went 11-6 in 2025, the NFC North's best record, riding real breakout momentum from Caleb Williams and a rookie class highlighted by Burden III tying A.J. Brown's rookie efficiency record.",
        "Baseline (+5.0) reflects the strong record, but Regression (-5.67) is the largest single pullback of any team profiled here — the model reads Chicago's 2025 point differential as not fully supporting an 11-6 finish, meaning real regression toward the mean is baked into the Power Score (0.77) already.",
        "The interior defensive line got what the model calls “zero improvement” this offseason, on an otherwise zero-coaching-turnover roster the model itself frames as low-risk: “young, ascending, healthy core.”",
      ],
      fiveQuestions: [
        "Does Caleb Williams' breakout momentum carry into a full season, or was 2025 a partial-sample high point?",
        "How much does the -5.67 Regression correction actually show up as fewer wins in 2026?",
        "Does the interior D-line's “zero improvement” offseason become a real, exploitable weakness?",
        "Does Burden III's rookie efficiency hold up over a full season of opposing game plans?",
        "Is a young, ascending, healthy core enough to hold off regression, or does inexperience show up in close games?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+5.0) reflects an 11-6 finish, the NFC North's best record.",
          "Caleb Williams' 2025 breakout and a rookie class headlined by Burden III (who tied A.J. Brown's rookie efficiency record) are both already on the books, not projections.",
          "Trajectory is only mildly negative (-1.0) — most of the pressure on Power Score comes from Regression, not a roster-quality read.",
        ],
        risks: [
          "Regression (-5.67) is the largest single overperformance correction of any team in the model — 2025's point differential didn't fully support an 11-6 finish.",
          "The interior defensive line got zero improvement this offseason.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Williams' 2025 breakout carries forward without a step back.",
          "Chicago's record holds up close to 11-6 despite the Regression flag.",
          "The interior D-line's lack of improvement never actually gets exposed.",
        ],
        lowerIf: [
          "The record visibly regresses toward the mean, matching the -5.67 correction.",
          "The interior D-line is exploited by a good rushing offense.",
          "Burden III's rookie efficiency proves to be a small-sample outlier.",
        ],
      },
    },
    Ravens: {
      headline: "Ravens: The Other Half of the AFC North Coin Flip",
      oneLiner: "Baltimore's 2026 season is the Steelers' mirror image — an even-money AFC North race, but here the swing factor is a full coaching staff overhaul and Lamar Jackson's own injury-availability history, not one specific cliff number.",
      execSummary: [
        "The Ravens finished 8-9 in 2025 and sit second in the AFC North, Power Score -1.87 to Pittsburgh's -1.85 — the same razor-thin margin from the other side. This is genuinely a coin-flip division, not just from the Steelers' vantage point.",
        "Trajectory (-6) reflects real disruption: a full HC/OC/DC overhaul and the loss of All-Pro center Linderbaum, whose replacements are described plainly as “career backups.” Regression (+3.41) cuts the other way, though — the model reads Baltimore as having underperformed its point differential in 2025, meaning some positive correction toward the mean is already baked in, unlike Pittsburgh's negative one.",
        "There's no single flagged Key-Person cliff here the way there is for Pittsburgh's Rodgers or Kansas City's Mahomes, but the risk is named plainly all the same: “Lamar Jackson has a real recent injury-availability history,” and a full new coaching staff adds real installation risk on top of it.",
      ],
      fiveQuestions: [
        "Does the +3.41 Regression correction actually show up as more wins, offsetting the full coaching overhaul's disruption?",
        "How much does replacing an All-Pro center with “career backups” cost the offense in real games?",
        "Does Lamar Jackson stay healthy for a full season, given the model's own flag on his recent history?",
        "Does a brand-new HC/OC/DC staff install its system fast enough to compete from Week 1?",
        "Does Baltimore or Pittsburgh actually pull away in the AFC North, or does the coin flip stay a coin flip all season?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is positive (+3.41) — the model reads Baltimore as having underperformed its point differential in 2025, the opposite correction from division-rival Pittsburgh.",
          "Power Score (-1.87) trails Pittsburgh by just two-hundredths of a point — the closest division race in the model.",
        ],
        risks: [
          "Trajectory (-6.0) reflects a full HC/OC/DC overhaul and the loss of All-Pro center Linderbaum, whose replacements are described as career backups.",
          "Lamar Jackson carries a real, recent injury-availability history, flagged directly in the model's own language.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Jackson stays healthy and available for close to a full season.",
          "The new coaching staff's system is competitive early, not a slow install.",
          "The center position is a manageable, not costly, weak spot.",
        ],
        lowerIf: [
          "Jackson misses real time, matching the model's injury-history flag.",
          "Replacing Linderbaum is visibly costly to the offense.",
          "The coaching transition is rocky enough to show up in the record.",
        ],
      },
    },
    Chargers: {
      headline: "Chargers: An 11-6 Record the Model Doesn't Fully Believe",
      oneLiner: "Los Angeles won 11 games in 2025, but the model's own math says some of that was borrowed — Regression (-5.12) is one of the largest pullbacks on this list, on a roster still waiting to fix its offensive guard spot.",
      execSummary: [
        "The Chargers went 11-6 in 2025, second in the AFC West behind Denver, but their Power Score (-0.17) is actually negative — one of the biggest gaps between raw record and model output of any team profiled here.",
        "Baseline (+5.0) reflects the record, but Trajectory (-4) and Regression (-5.12) both pull hard the other way. Regression in particular is one of the largest single corrections on this list, meaning the model reads a meaningful chunk of that 11-6 finish as not repeatable — Los Angeles's actual point differential didn't fully back up the win total.",
        "Offensive guard remains an unresolved weak link, and the swing factor at the very top of the roster is explicit in the model's own language: “Herbert carries some recent injury history.” Jamaree Caldwell projecting for more pass-rush reps is a real bright spot, but a smaller one than the two headwinds above it.",
      ],
      fiveQuestions: [
        "How much of the -5.12 Regression correction actually shows up as fewer wins in 2026?",
        "Does the offensive guard spot get fixed, or does it stay a live weakness protecting Justin Herbert?",
        "Does Herbert's own injury-availability history become a real, season-altering factor?",
        "Does Jamaree Caldwell's expanded pass-rush role meaningfully move the defense's numbers?",
        "Can Los Angeles actually close the gap to Denver in the AFC West, or does the model's -0.17 versus Denver's 4.89 hold up as a real, wide gap?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+5.0) reflects an 11-6 finish, second in the AFC West.",
          "Jamaree Caldwell projects for an expanded pass-rush role, a real on-roster addition.",
        ],
        risks: [
          "Trajectory (-4.0) and Regression (-5.12) both pull hard against Baseline — Power Score (-0.17) is actually negative, one of the widest record-to-model gaps in the league.",
          "Offensive guard remains an unresolved weak link protecting Justin Herbert, who himself carries recent injury history.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Los Angeles's record holds up close to 11-6 with minimal regression.",
          "Herbert stays healthy and available for a full season.",
          "Offensive guard is a manageable, not costly, weak spot.",
        ],
        lowerIf: [
          "The record visibly regresses, matching the -5.12 correction.",
          "Herbert's injury history becomes a real, in-season factor.",
          "Offensive guard is exploited and costs real protection.",
        ],
      },
    },
    Seahawks: {
      headline: "Seahawks: Coming Off 14-3, With a Fresh Injury Wrinkle",
      oneLiner: "Seattle's title-level record is real, but a newly reported Zach Charbonnet ACL recovery is exactly the kind of late-breaking downside the model didn't have priced in until just now.",
      execSummary: [
        "The Seahawks went 14-3 in 2025 — the model's own language calls it “champions' momentum” — and enter 2026 with the third-best Power Score in this whole group (3.68), behind only Denver and the Rams among teams profiled here.",
        "Baseline (+11.0) is tied for the highest of any team on this list, matching the strength of that record. Trajectory (-2) and Regression (-2.87) both trim the number some, and WR depth beyond Jaxon Smith-Njigba, plus an aging Kupp, is flagged as a real concern — the passing game's ceiling may be lower than the record alone suggests.",
        "The most recent development is a real, live risk: Zach Charbonnet's ACL recovery could cost him the start of the season, a newly reported factor the model has only just priced in — Downside has been raised accordingly, offset only modestly by rookie Jadarian Price picking up early snaps.",
      ],
      fiveQuestions: [
        "How much of the season does Charbonnet miss, and how well does Jadarian Price fill in?",
        "Is WR depth beyond Smith-Njigba (and an aging Kupp) a real limiter, or does the passing game find answers?",
        "Does AJ Barner's “discount Kittle” upside case materialize as a real receiving weapon at tight end?",
        "Does the aging defensive core show real signs of decline, or does it hold up post-title the way the model's downside case assumes it might not?",
        "Does Seattle stay ahead of the Rams in the NFC West, or does the 3.68-to-4.72 gap close or reverse?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+11.0) is tied for the highest in the model, directly reflecting a 14-3 season.",
          "Power Score (3.68) is the third-best in the model among teams profiled here, behind only Denver and the Rams.",
        ],
        risks: [
          "WR depth beyond Jaxon Smith-Njigba, plus an aging Kupp, is a flagged real concern.",
          "Zach Charbonnet's ACL recovery is a newly reported, live risk that could cost him the start of the season.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Charbonnet returns quickly and Price's early snaps prove to be a seamless bridge, not a real drop-off.",
          "WR depth beyond Smith-Njigba proves to be a non-issue.",
          "The defense shows no real signs of post-title decline.",
        ],
        lowerIf: [
          "Charbonnet misses real time and the backfield production visibly suffers.",
          "WR depth is exposed, capping the passing game.",
          "The aging defensive core shows real, visible decline.",
        ],
      },
    },
    Panthers: {
      headline: "Panthers: A Real Defensive Investment, Still Waiting on Bryce Young",
      oneLiner: "Carolina's 2026 case rests on defense doing the heavy lifting again — Trajectory (+6) reflects real investment there — while the offense's outlook still comes down to whether Bryce Young's “lingering performance/confidence risk” finally resolves.",
      execSummary: [
        "The Panthers finished 8-9 in 2025, second in the NFC South behind New Orleans, with a Power Score of 0.76 — not far off the Saints' 1.77 in a division the model doesn't see as settled.",
        "Trajectory (+6) is a real positive here, driven by genuine defensive investment, including a premium new Edge signing that the model expects gives Scourton easier snaps. Regression (-4.44) works against that some, reading 2025 as somewhat better than Carolina's underlying point differential supports.",
        "The offense's outstanding question is named plainly rather than softened: “Young carries some lingering performance/confidence risk.” A TE hole went unaddressed this offseason too, though the model weighs that as a low-importance gap next to the Bryce Young question.",
      ],
      fiveQuestions: [
        "Does Bryce Young's “lingering performance/confidence risk” finally resolve in a full, healthy season?",
        "Does the new Edge signing's easier-snaps effect on Scourton show up as real, visible pass-rush production?",
        "Is the unaddressed TE hole ever actually costly, or does it stay a low-weight non-issue as the model expects?",
        "How much does the -4.44 Regression correction show up as fewer wins in 2026?",
        "Can Carolina actually close the gap to New Orleans (0.76 to 1.77) and take the NFC South, or does the division stay New Orleans's to lose?",
      ],
      whyModelThinks: {
        optimism: [
          "Trajectory is positive (+6.0), driven by real defensive investment, including a premium Edge signing already on the roster.",
        ],
        risks: [
          "Regression (-4.44) works against that gain — the model reads 2025 as somewhat better than Carolina's underlying point differential supports.",
          "Bryce Young carries a named, unresolved performance/confidence risk.",
          "A TE hole went unaddressed this offseason, though the model weighs it as low-importance next to the QB question.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Young has a clean, confident season without the flagged risk showing up.",
          "The defensive investment (Edge signing, Scourton's expanded role) shows up clearly in results.",
          "Carolina closes the gap to New Orleans in the division race.",
        ],
        lowerIf: [
          "Young's performance/confidence risk visibly resurfaces.",
          "The defensive investment doesn't translate to real production.",
          "The TE hole turns out to matter more than the model's low-weight framing assumed.",
        ],
      },
    },
    Bills: {
      headline: "Bills: Buffalo's Real Question Is a Full Coaching Turnover",
      oneLiner: "The Bills won 12 games in 2025, but a full staff turnover — softened only by an internal promotion — and an undisclosed injury in the linebacker room are the two threads the model is actually watching in Buffalo.",
      execSummary: [
        "Buffalo went 12-5 in 2025, second in the AFC East behind New England's 2.63 Power Score at 1.96 — a real gap, not a close race.",
        "Baseline (+7.0) reflects the strong record, and Trajectory (-2) and Regression (-2.45) trim it only modestly — nothing like the double-digit corrections some AFC teams on this list are carrying. The linebacker corps is flagged as a real but moderate weakness, and the model notes it's carrying an undisclosed injury into camp.",
        "The coaching staff saw full turnover this offseason, softened by an internal promotion rather than a completely outside hire — a real transition, but not as disruptive as a clean-slate rebuild. T.J. Sanders projects as a real rotational piece at defensive tackle.",
      ],
      fiveQuestions: [
        "Does the undisclosed linebacker injury turn out to be significant, or a camp-only concern?",
        "Does a full coaching staff turnover, softened by internal promotion, install smoothly or cost Buffalo early-season cohesion?",
        "Is the linebacker corps' weakness ever actually exploited by a good rushing attack?",
        "Does T.J. Sanders' rotational role at DT turn into more than expected?",
        "Can Buffalo close a real gap to New England (1.96 to 2.63) in the AFC East, or does the Patriots' margin hold up?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+7.0) reflects a 12-5 season, and Trajectory/Regression together trim only modestly — nothing like the double-digit corrections other AFC teams carry.",
          "T.J. Sanders projects as a real rotational piece at defensive tackle.",
        ],
        risks: [
          "The coaching staff saw full turnover this offseason, softened only by one internal promotion rather than a completely outside hire.",
          "The linebacker corps carries an undisclosed injury into camp, on top of being a real, moderate weakness already.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The undisclosed LB injury turns out to be minor or resolved before Week 1.",
          "The new coaching staff installs cleanly, aided by the internal promotion.",
          "Buffalo closes the gap to New England rather than trailing all season.",
        ],
        lowerIf: [
          "The LB injury is more significant than currently disclosed.",
          "The coaching transition is rockier than the internal-promotion framing suggests.",
          "The gap to New England widens rather than closes.",
        ],
      },
    },
    Dolphins: {
      headline: "Dolphins: A Full Rebuild, Starting From the Weakest WR Room the Model Has Seen",
      oneLiner: "Miami's 2026 outlook is refreshingly blunt in the model's own words — the weakest receiver corps it's ever evaluated, on a roster undergoing a full head-coach-and-both-coordinators rebuild.",
      execSummary: [
        "The Dolphins finished 7-10 in 2025, last in the AFC East, and the model's language doesn't soften it: the receiver room is described as the weakest “we've ever seen.” A new head coach and both coordinators are new too — this is a full rebuild, not a retool.",
        "Trajectory (-9) is deeply negative, reflecting that scale of turnover, while Baseline (-3.0) and Regression (-1.44) are comparatively minor drags — most of Miami's problem is structural, not bad luck.",
        "Patrick Paul is a real bright spot as an ascending young left tackle, but the model's own downside case is stark: “full teardown, thin depth if anyone goes down” — there's little cushion if injuries hit.",
      ],
      fiveQuestions: [
        "Does the new coaching staff's system show real installation progress by midseason?",
        "Is there any real answer at receiver, or does the room stay the weakest the model has flagged?",
        "Does Patrick Paul's development at left tackle continue on pace?",
        "How much does thin depth actually cost Miami if a starter goes down?",
        "Is 2026 a true bottom-out year, or does the rebuild show early signs of working?",
      ],
      whyModelThinks: {
        optimism: [
          "Patrick Paul is a real, already-rostered bright spot as an ascending young left tackle.",
          "Baseline (-3.0) and Regression (-1.44) are comparatively minor drags — most of Miami's problem is structural, not bad luck.",
        ],
        risks: [
          "Trajectory (-9.0) is deeply negative, reflecting a full head-coach-and-both-coordinators rebuild.",
          "The receiver room is described in the model's own language as the weakest it has ever evaluated.",
          "The model's downside case is explicit: thin depth if anyone goes down.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The receiver room finds real answers, even unexpectedly, during camp or early season.",
          "The new coaching staff shows quick, visible installation progress.",
          "Depth holds up even when starters miss time.",
        ],
        lowerIf: [
          "The receiver room performs as poorly as the model's own blunt framing suggests.",
          "An injury exposes the thin depth the model already flagged.",
          "The coaching transition is visibly rocky.",
        ],
      },
    },
    Jets: {
      headline: "Jets: A 3-14 Record the Model Doesn't Take at Face Value",
      oneLiner: "New York's actual record was brutal, but Regression (+2.58) and a genuinely productive offseason say the underlying team wasn't quite as bad as 3-14 looks.",
      execSummary: [
        "The Jets went 3-14 in 2025, the AFC East's worst record by a wide margin — but Power Score (-4.43) is well ahead of where Baseline (-11.0) alone would put a team that bad, because Regression (+2.58) and neutral Trajectory (0) both work in New York's favor.",
        "The model calls the offseason “extremely productive” despite an ongoing interior offensive line flaw, and this is full continuity into Year 2 of whatever system is being built — not another coaching reset on top of a bad season.",
        "T'Vondre Sweat is flagged with real breakout upside at defensive tackle, and the model's own downside case is notably mild for a 3-14 team: “full rebuild, but no major star injury” — nothing catastrophic identified beyond the rebuild itself.",
      ],
      fiveQuestions: [
        "Does the +2.58 Regression correction actually show up as more wins in 2026, or was 3-14 a fair read after all?",
        "Does the interior offensive line flaw get addressed in-season, or stay a full-year weakness?",
        "Does T'Vondre Sweat's breakout upside materialize as real production?",
        "Does Year 2 continuity produce visible systemic improvement over a 3-14 baseline?",
        "How much does an easy 2026 schedule (one of the softest on this list) flatter New York's win total regardless of underlying improvement?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is positive (+2.58) and Trajectory is neutral (0) — both work in New York's favor relative to Baseline alone.",
          "The offseason is described in the model's own language as extremely productive.",
          "T'Vondre Sweat is flagged with real breakout upside at defensive tackle.",
        ],
        risks: [
          "Baseline (-11.0) directly reflects a 3-14 finish, one of the worst in the league.",
          "An interior offensive line flaw remains unaddressed.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The Regression correction shows up as real, meaningful win-total improvement.",
          "The interior offensive line stabilizes.",
          "Sweat's breakout case proves real.",
        ],
        lowerIf: [
          "The record stays bad even accounting for better luck, suggesting 3-14 was closer to the truth.",
          "The offensive line remains a costly, exploited weakness.",
          "Year 2 continuity doesn't translate to visible improvement.",
        ],
      },
    },
    Bengals: {
      headline: "Bengals: A Third Team on This List With the Same 3.21-Point QB Cliff",
      oneLiner: "Cincinnati's season comes down to Joe Burrow's health as directly as Kansas City's comes down to Mahomes — the model assigns the exact same 3.21-point Key-Person cliff to both, on top of a defense that's been bottom-8 three years running.",
      execSummary: [
        "The Bengals finished 6-11 in 2025 and enter 2026 with a Power Score of -3.88, third in a weak AFC North. Full continuity carries over from last season, but the defense has been bottom-8 for three straight years and is historically bad against tight ends specifically.",
        "The model's Key-Person Dependency data is explicit and high-confidence: Cincinnati's Power Score is -3.88 with a healthy Joe Burrow and -7.09 if he goes down — a 3.21-point swing, the same standard cliff size the model applies to any starting-caliber quarterback, and identical to what it assigns Kansas City's Mahomes and Pittsburgh's Rodgers on this same list.",
        "Erick All Jr. could lead a rebuilt tight end room if he's healthy, but his own ACL history layers directly onto Burrow's recent injury history — two health questions stacked on top of each other at the two positions the model is watching closest.",
      ],
      fiveQuestions: [
        "Does Joe Burrow stay healthy for a full season, avoiding the 3.21-point cliff the model has flagged?",
        "Does the defense's three-year run as bottom-8 finally turn around, or does it stay the roster's clearest weakness?",
        "Is Erick All Jr. healthy enough to actually lead the tight end room, given his own ACL history?",
        "Does the historically bad performance against tight ends specifically get fixed, or does it remain exploitable?",
        "With a soft 2026 schedule (one of the easiest on this list), does a healthy Burrow alone get Cincinnati back to a winning record?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is positive (+2.35), a modest offsetting correction.",
          "Full continuity carries over from last season — no coaching turnover to install around.",
        ],
        risks: [
          "The defense has been bottom-8 for three straight years, and is historically bad against tight ends specifically.",
          "The Key-Person Dependency data is explicit: Power Score is -3.88 with a healthy Joe Burrow and -7.09 if he goes down — a 3.21-point cliff, identical in size to the Chiefs' and Steelers' quarterback dependencies.",
          "Erick All Jr.'s own ACL history sits on top of Burrow's recent injury history — two health questions stacked at the two positions the model watches closest.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Burrow plays a full, healthy season.",
          "The defense shows real improvement after three years at the bottom of the league.",
          "Erick All Jr. stays healthy and leads a productive tight end room.",
        ],
        lowerIf: [
          "Burrow's 3.21-point cliff materializes — injury takes him off the field for real time.",
          "The defense's tight-end weakness specifically gets exploited again.",
          "All's ACL history recurs, leaving the TE room thin again.",
        ],
      },
    },
    Browns: {
      headline: "Browns: The QB Question That's Outlasted Decades of Regimes",
      oneLiner: "Cleveland's Trajectory score (-14) is one of the single worst numbers on this entire list — and the model's own language makes clear why: an unresolved quarterback room that's been “the defining issue for decades.”",
      execSummary: [
        "The Browns finished 5-12 in 2025, last in the AFC North, with a Power Score of -7.72 — in the same bottom tier as the Raiders and Cardinals on this list. Baseline (-7.0) reflects the bad record, but Trajectory (-14) is the second-most negative of any team in the entire model, behind only Detroit's -15.",
        "The model doesn't soften why: the quarterback position “has been the defining issue for decades, still unresolved.” A full coaching staff overhaul is underway, but it's installing into a roster still built around that same open question.",
        "Tyson Campbell steps into a bigger role as a proven veteran, a real, concrete bright spot. But the model's own downside case is unambiguous: “still rebuilding around an unresolved QB room” — the single hardest problem on this roster isn't new, and isn't solved yet.",
      ],
      fiveQuestions: [
        "Does any answer at quarterback emerge in 2026, or does the decades-long question stay open?",
        "Does the new coaching staff's system show real progress despite the QB uncertainty underneath it?",
        "Does Tyson Campbell's bigger role produce the kind of proven-veteran stability the model expects?",
        "Is -14 Trajectory a fair read on the scale of this rebuild, or does the model risk being too pessimistic about young talent elsewhere on the roster?",
        "Does Regression's modest positive correction (+1.63) suggest Cleveland was slightly unlucky in 2025, or does it just mean a bad team was bad in a fairly predictable way?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is mildly positive (+1.63), a small offsetting correction.",
          "Tyson Campbell steps into a bigger role as a proven veteran, a concrete, already-rostered bright spot.",
        ],
        risks: [
          "Trajectory (-14.0) is the second-most negative of any team in the entire model, behind only Detroit's -15.",
          "The quarterback position is described as the defining issue for decades, still unresolved.",
          "Baseline (-7.0) reflects a 5-12 finish directly.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "A real, sustainable answer at quarterback emerges, even a partial one.",
          "Tyson Campbell's expanded role produces clear, stabilizing results.",
          "The new coaching staff shows fast, visible installation progress.",
        ],
        lowerIf: [
          "The quarterback question remains as unresolved at the end of 2026 as it's been for years.",
          "The rebuild shows no visible progress across a full season.",
          "Depth elsewhere on the roster proves as thin as the Trajectory number suggests.",
        ],
      },
    },
    Jaguars: {
      headline: "Jaguars: A Strong Record, One Swing Factor Left",
      oneLiner: "Jacksonville's 13-4 season and one of the highest Baseline scores on this list come with one persistent asterisk the model keeps flagging: Trevor Lawrence's health and consistency.",
      execSummary: [
        "The Jaguars went 13-4 in 2025, second in a tough AFC South behind Houston, with a Power Score of 3.67 — Baseline alone sits at +9.0, one of the highest on this list, a direct reflection of that record.",
        "Trajectory (+1) is modestly positive and Regression (-3.64) trims some back, but neither is dramatic — this reads as a genuinely earned strong season, not one propped up by luck. Etienne's departure leaves a low-importance RB committee, and full continuity carries the rest of the roster forward.",
        "The one recurring line in the model's own language is Trevor Lawrence: “health and consistency remains a swing factor.” Everything else about this roster is stable — this is the one real variable left.",
      ],
      fiveQuestions: [
        "Does Trevor Lawrence stay healthy and consistent for a full season?",
        "Is the RB committee replacing Etienne good enough, or does it become a real limiter?",
        "Does Ruke Orhorhoro's fresh start at DT produce real snaps and production on a thin chart?",
        "How much does one of the toughest schedules on this list (SOS rank 5) cost Jacksonville in the standings?",
        "Can Jacksonville close the gap to Houston in the AFC South, or does the model's 4.62-to-3.67 gap hold?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline sits at +9.0, one of the highest in the model, a direct reflection of a 13-4 season.",
          "Trajectory is modestly positive (+1.0) — this reads as a genuinely earned strong season, not one propped up by luck.",
        ],
        risks: [
          "Regression (-3.64) trims some back from an otherwise strong number.",
          "Trevor Lawrence's health and consistency is the one recurring variable the model keeps flagging.",
          "Etienne's departure leaves a running back committee behind him.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Lawrence plays a full, consistent, healthy season.",
          "The RB committee proves adequate without a clear lead back.",
          "Jacksonville is competitive against its tough schedule, not overwhelmed by it.",
        ],
        lowerIf: [
          "Lawrence's health or consistency becomes a real, visible problem.",
          "The RB committee is exposed as a real weakness.",
          "The tough schedule (SOS rank 5) produces a losing stretch that costs the division.",
        ],
      },
    },
    Colts: {
      headline: "Colts: The Model's Luck Adjustment Likes Indianapolis More Than the Record Does",
      oneLiner: "An 8-9 record undersells what the numbers say — Regression (+5.2), one of the largest positive corrections on this list, says Indianapolis was better than its record, even before factoring in a newly reported Alec Pierce injury.",
      execSummary: [
        "The Colts went 8-9 in 2025, but Power Score (-0.11) is nearly even — well ahead of where Baseline (-1.0) alone would suggest, because Regression (+5.2) is one of the largest positive corrections of any team on this list. The model reads Indianapolis's underlying performance as better than an 8-9 record shows.",
        "A real WR2 hole opened after trading Pittman, but the Jones extension resolves the quarterback uncertainty that used to sit over this roster, and Josh Downs carries real target-share upside into a clearer offensive picture.",
        "The most recent development complicates the receiver room further: Alec Pierce's ankle surgery (after a failed non-surgical treatment) carries a 4-6 month recovery that could cost him the preseason and part of the regular season — layering directly onto an already-thin WR2 situation. Downside has been raised, though only modestly, and Jones himself carries his own recent injury history on top of it.",
      ],
      fiveQuestions: [
        "Does the +5.2 Regression correction actually show up as more wins in 2026?",
        "How much time does Alec Pierce actually miss, and how does that affect an already-thin WR2 room?",
        "Does Josh Downs' target-share upside grow enough to offset the WR2 hole?",
        "Does the Jones extension's QB stability hold up against his own recent injury history?",
        "Is 8-9 closer to Indianapolis's true level, or was the model's luck-adjustment read correct?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression sits at +5.2, one of the largest positive corrections in the model — the model reads Indianapolis's underlying performance as better than an 8-9 record shows.",
          "The Jones extension resolves the quarterback uncertainty that used to sit over this roster.",
          "Josh Downs carries real, already-rostered target-share upside.",
        ],
        risks: [
          "A real WR2 hole opened after trading Pittman.",
          "Alec Pierce's ankle surgery carries a 4-6 month recovery window that could cost him real regular-season time, layering onto an already-thin WR2 room.",
          "Jones himself carries his own recent injury history.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The Regression correction shows up as real, visible win-total improvement.",
          "Pierce returns closer to the front of his recovery window, minimizing lost time.",
          "Josh Downs' expanded role covers the WR2 gap adequately.",
        ],
        lowerIf: [
          "The record stays flat or worsens even accounting for better underlying luck.",
          "Pierce's recovery runs long, costing real regular-season time on top of the preseason.",
          "Jones' own injury history becomes a real, in-season factor.",
        ],
      },
    },
    Titans: {
      headline: "Titans: A 3-14 Record, With the Division's Best Upside Case",
      oneLiner: "Tennessee's record was the AFC South's worst by a mile, but Cam Ward's rookie emergence gives the model its strongest upside case in the entire division — the roster underneath him is still the real question.",
      execSummary: [
        "The Titans went 3-14 in 2025, last in the AFC South, with a Power Score of -4.8. Baseline (-11.0) reflects that bad record directly, but Trajectory (-1) is nearly neutral — much less negative than the record alone would suggest — and Regression (+2.5) adds a bit more back, some of it real underlying improvement, some of it a luck correction.",
        "The real story is Cam Ward: his rookie emergence, alongside Helm, earned both players spots on the league's All-Breakout Team — the model calls it the strongest upside case anywhere in the division. A new head coach and offensive coordinator are installing around that momentum.",
        "The secondary remains unaddressed, and the model's downside case is direct: Ward is still unproven over a full season, and the roster underneath him remains division-worst. This is real promise sitting on top of a genuinely thin foundation.",
      ],
      fiveQuestions: [
        "Does Cam Ward's rookie emergence carry into a full sophomore season, or was it a small-sample breakout?",
        "Does Helm's own breakout production continue alongside Ward's?",
        "Does the unaddressed secondary become a costly, exploited weakness?",
        "Do the new HC and OC install a system that supports Ward's development?",
        "Is the roster underneath Ward good enough to turn his individual progress into real team wins, or does a division-worst supporting cast cap the ceiling?",
      ],
      whyModelThinks: {
        optimism: [
          "Trajectory is nearly neutral (-1.0), much less negative than the record alone would suggest, and Regression (+2.5) adds a bit more back.",
          "Cam Ward and Helm both earned spots on the league's All-Breakout Team as rookies — the model calls it the strongest upside case anywhere in the division.",
        ],
        risks: [
          "Baseline (-11.0) directly reflects a 3-14 finish, the AFC South's worst.",
          "The secondary remains unaddressed.",
          "Ward is still unproven over a full season, on a roster that remains division-worst outside of him.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Ward's rookie emergence continues and translates to a meaningfully better record.",
          "Helm's breakout production holds up over a full season.",
          "The new coaching staff's system shows real, fast installation.",
        ],
        lowerIf: [
          "Ward regresses once defenses have a full season of tape on him.",
          "The secondary is exposed as a real, costly weakness.",
          "The roster underneath Ward proves too thin to support his individual growth.",
        ],
      },
    },
    Vikings: {
      headline: "Vikings: Zero Coaching Turnover, One Unresolved Question at QB",
      oneLiner: "Minnesota returns its entire coaching staff from a 9-8 season, but an unresolved quarterback competition is the one variable the model can't fully price in yet.",
      execSummary: [
        "The Vikings went 9-8 in 2025, second in the NFC North, with a Power Score of -1.75. Baseline (+1.0) is modestly positive, matching a modest winning record, while Trajectory (-6) reflects real uncertainty layered on top.",
        "Zero coaching turnover carries real continuity into 2026, and James Pierre adds a solid rotational piece at cornerback. Tight end production is flagged as weak, but the model treats it as low-importance rather than a real driver of the outlook.",
        "The central open question is at quarterback: the competition is unresolved, and the model's own language is direct that this uncertainty is “already priced into Stability” — meaning the roster's risk score already assumes this is unsettled, rather than treating it as a surprise waiting to happen.",
      ],
      fiveQuestions: [
        "Who wins the quarterback competition, and how early is it resolved?",
        "Does the eventual starter perform at a level that improves on Stability's already-priced-in uncertainty?",
        "Does tight end production stay a low-importance non-factor, or become a real limiter?",
        "Does zero coaching turnover translate into a faster start than teams still installing new systems?",
        "Does James Pierre's addition at corner meaningfully upgrade the secondary?",
      ],
      whyModelThinks: {
        optimism: [
          "Zero coaching turnover carries real continuity into 2026.",
          "James Pierre adds a real, already-rostered piece at cornerback.",
          "Baseline is modestly positive (+1.0), matching a 9-8 record.",
        ],
        risks: [
          "Trajectory (-6.0) reflects real uncertainty layered on top of a modest record, centered on an unresolved quarterback competition.",
          "Tight end production is flagged as weak, even though the model treats it as low-importance.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The QB competition resolves early and cleanly, with a clear, competent starter.",
          "Coaching continuity shows up as a fast, cohesive start to the season.",
          "Tight end production stays a genuine non-issue.",
        ],
        lowerIf: [
          "The QB competition drags on or produces below-replacement-level play.",
          "Tight end production becomes a real, costly weakness despite the low-importance framing.",
          "The secondary doesn't show real improvement despite the Pierre addition.",
        ],
      },
    },
    Packers: {
      headline: "Packers: Micah Parsons' Recovery Timeline Just Got Worse",
      oneLiner: "Green Bay's outlook keeps sliding as more comes out about Micah Parsons' ACL and meniscus recovery — now expected to cost him most of the regular season, not just an uncertain stretch of it.",
      execSummary: [
        "The Packers went 9-7-1 in 2025, third in the NFC North, with a Power Score of -2.7. Baseline (+2.0) is modestly positive, but Trajectory (-10) is one of the more negative numbers on this list, driven almost entirely by one position: Edge, where Parsons' health leaves a real hole at a premium spot.",
        "The situation has gotten more serious, not less, since it was first flagged: Parsons' ACL and meniscus recovery is now reported as likely to sideline him for much of the regular season — he isn't expected to be cleared for practice until September at the earliest, with a return targeted for the postseason. That's a materially worse update than an uncertain-timeline framing, and both Stability and Downside have been raised to reflect it.",
        "Zero coaching turnover keeps the rest of the system intact, and Anthony Belton profiles as a real starting-caliber guard. But this is a team whose outlook is dominated by one player's recovery calendar more than almost any other roster on this list — the model's own Key-Person math for non-QB positions like Edge is flagged as unreliable for precise cliff numbers, but the qualitative read is unambiguous: Green Bay is worse off for most of 2026 without Parsons on the field.",
      ],
      fiveQuestions: [
        "Does Parsons actually return for the postseason as targeted, or does the recovery run even longer?",
        "Can the pass rush hold up at a competitive level for most of a season without him?",
        "Does Anthony Belton's starting-caliber guard play stabilize the offensive line enough to offset the defensive loss?",
        "How much does one of the toughest schedules on this list (SOS rank 4) compound a season already missing its best defender?",
        "Does zero coaching turnover provide enough system stability to weather Parsons' absence?",
      ],
      whyModelThinks: {
        optimism: [
          "Zero coaching turnover keeps the rest of the system intact.",
          "Anthony Belton profiles as a real, already-rostered starting-caliber guard.",
          "Baseline is positive (+2.0), matching a 9-7-1 record.",
        ],
        risks: [
          "Trajectory (-10.0) is one of the more negative numbers in the model, driven almost entirely by Micah Parsons' ACL and meniscus recovery, now reported likely to cost him most of the regular season.",
          "The Key-Person Dependency data for non-QB positions like Edge is flagged unreliable for precise cliff numbers here — Parsons' listed cliff is wrong-signed and shouldn't be read literally, only the qualitative read (Green Bay is worse off without him) is trustworthy.",
          "One of the toughest schedules in the model (SOS rank 4) compounds a season already missing its best defender.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Parsons returns earlier than the September-practice, postseason-return timeline suggests.",
          "The pass rush performs credibly without him for most of the season.",
          "Belton's play at guard is a clear, stabilizing positive.",
        ],
        lowerIf: [
          "Parsons' recovery runs even longer than currently reported.",
          "The pass rush is visibly, measurably worse without him.",
          "The tough schedule compounds his absence into a lost season.",
        ],
      },
    },
    Lions: {
      headline: "Lions: The Worst Trajectory Score in the League, on a 9-8 Team",
      oneLiner: "Detroit's secondary situation is as bad as the numbers get — Trajectory (-15) is the single most negative score of any team in the model, worse even than teams with far worse actual records.",
      execSummary: [
        "The Lions went 9-8 in 2025 — a perfectly respectable record, and last in the NFC North only because the division itself is strong. But Trajectory (-15) is the worst of any team in the model's full 32-team dataset, worse than Cleveland's -14 or Arizona's -12, teams with far worse actual records than Detroit's.",
        "The reason is concentrated almost entirely in one position group: the secondary is described as “riddled with red flags” — an arrest, an Achilles tear, and a knee issue, before the most recent update. Head coach Dan Campbell's own words on safety Kerby Joseph are now on record: the team “does not know when or if he will return” — a more severe status than a recovery-timeline question, and both Downside and Stability have been raised to reflect it.",
        "Roger McCreary gets a real bounce-back opportunity in that same battered secondary, and only the offensive coordinator changed — the rest of the staff is intact. But this is a roster where one position group's crisis is doing almost all of the damage to an otherwise solid, 9-8-caliber team.",
      ],
      fiveQuestions: [
        "Does Kerby Joseph return at all in 2026, given his own head coach's uncertainty about it?",
        "Can Roger McCreary's bounce-back opportunity offset even part of the secondary's damage?",
        "Does the secondary's run of red flags (arrest, Achilles, knee) stay isolated, or does it spread to further injuries?",
        "Is -15 Trajectory an overcorrection for one position group's problems, or does it accurately capture how much a bad secondary can sink an otherwise solid team?",
        "Does a 9-8-caliber roster elsewhere hold up well enough to offset the secondary being this depleted?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression is positive (+3.06), a real offsetting correction.",
          "Roger McCreary gets a real, already-rostered bounce-back opportunity in the secondary.",
          "Only the offensive coordinator changed — the rest of the coaching staff is intact.",
        ],
        risks: [
          "Trajectory (-15.0) is the single most negative score of any team in the model's full 32-team dataset.",
          "The secondary is described as riddled with red flags — an arrest, an Achilles tear, and a knee issue.",
          "Head coach Dan Campbell has said the team does not know when or if safety Kerby Joseph will return — the Key-Person data itself is flagged low-confidence and wrong-signed here, so only the qualitative severity is trustworthy, not the listed cliff number.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Kerby Joseph returns during the season, even later than expected.",
          "McCreary's bounce-back is real and the secondary performs better than the red-flag list suggests.",
          "The rest of the roster's 9-8-level strength shows up clearly despite the secondary's issues.",
        ],
        lowerIf: [
          "Joseph doesn't return at all in 2026, matching his head coach's own uncertainty.",
          "The secondary's problems compound with further injuries or issues.",
          "The secondary's weakness is exploited badly enough to drag down the rest of the roster's performance.",
        ],
      },
    },
    Buccaneers: {
      headline: "Buccaneers: A New Offensive Coordinator, and a Contract Situation to Watch",
      oneLiner: "Tampa Bay's 2026 season hinges on a new-hire offensive coordinator finding answers at receiver and tight end, while Baker Mayfield's contract situation sits over the whole operation.",
      execSummary: [
        "The Buccaneers went 8-9 in 2025, third in the NFC South, with a Power Score of -0.62 — Baseline (-1.0) and Trajectory (0) both sit close to neutral, and Regression (-0.86) is only a mild drag. This is a roster the model reads as genuinely middle-of-the-pack, not clearly trending either direction.",
        "The tight end room remains the least productive on the roster and unaddressed this offseason, and the team fired its offensive coordinator in favor of a new hire (Robinson) — a real scheme risk heading into a new system.",
        "McMillan is the top candidate for outside-receiver snaps, a real opportunity, but the model flags his own injury history (hamstring, neck) as a real risk to that opportunity — and the Mayfield contract situation adds its own layer of uncertainty over the whole offense.",
      ],
      fiveQuestions: [
        "Does the new offensive coordinator's system show real installation progress, or does the scheme change cost early-season cohesion?",
        "Does McMillan stay healthy enough to actually claim the outside-receiver role the model projects for him?",
        "Does the tight end room's unaddressed weakness ever become a real limiter?",
        "How does the Mayfield contract situation resolve, and does it affect his on-field focus or availability?",
        "Is a genuinely middle-of-the-pack roster (per Baseline/Trajectory both near zero) enough to compete in a real NFC South race?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (-1.0) and Trajectory (0) both sit close to neutral — the model reads this roster as genuinely middle-of-the-pack, not clearly trending down.",
          "McMillan is the top candidate for outside-receiver snaps, a real, already-rostered opportunity.",
        ],
        risks: [
          "The tight end room remains the least productive on the roster and unaddressed this offseason.",
          "The team fired its offensive coordinator in favor of a new hire, a real scheme-installation risk.",
          "McMillan's own injury history (hamstring, neck) is a real risk to the opportunity in front of him.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The new OC's scheme installs smoothly and shows early results.",
          "McMillan stays healthy and claims the outside-WR role cleanly.",
          "The tight end room finds unexpected production.",
        ],
        lowerIf: [
          "The scheme change costs real early-season cohesion.",
          "McMillan's injury history recurs, costing him the opportunity.",
          "The Mayfield contract situation becomes a real on-field distraction.",
        ],
      },
    },
    Falcons: {
      headline: "Falcons: A Fourth Team on This List With the Same 3.21-Point QB Cliff",
      oneLiner: "Atlanta's season depends on Michael Penix Jr.'s ACL recovery as directly as three other teams on this list depend on their own quarterback's health — and the model's downside case doesn't stop there.",
      execSummary: [
        "The Falcons went 8-9 in 2025, last in the NFC South, with a Power Score of -4.41. Both starting interior defensive linemen departed this offseason, replaced only by depth pieces, and Trajectory (-10) reflects that real downgrade along with a new head coach and offensive coordinator (the defensive coordinator was retained).",
        "The model's Key-Person Dependency data puts a real number on the central question: Atlanta's Power Score is -4.41 with a healthy Michael Penix Jr. and -7.63 if he's not — a 3.21-point swing, the same standard cliff size the model assigns any starting-caliber quarterback, matching what it assigns Kansas City's Mahomes, Pittsburgh's Rodgers, and Cincinnati's Burrow elsewhere on this list. Penix's ACL recovery is unresolved.",
        "The model's downside case doesn't stop at the QB question: Pearce Jr. faces felony charges with his 2026 availability in doubt, a real off-field risk layered directly on top of the on-field one. Dorlus' “lightbulb” breakout is flagged as real per scouts — a genuine bright spot, but a smaller one than the two risks sitting above it.",
      ],
      fiveQuestions: [
        "Does Michael Penix Jr.'s ACL recovery clear him for a full, healthy season?",
        "How does Pearce Jr.'s legal situation resolve, and what does that mean for his 2026 availability?",
        "Do the interior DL depth pieces hold up after losing both starters, or is the position group exposed?",
        "Does Dorlus' breakout translate into real, sustained production?",
        "Does a new HC/OC pairing (with the DC retained) find a coherent system fast enough to matter?",
      ],
      whyModelThinks: {
        optimism: [
          "Dorlus' breakout is flagged as real per scouts, a genuine, already-visible bright spot.",
          "The defensive coordinator was retained through the coaching change, preserving some continuity.",
        ],
        risks: [
          "Trajectory (-10.0) reflects real downgrade — both starting interior defensive linemen departed this offseason, replaced only by depth pieces.",
          "The Key-Person Dependency data is explicit: Power Score is -4.41 with a healthy Michael Penix Jr. and -7.63 if he's not — a 3.21-point cliff, the same size the model assigns three other quarterbacks on this list.",
          "Pearce Jr. faces felony charges with his 2026 availability in doubt — a real off-field risk layered directly on top of the on-field one.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "Penix returns fully healthy and avoids the 3.21-point cliff.",
          "Pearce Jr.'s legal situation resolves in his favor, or with minimal impact on availability.",
          "The interior DL depth pieces perform capably.",
        ],
        lowerIf: [
          "Penix's cliff materializes — the ACL recovery costs him real time or effectiveness.",
          "Pearce Jr.'s availability is significantly limited by his legal situation.",
          "The interior DL is exposed as a real, exploited weakness.",
        ],
      },
    },
    "49ers": {
      headline: "49ers: A 12-5 Record, Buried in a Loaded Division",
      oneLiner: "San Francisco won 12 games and still sits third in the NFC West — the model's real story here is a heavy Regression correction and an unresolved Aiyuk situation, not the division standing itself.",
      execSummary: [
        "The 49ers went 12-5 in 2025 but sit third in a stacked NFC West, behind the Rams (4.72) and Seahawks (3.68) — Power Score -1.12 doesn't match a 12-win team's usual station, a reminder that division rank and raw record don't always move together when the whole division is this strong.",
        "Baseline (+7.0) reflects that strong record, but Trajectory (-9) and Regression (-5.61) both pull hard against it — Regression especially is one of the larger single corrections on this list, meaning the model reads a real chunk of 2025's success as not fully supported by the underlying point differential.",
        "There's no reliable free safety left after the Hufanga-era departures, addressed partly by a new defensive coordinator (Raheem Morris). The Aiyuk saga remains unresolved, and the model flags a recent history of major injury attrition as a real, ongoing risk — not a one-time event.",
      ],
      fiveQuestions: [
        "How much of the -5.61 Regression correction actually shows up as fewer wins in 2026?",
        "Does the new DC find a real answer at free safety, or does the position stay a weak spot?",
        "How does the Aiyuk situation resolve, and what does that mean for the passing game?",
        "Does the recent pattern of major injury attrition continue, or does 2026 finally break it?",
        "Can San Francisco actually close the gap to the Rams and Seahawks in a loaded NFC West?",
      ],
      whyModelThinks: {
        optimism: [
          "Baseline (+7.0) reflects a 12-5 season, the strongest raw-record input in a stacked NFC West.",
          "A new defensive coordinator (Raheem Morris) is already in place addressing the secondary.",
        ],
        risks: [
          "Trajectory (-9.0) and Regression (-5.61) both pull hard against Baseline — Regression especially is one of the larger single corrections on this list.",
          "There's no reliable free safety left after the Hufanga-era departures.",
          "The Aiyuk situation remains unresolved, and the model flags a recent history of major injury attrition as an ongoing risk, not a one-time event.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "The 12-5-level performance holds up with minimal regression.",
          "The new DC finds a workable answer at free safety.",
          "The Aiyuk situation resolves in a way that strengthens the passing game.",
        ],
        lowerIf: [
          "The record visibly regresses toward the mean, matching the -5.61 correction.",
          "Free safety remains a real, exploited weakness.",
          "The injury-attrition pattern continues, costing key contributors real time.",
        ],
      },
    },
    Cardinals: {
      headline: "Cardinals: The Model's Second-Largest Luck Correction, Facing the League's Second-Hardest Schedule",
      oneLiner: "Arizona's 3-14 record understates the roster by the model's own math — but a brutal 2026 schedule stands between that correction and an actual improved record.",
      execSummary: [
        "The Cardinals went 3-14 in 2025, last in the NFC West, with a Power Score of -7.69. Baseline (-11.0) reflects that rough record directly, and Trajectory (-12) is deeply negative too — the model's own language calls this “the worst need-fill situation in the league,” with no reliable starting quarterback through the whole season.",
        "Regression (+7.32) works hard the other way, though — the third-largest positive luck correction of any team in the model, behind only the Chiefs and Giants. The model reads Arizona's underlying point differential as meaningfully better than 3-14 suggests.",
        "The tension is real: Arizona faces the second-hardest schedule of any team in the league (SOS rank 2) in 2026, meaning even a genuinely-better-than-3-14 roster has to prove it against a brutal slate. Walter Nolen III flashed real Pro-Bowl-caliber play in limited snaps, but his own major injury history makes him, in the model's words, a genuine boom-or-bust factor.",
      ],
      fiveQuestions: [
        "Does a real answer at quarterback finally emerge, addressing what the model calls the worst need-fill situation in the league?",
        "Does the +7.32 Regression correction show up as real, meaningful win-total improvement?",
        "Can Arizona's roster actually hold up against the league's second-hardest schedule?",
        "Does Walter Nolen III stay healthy enough to build on his limited-snap flashes?",
        "Do the new HC and OC find any real traction in Year 1, given the quarterback uncertainty underneath them?",
      ],
      whyModelThinks: {
        optimism: [
          "Regression sits at +7.32, the third-largest positive luck correction of any team in the model, behind only the Chiefs and Giants.",
          "Walter Nolen III flashed real Pro-Bowl-caliber play in limited snaps.",
        ],
        risks: [
          "Baseline (-11.0) and Trajectory (-12.0) are both deeply negative — the model's own language calls this the worst need-fill situation in the league, with no reliable starting quarterback.",
          "Arizona faces the second-hardest schedule of any team in the league (SOS rank 2).",
          "Nolen's own major injury history makes him, in the model's words, a genuine boom-or-bust factor.",
        ],
      },
      changeOurMind: {
        pessimisticIf: [
          "A workable answer at quarterback emerges, even a partial one.",
          "The Regression correction shows up as real, visible improvement in the record.",
          "Nolen stays healthy and builds meaningfully on his limited-snap flashes.",
        ],
        lowerIf: [
          "The quarterback situation remains the league's worst need-fill problem all season.",
          "The brutal schedule overwhelms any underlying roster improvement.",
          "Nolen's injury history recurs, costing a genuine bright spot.",
        ],
      },
    },
};

// ----------------------------------------------------------------------
// Small helpers (ported verbatim from cfb-model/app.jsx)
// ----------------------------------------------------------------------
function st(cssText) {
  const out = {};
  if (!cssText) return out;
  String(cssText).split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx < 0) return;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop || !val) return;
    const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = val;
  });
  return out;
}

function num(v, d = 1) {
  if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(d);
}

function signed(v, d = 1) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + n.toFixed(d);
}

// Largest-remainder rounding: rounds `parts` to `decimals` places so they sum
// EXACTLY to `total` rounded to the same precision, instead of each part and
// the total being rounded independently (which can silently drift by 0.1 —
// classic "sum of roundings != rounding of sum"). Each part is still rounded
// as close to its true value as the constraint allows.
function roundPartsToTotal(parts, total, decimals = 1) {
  const scale = 10 ** decimals;
  const targetTenths = Math.round(total * scale);
  const floors = parts.map((v) => Math.floor(v * scale));
  let remainder = targetTenths - floors.reduce((a, b) => a + b, 0);
  const fracs = parts.map((v, i) => v * scale - floors[i]);
  const result = [...floors];
  if (remainder > 0) {
    const order = fracs.map((_, i) => i).sort((a, b) => fracs[b] - fracs[a]);
    for (let i = 0; i < remainder; i++) result[order[i % order.length]] += 1;
  } else if (remainder < 0) {
    const order = fracs.map((_, i) => i).sort((a, b) => fracs[a] - fracs[b]);
    for (let i = 0; i < -remainder; i++) result[order[i % order.length]] -= 1;
  }
  return result.map((v) => v / scale);
}

function pct(v, d = 1) {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return (n * 100).toFixed(d) + '%';
}

function readableTextColor(hex) {
  const h = (hex || '#8C8F93').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0D10' : '#FFFFFF';
}

function confidenceColor(confidence) {
  if (!confidence) return 'var(--ink-faint)';
  if (confidence.startsWith('high')) return 'var(--value-positive)';
  if (confidence.startsWith('low')) return 'var(--value-risk)';
  return 'var(--ink-faint)';
}

// A couple of Key-Person Dependency entries (non-QB positions) have a
// known-bad "cliff" number - the pipeline's own data flags this with a raw
// dev note ("wrong-signed, see docstring") that isn't reader-facing copy.
// Translate to plain language here rather than showing the dev string, and
// suppress the nonsensical cliff number for those specific entries (methodology.html's
// "Known limits" section already explains why in reader-friendly terms).
function isUnreliableKeyPerson(confidence) {
  return typeof confidence === 'string' && confidence.includes('wrong-signed');
}

// ----------------------------------------------------------------------
// DataTable (ported verbatim from cfb-model/app.jsx / the design system)
// ----------------------------------------------------------------------
function DataTable({ columns, rows }) {
  const gridCols = `2fr ${columns.slice(1).map(() => '1fr').join(' ')}`;
  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, background: 'var(--surface-dark)' }}>
        {columns.map((col, i) => (
          <div key={col.key} style={{ padding: '14px 20px', color: 'var(--text-inverse)', fontWeight: 'var(--weight-bold)', fontSize: 12, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'right' }}>
            {col.label}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: gridCols, background: ri % 2 === 0 ? 'var(--surface-card)' : 'var(--surface-page)' }}>
          {columns.map((col, i) => (
            <div key={col.key} style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: 'var(--text-data)', textAlign: i === 0 ? 'left' : 'right', fontVariantNumeric: 'tabular-nums', fontWeight: i === 0 ? 'var(--weight-semibold)' : 'var(--weight-regular)' }}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// A signed, zero-centered bar meter (Power Score, spread, etc.)
function SignedBar({ value, scaleMax, width = 56 }) {
  const val = Number(value) || 0;
  const positive = val >= 0;
  const pctFill = Math.min(50, (Math.abs(val) / (scaleMax || 0.001)) * 50);
  const color = positive ? 'var(--value-positive)' : 'var(--value-risk)';
  return (
    <div style={{ width, height: 8, position: 'relative', background: 'var(--hairline)', borderRadius: 4, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: positive ? '50%' : (50 - pctFill) + '%', width: pctFill + '%', background: color, borderRadius: 4 }} />
    </div>
  );
}

// A 0-100% left-to-right fill bar (playoff probabilities)
function PctBar({ value, color, width = 70 }) {
  const p = Math.max(0, Math.min(100, (Number(value) || 0) * 100));
  return (
    <div style={{ width, height: 8, position: 'relative', background: 'var(--hairline)', borderRadius: 4, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: p + '%', background: color, borderRadius: 4 }} />
    </div>
  );
}

// One quadrant of the Model SWOT grid (Strengths/Weaknesses/Opportunities/Threats)
function SWOTQuadrant({ label, sub, items, tone }) {
  const color = tone === 'positive' ? 'var(--value-positive)' : 'var(--value-risk)';
  return (
    <div style={st(`background:var(--surface-card);border-left:3px solid ${color};border-radius:0 var(--radius-md) var(--radius-md) 0;box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:6px`)}>
      <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${color}`)}>{label}</div>
      <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:-4px')}>{sub}</div>
      <ul style={st('margin:4px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px')}>
        {items.map((t, i) => (
          <li key={i} style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink)')}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

// Talent Map field layout (TEAM_PROFILE_DESIGN_SYSTEM.md §4 + Design Guide
// Starting Point.pdf's "Field play map" + "Player Badges" components) —
// percentage coordinates (0-100) within the field diagram, offense in the
// lower half facing up, defense mirrored in the upper half. Positions not
// in a given team's scheme (e.g. NT for a 4-3 team) simply never look
// themselves up here since the data only contains what that team fields.
const POSITION_COORDS = {
  // Offense
  QB: { x: 50, y: 78 }, RB: { x: 50, y: 90 }, FB: { x: 36, y: 85 },
  LT: { x: 26, y: 64 }, LG: { x: 39, y: 64 }, C: { x: 50, y: 64 }, RG: { x: 61, y: 64 }, RT: { x: 74, y: 64 },
  TE: { x: 85, y: 66 },
  // Defense — 4-3 front
  LDE: { x: 30, y: 38 }, LDT: { x: 42, y: 40 }, RDT: { x: 58, y: 40 }, RDE: { x: 70, y: 38 },
  WLB: { x: 35, y: 27 }, MLB: { x: 50, y: 25 }, SLB: { x: 65, y: 27 },
  // Defense — 3-4 front (replaces the four D-line / three LB slots above)
  NT: { x: 50, y: 40 }, LILB: { x: 42, y: 24 }, RILB: { x: 58, y: 24 },
  // Defense — shared across both fronts
  LCB: { x: 7, y: 20 }, RCB: { x: 93, y: 20 }, NB: { x: 21, y: 15 }, FS: { x: 40, y: 9 }, SS: { x: 60, y: 9 },
};
// The three WR slots share the "WR" abbreviation with different pos_slot
// numbers that aren't consistent team-to-team, so they're placed by sorted
// order (outside-left, outside-right, slot) rather than a fixed lookup.
const WR_COORDS = [{ x: 5, y: 70 }, { x: 95, y: 70 }, { x: 18, y: 74 }];

function TalentMapField({ players, scheme }) {
  const wrs = players.filter((p) => p.pos_abb === 'WR').sort((a, b) => Number(a.pos_slot) - Number(b.pos_slot));
  const others = players.filter((p) => p.pos_abb !== 'WR' && POSITION_COORDS[p.pos_abb]);
  const badges = [
    ...wrs.map((p, i) => ({ ...p, coord: WR_COORDS[i] || WR_COORDS[WR_COORDS.length - 1] })),
    ...others.map((p) => ({ ...p, coord: POSITION_COORDS[p.pos_abb] })),
  ].filter((b) => b.coord);

  const W = 600, H = 440;
  const yardLines = [10, 25, 40, 55, 70, 85];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: 'color-mix(in srgb, var(--green) 10%, var(--surface-page))', borderRadius: 8 }}>
      {yardLines.map((pct) => (
        <line key={pct} x1={0} y1={(pct / 100) * H} x2={W} y2={(pct / 100) * H} stroke="var(--hairline)" strokeWidth="1" />
      ))}
      <line x1={0} y1={H * 0.53} x2={W} y2={H * 0.53} stroke="var(--brass)" strokeWidth="1.5" strokeDasharray="5 4" />
      {badges.map((b, i) => {
        const cx = (b.coord.x / 100) * W;
        const cy = (b.coord.y / 100) * H;
        const nameParts = (b.player_name || '').split(' ').filter((p) => !/^(Jr\.?|Sr\.?|I{2,3}|IV|V)$/i.test(p));
        const lastName = nameParts.slice(-1)[0] || '';
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="17" fill="var(--surface-card)" stroke="var(--brass)" strokeWidth="2" />
            <text x={cx} y={cy + 4} textAnchor="middle" style={{ font: '700 10px var(--font-sans)', fill: 'var(--ink)' }}>{b.pos_abb}</text>
            <text x={cx} y={cy + 29} textAnchor="middle" style={{ font: '600 10px var(--font-sans)', fill: 'var(--ink-muted)' }}>{lastName}</text>
          </g>
        );
      })}
      <text x={W - 8} y={16} textAnchor="end" style={{ font: '700 10px var(--font-sans)', letterSpacing: '.05em', fill: 'var(--ink-faint)' }}>{scheme ? `${scheme} DEFENSE` : ''}</text>
      <text x={8} y={H - 8} style={{ font: '700 10px var(--font-sans)', letterSpacing: '.05em', fill: 'var(--ink-faint)' }}>OFFENSE</text>
    </svg>
  );
}

// ----------------------------------------------------------------------
// App
// ----------------------------------------------------------------------
const TABS = [
  { id: 'rankings', label: 'Power Rankings', tone: 'var(--ink)', textOn: 'var(--paper)' },
  { id: 'matchup', label: 'Schedule & Matchups', tone: 'var(--accent-primary)', textOn: 'var(--paper)' },
  { id: 'team', label: 'Team Detail', tone: 'var(--brass)', textOn: 'var(--ink)' },
  { id: 'trend', label: 'Season Trend', tone: 'var(--green-light)', textOn: 'var(--ink)' },
  { id: 'playoff', label: 'Playoff Picture', tone: 'var(--value-positive)', textOn: 'var(--paper)' },
];

function App() {
  const [s, setStateRaw] = useState({
    tab: 'rankings',
    power: [],
    winProjections: [],
    monteCarlo: [],
    monteCarloHistogram: [],
    playoff: [],
    keyPerson: [],
    preseasonPower: [],
    coaching: {},
    talentMap: {},
    talentMapSnapshot: null,
    matchupByWeek: {},
    teamSchedule: {},
    availableWeeks: [],
    historyRows: [],
    generatedAt: null,
    loaded: false,
    pipelineError: null,

    sortKey: 'power_score',
    sortDir: 'desc',
    glossaryOpen: false,
    validationOpen: false,

    matchupWeek: null,
    weekInput: '',
    expandedMatchup: null,

    selectedTeam: null,
    pinnedTeam: null,

    playoffSortKey: 'super_bowl_pct',
    playoffSortDir: 'desc',
  });
  function setState(update) {
    setStateRaw((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  }

  // Static-site version: data is a pre-generated snapshot (assets/data/nfl-data.json),
  // built locally by the pipeline and redeployed — no live server on this site.
  async function loadData() {
    try {
      const res = await fetch('../assets/data/nfl-data.json');
      const data = await res.json();
      const weeks = data.available_weeks || [];
      setState({
        power: data.power || [],
        winProjections: data.win_projections || [],
        monteCarlo: data.monte_carlo || [],
        monteCarloHistogram: data.monte_carlo_histogram || [],
        playoff: data.playoff || [],
        keyPerson: data.key_person || [],
        preseasonPower: data.preseason_power || [],
        coaching: data.coaching || {},
        talentMap: data.talent_map || {},
        talentMapSnapshot: data.talent_map_snapshot || null,
        matchupByWeek: data.matchup_by_week || {},
        teamSchedule: data.team_schedule || {},
        availableWeeks: weeks,
        historyRows: data.history || [],
        matchupWeek: weeks.length ? weeks[0] : null,
        weekInput: weeks.length ? String(weeks[0]) : '',
        generatedAt: data.generated_at || null,
        loaded: true,
      });
    } catch (e) {
      setState({ loaded: true, pipelineError: `Couldn't load data: ${e.message || e}` });
    }
  }
  useEffect(() => { loadData(); }, []);

  const { power, winProjections, monteCarlo, monteCarloHistogram, playoff, keyPerson, preseasonPower, coaching, talentMap, talentMapSnapshot, matchupByWeek, teamSchedule, historyRows, tab, glossaryOpen, validationOpen, pinnedTeam } = s;

  const pinnedAccentColor = pinnedTeam ? teamColor(pinnedTeam) : 'var(--brass)';
  const togglePin = (team) => setState((prev) => {
    const willPin = prev.pinnedTeam !== team;
    return { pinnedTeam: willPin ? team : null, selectedTeam: willPin ? team : prev.selectedTeam };
  });
  const toggleGlossary = () => setState((prev) => ({ glossaryOpen: !prev.glossaryOpen, validationOpen: false }));
  const toggleValidation = () => setState((prev) => ({ validationOpen: !prev.validationOpen, glossaryOpen: false }));
  const pillButtonStyle = (active) => `display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;border:1px solid var(--hairline);background:${active ? 'var(--ink)' : 'var(--surface-card)'};color:${active ? 'var(--paper)' : 'var(--ink-muted)'};font:700 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;cursor:pointer`;

  const tabsList = TABS.map((t) => {
    const active = tab === t.id;
    return {
      id: t.id, label: t.label,
      style: `padding:14px 18px;background:${active ? t.tone : 'none'};border:none;border-radius:8px 8px 0 0;font:700 13px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;color:${active ? t.textOn : 'var(--ink-muted)'};border-bottom:3px solid ${active ? 'var(--paper)' : 'transparent'};margin-bottom:-1px;transition:background .15s`,
      onClick: () => setState({ tab: t.id }),
    };
  });

  const glossaryPanel = glossaryOpen && (
    <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:16px')}>
      {GLOSSARY_TERMS.map((gl) => (
        <div key={gl.term}>
          <div style={st('font:700 16px var(--font-sans);color:var(--ink);margin-bottom:4px')}>{gl.term}</div>
          <div style={st('font:400 15px/1.5 var(--font-sans);color:var(--ink-muted)')}>{gl.def}</div>
        </div>
      ))}
    </div>
  );

  const validationPanel = validationOpen && (
    <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px')}>
      {VALIDATION_STATS.map((v) => (
        <div key={v.headline}>
          <div style={st('font:700 16px var(--font-sans);color:var(--ink);margin-bottom:4px')}>{v.headline}</div>
          <div style={st('font:400 15px/1.5 var(--font-sans);color:var(--ink-muted)')}>{v.gloss}</div>
          {v.link && (
            <a href={v.link.href} style={st('display:inline-block;margin-top:6px;font:700 14px var(--font-sans);color:var(--accent-primary)')}>{v.link.label}</a>
          )}
        </div>
      ))}
    </div>
  );
  const explainerButtons = (
    <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
      <button style={st(pillButtonStyle(glossaryOpen))} onClick={toggleGlossary}>What do these mean? {glossaryOpen ? '▲' : '▼'}</button>
      <button style={st(pillButtonStyle(validationOpen))} onClick={toggleValidation}>How well does this model actually work? {validationOpen ? '▲' : '▼'}</button>
    </div>
  );

  // ---------------- Rankings tab ----------------
  const globalScaleMax = Math.max(0.001, ...power.map((r) => Math.abs(Number(r.power_score) || 0)));
  const rankSorted = [...power].sort((a, b) => (Number(b.power_score) || 0) - (Number(a.power_score) || 0));
  const rankRows = rankSorted.map((r, i) => ({ ...r, rank: i + 1, isPinned: r.team === pinnedTeam }));
  const pinnedIdx = pinnedTeam ? rankRows.findIndex((r) => r.team === pinnedTeam) : -1;
  const pinnedRow = pinnedIdx !== -1 ? rankRows[pinnedIdx] : null;

  const SORT_FIELDS = [
    { key: 'power_score', label: 'Power Score' },
    { key: 'team', label: 'Team' },
    { key: 'wins', label: 'Prior Wins' },
    { key: 'div_rank', label: 'Div. Rank' },
  ];
  const sortPills = SORT_FIELDS.map((f) => ({
    key: f.key, label: f.label,
    arrow: s.sortKey === f.key ? (s.sortDir === 'asc' ? '▲' : '▼') : '',
    style: `padding:6px 14px;border-radius:999px;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid ${s.sortKey === f.key ? 'var(--ink)' : 'var(--hairline)'};background:${s.sortKey === f.key ? 'var(--ink)' : 'transparent'};color:${s.sortKey === f.key ? 'var(--paper)' : 'var(--ink-muted)'}`,
    onClick: () => {
      if (s.sortKey === f.key) setState({ sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' });
      else setState({ sortKey: f.key, sortDir: f.key === 'div_rank' ? 'asc' : 'desc' });
    },
  }));
  const rankTableSorted = [...rankRows].sort((a, b) => {
    const av = a[s.sortKey], bv = b[s.sortKey];
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return s.sortDir === 'asc' ? cmp : -cmp;
  });
  const rankTableProps = {
    columns: [
      {
        key: 'team', label: 'Team', render: (r) => (
          <span title={(preseasonByTeam[r.team] && preseasonByTeam[r.team].rationale) || ''} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {r.isPinned && <span style={{ width: 7, height: 7, borderRadius: 999, background: pinnedAccentColor, flexShrink: 0, display: 'inline-block' }} />}
            {`${r.rank}. ${r.team}`}
          </span>
        ),
      },
      {
        key: 'power_score', label: 'Power Score', render: (r) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <SignedBar value={r.power_score} scaleMax={globalScaleMax} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{num(r.power_score, 2)}</span>
          </div>
        ),
      },
      { key: 'baseline', label: 'Baseline', render: (r) => num(r.baseline, 1) },
      { key: 'trajectory', label: 'Trajectory', render: (r) => num(r.trajectory, 1) },
      { key: 'regression', label: 'Regression', render: (r) => num(r.regression, 1) },
      { key: 'div_rank', label: 'Division', render: (r) => `${r.division} #${r.div_rank}` },
      { key: 'record', label: 'Record', render: (r) => r.record || '—' },
      {
        key: 'pin', label: 'Pin', render: (r) => (
          <button
            onClick={() => togglePin(r.team)}
            title={r.isPinned ? `Unpin ${r.team}` : `Pin ${r.team}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: r.isPinned ? pinnedAccentColor : 'var(--ink-faint)' }}>
              <path d="M12 2.5l2.99 6.06 6.69.97-4.84 4.72 1.14 6.66L12 17.77l-5.98 3.14 1.14-6.66-4.84-4.72 6.69-.97z" fill={r.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        ),
      },
    ],
    rows: rankTableSorted,
  };

  // ---------------- Schedule & Matchups tab ----------------
  const weekGames = (matchupByWeek[String(s.matchupWeek)] || []);
  const gamesWithFlags = weekGames.map((g, i) => ({ ...g, _isPinnedGame: g.home_team === pinnedTeam || g.away_team === pinnedTeam, _origIdx: i }));
  const gamesSorted = [...gamesWithFlags].sort((a, b) => {
    if (a._isPinnedGame !== b._isPinnedGame) return a._isPinnedGame ? -1 : 1;
    return Math.abs(b.spread || 0) - Math.abs(a.spread || 0);
  });
  function selectWeek(weekStr) {
    setState({ weekInput: weekStr, matchupWeek: parseInt(weekStr, 10) });
  }
  const matchupList = gamesSorted.map((g) => {
    const key = `${g.home_team}-${g.away_team}-${g._origIdx}`;
    const homeColor = teamColor(g.home_team), awayColor = teamColor(g.away_team);
    const homeWinPct = g.win_prob != null ? g.win_prob * 100 : 50;
    const expanded = s.expandedMatchup === key;

    // "Why this spread" breakdown: Power Score = 0.45*Baseline + 0.35*Trajectory + 0.20*Regression,
    // and spread = (home_power - away_power) + hfa_adj (POWER_TO_POINTS_SLOPE is 1.0 in the live
    // model, so no separate scale factor). Applying the same three weights to each side's raw
    // Baseline/Trajectory/Regression difference decomposes the spread into where it actually comes
    // from, the four terms sum back to the displayed spread almost exactly (small rounding only).
    const homeRow = power.find((r) => r.team === g.home_team);
    const awayRow = power.find((r) => r.team === g.away_team);
    let contributionBars = [];
    if (homeRow && awayRow) {
      const rawBars = [
        { label: 'Baseline (prior record)', value: 0.45 * ((Number(homeRow.baseline) || 0) - (Number(awayRow.baseline) || 0)) },
        { label: 'Trajectory (roster/coaching/stability)', value: 0.35 * ((Number(homeRow.trajectory) || 0) - (Number(awayRow.trajectory) || 0)) },
        { label: 'Regression (luck adjustment)', value: 0.20 * ((Number(homeRow.regression) || 0) - (Number(awayRow.regression) || 0)) },
        { label: 'Home field', value: Number(g.hfa_adj) || 0 },
      ];
      // Bars are individually rounded to 1 decimal for display, but constrained
      // (via largest-remainder rounding) to sum exactly to the displayed spread —
      // see roundPartsToTotal() above. Fixes a display bug where 4 independently
      // rounded bars could drift 0.1 from the independently rounded spread.
      const displayVals = roundPartsToTotal(rawBars.map((b) => b.value), Number(g.spread) || 0, 1);
      contributionBars = rawBars.map((b, i) => ({ ...b, display: displayVals[i] }));
    }
    const contributionScale = Math.max(1, ...contributionBars.map((b) => Math.abs(b.value)));

    // FINAL badge (in-season-updates plan, Phase E): `played`/scores are
    // present on matchup rows once the pipeline has been re-run with real
    // results (Phase D); absent (undefined) on any snapshot generated
    // before that, so this degrades gracefully to the predicted-spread-only
    // display that's always been here.
    const isFinal = !!g.played;
    const finalScoreLabel = isFinal ? `${g.away_team} ${g.away_score}, ${g.home_team} ${g.home_score}` : null;
    const finalWinnerNote = isFinal
      ? (g.winner ? `${g.winner} won` : 'Final — tie')
      : null;

    return {
      key, ...g,
      cardStyle: `border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card);border:${g._isPinnedGame ? `2px solid ${pinnedAccentColor}` : '1px solid var(--hairline)'}`,
      homeColor, awayColor, homeWinPct, expanded,
      onToggle: () => setState({ expandedMatchup: expanded ? null : key }),
      contributionBars, contributionScale,
      isFinal, finalScoreLabel, finalWinnerNote,
      // Sportsbook convention: the favorite gets the minus, the underdog
      // gets the plus. g.spread is the home team's predicted margin (positive
      // = home favored), which is the OPPOSITE sign relationship - negate it
      // for display so "Bills +8.1" doesn't read as "Bills are 8.1-pt dogs"
      // when the model actually favors them by 8.1.
      spreadLabel: g.spread != null ? `${g.home_team} ${signed(-g.spread, 1)}` : '—',
      hfaNote: g.neutral_site ? 'Neutral site — no home field adjustment' : `Home field adjustment: ${signed(g.hfa_adj, 1)} pts`,
    };
  });

  // ---------------- Team Detail tab ----------------
  // Rationale lookup: the 2026-07-25 in-season-updates migration moved the
  // hand-written rationale paragraph into preseason_power (power rows no
  // longer carry it) - build a by-team lookup once so both the Power
  // Rankings tooltip and the Team Detail fallback can pull from it.
  const preseasonByTeam = {};
  preseasonPower.forEach((r) => { preseasonByTeam[r.team] = r; });
  const teams = [...new Set(power.map((r) => r.team))].sort();
  const activeTeam = teams.includes(s.selectedTeam) ? s.selectedTeam : (teams[0] || pinnedTeam);
  const activeRow = power.find((r) => r.team === activeTeam);
  const activeProj = winProjections.find((r) => r.team === activeTeam);
  const activeMC = monteCarlo.find((r) => r.team === activeTeam);
  const activePlayoff = playoff.find((r) => r.team === activeTeam);
  const activeKeyPerson = keyPerson.filter((r) => r.team === activeTeam);
  const activeCoaching = coaching[activeTeam];
  const activeTalent = talentMap[activeTeam];
  const profile = TEAM_PROFILES[activeTeam];
  // Fallback rationale source (Problem 1 fix) - only teams without a
  // TEAM_PROFILES entry fall back to this; teams with a profile show the
  // richer exec-summary prose instead (see kpiTilesJSX/fallbackRationale below).
  const activePreseasonRow = preseasonByTeam[activeTeam];
  const snapshotBg = teamColor(activeTeam);
  const snapshotTextColor = readableTextColor(snapshotBg);

  // Upcoming schedule: today's real date vs. each game's real calendar date
  // (pulled from nflverse's games.csv by refresh_nfl_data.py), so this list
  // auto-advances week to week during the season with no manual updates.
  // Falls back to showing the full season if dates are missing (offseason,
  // or a handful of late-season games not yet date-locked by the league).
  const todayISO = new Date().toISOString().slice(0, 10);
  const fullSchedule = teamSchedule[activeTeam] || [];
  const upcomingSchedule = fullSchedule.filter((g) => g.bye || !g.date || g.date >= todayISO);
  const scheduleToShow = upcomingSchedule.length ? upcomingSchedule : fullSchedule;

  // Schedule Journey (TEAM_PROFILE_DESIGN_SYSTEM.md section 7): "a timeline,
  // not an opponent list" - each game already carries this team's own
  // win_prob (computed by the matchup pipeline, same source as the
  // Schedule & Matchups tab), so difficulty-coding is a read of data that
  // already exists, not a new calculation. Division opponents are flagged
  // as rivalry games (same real division data used for div_rank elsewhere);
  // "swing games" are the ones nearest a true coin flip, since those are
  // the games most likely to actually decide the season either way.
  const teamDivision = Object.fromEntries(power.map((r) => [r.team, r.division]));
  const journeyRows = scheduleToShow.map((g) => {
    if (g.bye || g.win_prob === undefined || g.win_prob === null) return { ...g, difficulty: 'bye' };
    const wp = Number(g.win_prob);
    const difficulty = wp >= 0.6 ? 'favorable' : wp <= 0.4 ? 'difficult' : 'competitive';
    const isSwing = Math.abs(wp - 0.5) <= 0.05;
    const isDivision = teamDivision[g.opponent] && teamDivision[g.opponent] === teamDivision[activeTeam];
    return { ...g, difficulty, isSwing, isDivision };
  });
  const difficultyMeta = {
    favorable: { label: 'Favorable', color: 'var(--value-positive)' },
    competitive: { label: 'Competitive', color: 'var(--brass)' },
    difficult: { label: 'Difficult', color: 'var(--value-risk)' },
    bye: { label: '', color: 'var(--ink-faint)' },
  };
  const playedGames = journeyRows.filter((g) => g.difficulty !== 'bye');
  const toughestGame = playedGames.length
    ? playedGames.reduce((worst, g) => (g.win_prob < worst.win_prob ? g : worst), playedGames[0])
    : null;
  const swingGames = playedGames.filter((g) => g.isSwing);
  const journeySummary = playedGames.length ? (
    swingGames.length > 0
      ? `${swingGames.length} swing game${swingGames.length === 1 ? '' : 's'} left (within 5 points of a coin flip) — the toughest single test is Week ${toughestGame.week}, ${toughestGame.home ? 'vs' : '@'} ${toughestGame.opponent} (${pct(toughestGame.win_prob, 0)} win probability).`
      : `No true coin-flip games left on the board — the toughest single test is Week ${toughestGame.week}, ${toughestGame.home ? 'vs' : '@'} ${toughestGame.opponent} (${pct(toughestGame.win_prob, 0)} win probability).`
  ) : '';

  // Strength of schedule: win_projections' sos_avg_opp_power ranked against
  // the other 31 teams (rank 1 = hardest schedule) so the raw Power Score
  // scale doesn't have to be interpreted on its own.
  const sosRanked = [...winProjections].sort((a, b) => (b.sos_avg_opp_power || 0) - (a.sos_avg_opp_power || 0));
  const sosRank = activeProj ? sosRanked.findIndex((r) => r.team === activeTeam) + 1 : null;

  const componentBars = activeRow ? [
    { label: 'Baseline', value: Number(activeRow.baseline) || 0 },
    { label: 'Trajectory', value: Number(activeRow.trajectory) || 0 },
    { label: 'Regression', value: Number(activeRow.regression) || 0 },
  ] : [];
  const componentScale = Math.max(1, ...componentBars.map((b) => Math.abs(b.value)));

  // Cone of Certainty: analytical (win_projections) vs simulated (monte_carlo)
  const coneRows = [];
  if (activeProj) coneRows.push({ label: 'Analytical', mean: activeProj.expected_wins, low: activeProj.ci90_low, high: activeProj.ci90_high, color: 'var(--accent-primary)' });
  if (activeMC) coneRows.push({ label: 'Simulated', mean: activeMC.sim_mean, low: activeMC.sim_ci90_low, high: activeMC.sim_ci90_high, color: 'var(--brass)' });
  const coneMin = coneRows.length ? Math.max(0, Math.min(...coneRows.map((r) => r.low)) - 0.5) : 0;
  const coneMax = coneRows.length ? Math.min(17, Math.max(...coneRows.map((r) => r.high)) + 0.5) : 17;
  const coneChartW = 460, coneRowH = 56, coneLabelW = 90, conePadR = 30;
  const coneX = (v) => coneLabelW + ((v - coneMin) / ((coneMax - coneMin) || 1)) * (coneChartW - coneLabelW - conePadR);

  // Win-total distribution: the actual shape of the 20,000-season Monte
  // Carlo simulation, not just its mean/SD/CI90 summary (those three
  // numbers are already in the Cone of Certainty above). One bar per
  // possible win total (0-17), height = fraction of simulated seasons
  // that landed there.
  const activeMCHist = monteCarloHistogram.find((r) => r.team === activeTeam);
  const histBars = [];
  if (activeMCHist) {
    for (let w = 0; w <= 17; w++) {
      const v = Number(activeMCHist[`wins_${w}`]);
      if (!Number.isNaN(v)) histBars.push({ wins: w, prob: v });
    }
  }
  const histMax = Math.max(0.01, ...histBars.map((b) => b.prob));
  const histChartW = 460, histChartH = 160, histBarGap = 3;
  const histBarW = histBars.length ? (histChartW - histBarGap * (histBars.length - 1)) / histBars.length : 0;
  const histY = (p) => histChartH - (p / histMax) * (histChartH - 20);

  // Team DNA (shared component, team-dna.js; wired up per NFL-Team-Profile-Narrative-Brief.md
  // section 3a) - identity, not grades: "what kind of team is this," not "how good are
  // they." baseline/trajectory/regression reuse the exact fields Score Breakdown already
  // shows (see componentBars above); need_fill/scheme/stability only exist in
  // preseason_power (same schema split the rationale fix above deals with), so those
  // three dimensions gracefully drop out (percentileRank returns null, TeamDNA filters
  // it) for any team missing a preseason_power row. Only rendered inside the narrative
  // block below, so this doesn't touch the 31 teams without a TEAM_PROFILES entry yet.
  const teamDNADimensions = activeRow ? [
    { label: 'Record Strength', pct: percentileRank(power.map((r) => Number(r.baseline)), Number(activeRow.baseline)) },
    { label: 'Roster/Coaching Trajectory', pct: percentileRank(power.map((r) => Number(r.trajectory)), Number(activeRow.trajectory)) },
    { label: 'Recent Form', pct: percentileRank(power.map((r) => Number(r.regression)), Number(activeRow.regression)) },
    { label: 'Schedule Difficulty', pct: activeProj ? percentileRank(winProjections.map((r) => Number(r.sos_avg_opp_power)), Number(activeProj.sos_avg_opp_power)) : null },
    { label: 'Roster Needs Addressed', pct: activePreseasonRow ? percentileRank(preseasonPower.map((r) => Number(r.need_fill)), Number(activePreseasonRow.need_fill)) : null },
    { label: 'Scheme Fit', pct: activePreseasonRow ? percentileRank(preseasonPower.map((r) => Number(r.scheme)), Number(activePreseasonRow.scheme)) : null },
    { label: 'Organizational Stability', pct: activePreseasonRow ? percentileRank(preseasonPower.map((r) => Number(r.stability)), Number(activePreseasonRow.stability)) : null },
  ] : [];

  // Plain-language Monte Carlo callout (brief section 3c) - computed per-team from
  // monteCarloHistogram (histBars above), not hardcoded to any one team's numbers.
  // Mode = most likely single-win-total outcome; atLeastNinePct = cumulative chance
  // of a winning-or-better season (9+ of 17 games).
  let monteCarloCallout = null;
  if (histBars.length > 0) {
    const modeBar = histBars.reduce((best, b) => (b.prob > best.prob ? b : best), histBars[0]);
    const atLeastNinePct = histBars.filter((b) => b.wins >= 9).reduce((sum, b) => sum + b.prob, 0);
    monteCarloCallout = {
      modeWins: modeBar.wins,
      modeProb: modeBar.prob,
      atLeastNinePct,
      rangeLow: activeMC ? Math.round(activeMC.sim_ci90_low) : null,
      rangeHigh: activeMC ? Math.round(activeMC.sim_ci90_high) : null,
    };
  }

  // KPI tiles (Power Score / Division / Record / SOS) - a single reusable block so
  // it can sit inside the Hero Summary for teams with a narrative profile (brief
  // Problem 2), or in its original standalone position for teams without one yet.
  const kpiTilesInner = activeRow ? (
    <div style={st('display:flex;gap:24px;flex-wrap:wrap')}>
      <div style={{ minWidth: 150 }}>
        <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${snapshotTextColor};opacity:.7;margin-bottom:8px`)}>Power Score</div>
        <div style={st(`font:900 32px var(--font-sans);color:${snapshotTextColor}`)}>{num(activeRow.power_score, 2)}</div>
        <div style={st(`font:400 13px var(--font-sans);color:${snapshotTextColor};opacity:.65;margin-top:2px`)}>Range: {num(activeRow.low_bound, 1)} to {num(activeRow.high_bound, 1)}</div>
      </div>
      <div style={{ minWidth: 150 }}>
        <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${snapshotTextColor};opacity:.7;margin-bottom:8px`)}>Division</div>
        <div style={st(`font:900 32px var(--font-sans);color:${snapshotTextColor}`)}>#{activeRow.div_rank}</div>
        <div style={st(`font:400 13px var(--font-sans);color:${snapshotTextColor};opacity:.65;margin-top:2px`)}>{activeRow.division}</div>
      </div>
      <div style={{ minWidth: 150 }}>
        <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${snapshotTextColor};opacity:.7;margin-bottom:8px`)}>Record</div>
        <div style={st(`font:900 32px var(--font-sans);color:${snapshotTextColor}`)}>{activeRow.record || '—'}</div>
        <div style={st(`font:400 13px var(--font-sans);color:${snapshotTextColor};opacity:.65;margin-top:2px`)}>PF {activeRow.pf} / PA {activeRow.pa}</div>
      </div>
      {sosRank && (
        <div style={{ minWidth: 150 }}>
          <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${snapshotTextColor};opacity:.7;margin-bottom:8px`)}>Strength of Schedule</div>
          <div style={st(`font:900 32px var(--font-sans);color:${snapshotTextColor}`)}>#{sosRank}</div>
          <div style={st(`font:400 13px var(--font-sans);color:${snapshotTextColor};opacity:.65;margin-top:2px`)}>Avg. opponent Power Score {num(activeProj.sos_avg_opp_power, 2)} · #1 = hardest schedule</div>
        </div>
      )}
    </div>
  ) : null;
  const kpiTilesJSX = activeRow ? (
    <div style={st(`background:${snapshotBg};border-radius:var(--radius-md);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px`)}>
      {kpiTilesInner}
    </div>
  ) : null;
  // Fallback rationale (Problem 1 fix, option (b)): only shown for teams without a
  // TEAM_PROFILES entry, sourced from preseason_power now that `power` no longer
  // carries it. Teams with a profile skip this - the exec summary supersedes it.
  const fallbackRationale = activePreseasonRow ? activePreseasonRow.rationale : '';

  // Key-Person Dependency card, extracted so it can be moved up next to Five
  // Questions for teams with a narrative profile (brief section 3b) while staying
  // a single implementation - already has its own graceful empty-state fallback,
  // so it's safe to render unconditionally either place.
  const keyPersonCardJSX = (
    <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:16px')}>
      <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Key-Person Dependency</div>
      {activeKeyPerson.length > 0 ? activeKeyPerson.map((k) => {
        const unreliable = isUnreliableKeyPerson(k.confidence);
        return (
        <div key={k.player} style={st('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 0;border-top:1px solid var(--hairline)')}>
          <div>
            <div style={st('font:700 15px var(--font-sans);color:var(--ink)')}>{k.player} <span style={st('font-weight:400;color:var(--ink-muted)')}>({k.position})</span></div>
            <div style={st(`font:600 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:${confidenceColor(k.confidence)}`)}>
              {unreliable ? (
                <>low — unreliable for this position (see <a href="methodology.html#known-limits" style={st('color:inherit;text-decoration:underline')}>Known Limits</a>)</>
              ) : k.confidence}
            </div>
          </div>
          <div style={st('display:flex;gap:24px;font:600 14px var(--font-sans);color:var(--ink)')}>
            <span>If healthy: <b>{num(k.power_score_if_healthy, 2)}</b></span>
            <span>If down: <b>{num(k.power_score_if_down, 2)}</b></span>
            {unreliable ? (
              <span style={st('color:var(--ink-faint)')}>Cliff: <b>not reliable for this position</b></span>
            ) : (
              <span style={st('color:var(--value-risk)')}>Cliff: <b>{signed(k.cliff, 2)}</b></span>
            )}
          </div>
        </div>
        );
      }) : (
        <div style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink-faint)')}>No single flagged player currently drives this team's projection — Key-Person Dependency is only computed for teams with a high-Downside player identified in the model's risk scoring.</div>
      )}
    </div>
  );

  // ---------------- Season Trend tab (in-season-updates plan, Phase E) ----------------
  // Ported from the CFB dashboard's own trend tab (seriesFor/buildGeom/scaleY
  // pattern), adapted to this model's history columns - Power Score is the
  // one series charted (CFB's offense/defense sub-charts don't have an NFL
  // equivalent; wins_to_date/games_played surface in the table below instead).
  const trendSeriesFor = (teamName) => (historyRows || [])
    .filter((r) => r.team === teamName)
    .sort((a, b) => (Number(a.week) || 0) - (Number(b.week) || 0) || new Date(a.date_pulled) - new Date(b.date_pulled))
    .map((r) => ({
      week: Number(r.week) || 0, power_score: Number(r.power_score), date: r.date_pulled,
      games_played: Number(r.games_played) || 0, wins_to_date: Number(r.wins_to_date) || 0,
      baseline_blended: Number(r.baseline_blended), regression_blended: Number(r.regression_blended),
      trajectory: Number(r.trajectory),
    }));

  const trendSeries = trendSeriesFor(activeTeam);
  const trendRatings = trendSeries.map((p) => p.power_score).filter((v) => !Number.isNaN(v));
  const trendMin = trendRatings.length ? Math.min(...trendRatings, 0) : -0.1;
  const trendMax = trendRatings.length ? Math.max(...trendRatings, 0) : 0.1;
  const trendRange = (trendMax - trendMin) || 0.001;
  const trendChartW = 620, trendChartH = 300, trendPadL = 54, trendPadR = 16, trendPadT = 16, trendPadB = 34;
  const trendInnerH = trendChartH - trendPadT - trendPadB;
  const trendScaleY = (v) => trendPadT + ((trendMax - v) / trendRange) * trendInnerH;
  const trendTickCount = 4;
  const trendYTicks = [];
  for (let i = 0; i < trendTickCount; i++) {
    const v = trendMax - (i * trendRange) / (trendTickCount - 1);
    const y = trendScaleY(v);
    trendYTicks.push({ y, label: num(v, 2), style: `position:absolute;left:0;top:${y}px;transform:translateY(-50%);width:${trendPadL - 10}px;text-align:right;font:11px var(--font-sans);color:var(--ink-muted)` });
  }
  const trendGeom = (() => {
    const n = trendSeries.length;
    if (!n) return { path: '', dots: [] };
    const stepX = n > 1 ? (trendChartW - trendPadL - trendPadR) / (n - 1) : 0;
    const dots = trendSeries.map((p, i) => {
      const cx = trendPadL + i * stepX, cy = trendScaleY(p.power_score);
      return {
        cx, cy, label: `Wk ${p.week}`, value: num(p.power_score, 2),
        xLabelStyle: `position:absolute;left:${(cx / trendChartW) * 100}%;top:${trendChartH - 8}px;transform:translate(-50%,0);font:11px var(--font-sans);color:var(--ink-muted);white-space:nowrap`,
      };
    });
    const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.cx},${d.cy}`).join(' ');
    return { path, dots };
  })();
  const trendZeroY = (trendMin < 0 && trendMax > 0) ? trendScaleY(0) : null;
  const trendDelta = trendSeries.length >= 2
    ? trendSeries[trendSeries.length - 1].power_score - trendSeries[trendSeries.length - 2].power_score : null;
  const trendDeltaLabel = trendDelta !== null ? `${trendDelta >= 0 ? '▲' : '▼'} ${num(Math.abs(trendDelta), 2)} vs. last snapshot` : '';
  const trendDeltaColor = trendDelta !== null ? (trendDelta >= 0 ? 'var(--value-positive)' : 'var(--value-risk)') : 'var(--ink-muted)';
  const trendTeamOptions = teams.map((t) => ({ value: t, label: t }));
  const trendTableColumns = [
    { key: 'week', label: 'Week' },
    { key: 'power_score', label: 'Power Score', render: (r) => num(r.power_score, 2) },
    { key: 'baseline_blended', label: 'Baseline', render: (r) => num(r.baseline_blended, 2) },
    { key: 'trajectory', label: 'Trajectory', render: (r) => num(r.trajectory, 2) },
    { key: 'regression_blended', label: 'Regression', render: (r) => num(r.regression_blended, 2) },
    { key: 'wins_to_date', label: 'Wins', render: (r) => `${r.wins_to_date}-${r.games_played - r.wins_to_date}` },
  ];

  // ---------------- Playoff Picture tab ----------------
  const PLAYOFF_SORT_FIELDS = [
    { key: 'super_bowl_pct', label: 'Super Bowl %' },
    { key: 'conf_champ_pct', label: 'Conf. Champ %' },
    { key: 'playoff_pct', label: 'Playoff %' },
    { key: 'division_win_pct', label: 'Division %' },
    { key: 'team', label: 'Team' },
  ];
  const playoffSortPills = PLAYOFF_SORT_FIELDS.map((f) => ({
    key: f.key, label: f.label,
    arrow: s.playoffSortKey === f.key ? (s.playoffSortDir === 'asc' ? '▲' : '▼') : '',
    style: `padding:6px 14px;border-radius:999px;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid ${s.playoffSortKey === f.key ? 'var(--ink)' : 'var(--hairline)'};background:${s.playoffSortKey === f.key ? 'var(--ink)' : 'transparent'};color:${s.playoffSortKey === f.key ? 'var(--paper)' : 'var(--ink-muted)'}`,
    onClick: () => {
      if (s.playoffSortKey === f.key) setState({ playoffSortDir: s.playoffSortDir === 'asc' ? 'desc' : 'asc' });
      else setState({ playoffSortKey: f.key, playoffSortDir: 'desc' });
    },
  }));
  function playoffColumns() {
    return [
      {
        key: 'team', label: 'Team', render: (r) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {r.team === pinnedTeam && <span style={{ width: 7, height: 7, borderRadius: 999, background: pinnedAccentColor, flexShrink: 0, display: 'inline-block' }} />}
            {r.team}
          </span>
        ),
      },
      { key: 'division', label: 'Division' },
      { key: 'division_win_pct', label: 'Division %', render: (r) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}><PctBar value={r.division_win_pct} color="var(--accent-primary)" /><span>{pct(r.division_win_pct)}</span></div>) },
      { key: 'playoff_pct', label: 'Playoff %', render: (r) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}><PctBar value={r.playoff_pct} color="var(--accent-primary)" /><span>{pct(r.playoff_pct)}</span></div>) },
      { key: 'conf_champ_pct', label: 'Conf. Champ %', render: (r) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}><PctBar value={r.conf_champ_pct} color="var(--brass)" /><span>{pct(r.conf_champ_pct)}</span></div>) },
      { key: 'super_bowl_pct', label: 'Super Bowl %', render: (r) => (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}><PctBar value={r.super_bowl_pct} color="var(--value-positive)" /><span style={{ fontWeight: 700 }}>{pct(r.super_bowl_pct)}</span></div>) },
    ];
  }
  function sortPlayoff(rows) {
    return [...rows].sort((a, b) => {
      const av = a[s.playoffSortKey], bv = b[s.playoffSortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return s.playoffSortDir === 'asc' ? cmp : -cmp;
    });
  }
  const afcRows = sortPlayoff(playoff.filter((r) => (r.division || '').startsWith('AFC')));
  const nfcRows = sortPlayoff(playoff.filter((r) => (r.division || '').startsWith('NFC')));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>

      <div style={st('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:26px 40px 0')}>
        <div style={st('display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
          <a href="../index.html" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <img src="assets/logo-lockup-transparent.png" style={{ height: 44 }} alt="Weaver Analytics" />
          </a>
          <h1 style={st('font:900 22px var(--font-sans);color:var(--ink);margin:0;white-space:nowrap;flex-shrink:0')}>The Weaver Blitz</h1>
          <nav style={st('display:flex;gap:16px;flex-wrap:wrap;margin-left:8px')}>
            <a href="../index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Home</a>
            <a href="../cfb-model/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>CFB Model</a>
            <a href="methodology.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Methodology</a>
            <a href="../pre-read/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Pre-Read</a>
            <a href="../dashboards/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Dashboards</a>
            <a href="../blog/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Blog</a>
          </nav>
        </div>
        <div style={st('display:flex;align-items:center;gap:14px')}>
          {s.generatedAt && <span style={st('font:600 12px var(--font-sans);color:var(--ink-faint)')}>Data as of {s.generatedAt}</span>}
          <div style={st('font:700 12px var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted)')}>NFL Team Trajectory Model</div>
        </div>
      </div>

      {s.pipelineError && (
        <div style={st('margin:16px 40px 0;padding:12px 18px;border-radius:var(--radius-sm);background:var(--value-risk-light);color:var(--paper);font:600 13px var(--font-sans)')}>
          {s.pipelineError}
        </div>
      )}

      <div style={st('padding:10px 40px 0')}>
        <p style={st('font:400 16px/1.5 var(--font-sans);color:var(--ink-muted);margin:0')}>Power ratings, schedule projections, win-total uncertainty, and playoff odds — starts from a permanently preserved preseason call, then updates weekly as real results come in. Pin any team to keep it visible across every tab.</p>
      </div>

      <div style={st('margin:24px 40px 0;background:var(--surface-dark);border-radius:var(--radius-md);padding:20px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px')}>
        <div style={st('display:flex;align-items:center;gap:14px')}>
          <span style={st(`font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:${pinnedAccentColor}`)}>Pinned</span>
          {!pinnedTeam && <span style={st('font:600 15px var(--font-sans);color:var(--paper);opacity:.7')}>No team pinned — click the pin icon on any team to track them here.</span>}
          {pinnedTeam && <span style={st('font:900 24px var(--font-sans);color:var(--paper)')}>{pinnedTeam}</span>}
        </div>
        {pinnedRow && (
          <div style={st('display:flex;gap:28px;font:600 15px var(--font-sans);color:var(--paper);flex-wrap:wrap')}>
            <span>Rank <b>#{pinnedIdx + 1}</b> / {rankRows.length}</span>
            <span>Power Score <b>{num(pinnedRow.power_score, 2)}</b></span>
            <span style={{ opacity: 0.7 }}>{pinnedRow.division} #{pinnedRow.div_rank}</span>
          </div>
        )}
        {pinnedTeam && !pinnedRow && <span style={st('font:600 14px var(--font-sans);color:var(--paper);opacity:.7')}>Waiting on power ratings to track {pinnedTeam}</span>}
      </div>

      <div style={st('display:flex;gap:4px;padding:0 40px;margin-top:28px;border-bottom:1px solid var(--hairline)')}>
        {tabsList.map((t) => (
          <button key={t.id} style={st(t.style)} onClick={t.onClick}>{t.label}</button>
        ))}
      </div>

      {tab === 'rankings' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:26px')}>
          {explainerButtons}
          {glossaryPanel}
          {validationPanel}

          <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
            {sortPills.map((p) => (
              <button key={p.key} style={st(p.style)} onClick={p.onClick}>{p.label} {p.arrow}</button>
            ))}
          </div>

          <div style={st('max-height:640px;overflow:auto;border-radius:var(--radius-md)')}>
            {rankTableProps.rows.length
              ? <DataTable columns={rankTableProps.columns} rows={rankTableProps.rows} />
              : <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No power ratings yet — run the pipeline to generate nfl_power_ratings.csv.</div>}
          </div>
        </div>
      )}

      {tab === 'matchup' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:20px')}>
          {explainerButtons}
          {glossaryPanel}
          {validationPanel}

          <div style={st('display:flex;align-items:center;gap:10px')}>
            <label style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Week</label>
            {s.availableWeeks.length > 0 ? (
              <select
                value={s.weekInput}
                onChange={(e) => selectWeek(e.target.value)}
                style={st('font:600 14px var(--font-sans);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
              >
                {s.availableWeeks.map((w) => <option key={w} value={w}>Week {w}</option>)}
              </select>
            ) : <span style={st('font:600 14px var(--font-sans);color:var(--ink-faint)')}>—</span>}
          </div>

          <div style={st('font:400 16px var(--font-sans);color:var(--ink-muted)')}>
            Sorted by |model spread| — {pinnedTeam || 'pinned team'}'s games pinned to the top. Bye-week teams simply don't appear this week.
          </div>

          <div style={st('display:flex;flex-direction:column;gap:14px')}>
            {matchupList.length === 0 && (
              <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No games this week.</div>
            )}
            {matchupList.map((g) => (
              <div key={g.key} style={st(g.cardStyle)}>
                <button onClick={g.onToggle} style={st('width:100%;text-align:left;border:none;background:var(--surface-card);cursor:pointer;padding:18px 22px;display:flex;flex-direction:column;gap:14px')}>
                  <div style={st('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px')}>
                    <span style={st('font:700 18px var(--font-sans);color:var(--ink)')}>{g.away_team} <span style={st('color:var(--ink-muted);font-weight:400')}>at</span> {g.home_team}{g.neutral_site && <span style={st('font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-left:8px')}>Neutral site</span>}{g.isFinal && <span style={st('font:700 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--paper);background:var(--value-positive);border-radius:4px;padding:2px 8px;margin-left:8px')}>Final</span>}</span>
                    <span style={st('font:700 15px var(--font-sans);color:var(--ink)')}>{g.isFinal ? g.finalScoreLabel : g.spreadLabel}</span>
                  </div>
                  <div style={st('display:flex;align-items:center;gap:10px')}>
                    <span style={st('width:90px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted);text-align:right')}>{g.away_team}</span>
                    <div style={{ flex: 1, height: 14, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `calc(${100 - g.homeWinPct}% - 4px)`, background: g.awayColor }} />
                      <div style={{ width: 8, flexShrink: 0, background: `linear-gradient(to right, transparent, white, transparent)` }} />
                      <div style={{ width: `calc(${g.homeWinPct}% - 4px)`, background: g.homeColor }} />
                    </div>
                    <span style={st('width:90px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted)')}>{g.home_team}</span>
                  </div>
                  <div style={st('display:flex;justify-content:space-between;font:600 12px var(--font-sans);color:var(--ink-faint)')}>
                    <span>{g.isFinal ? (g.winner === g.away_team ? 'Won' : g.winner ? 'Lost' : 'Tied') : `${pct(1 - (g.win_prob || 0.5))} win`}</span>
                    <span>{g.isFinal ? (g.winner === g.home_team ? 'Won' : g.winner ? 'Lost' : 'Tied') : `${pct(g.win_prob || 0.5)} win`}</span>
                  </div>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>{g.isFinal ? `${g.finalWinnerNote} · Model predicted ${g.spreadLabel}` : g.hfaNote} · {g.away_team} power {num(g.away_power, 2)}, {g.home_team} power {num(g.home_power, 2)} · {g.expanded ? 'Hide' : 'Show'} spread breakdown</div>
                </button>
                {g.expanded && (
                  <div style={st('padding:6px 22px 20px;background:var(--surface-page);display:flex;flex-direction:column;gap:12px')}>
                    <div style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-top:6px')}>Why this spread</div>
                    {g.contributionBars.map((b) => (
                      <div key={b.label} style={st('display:flex;align-items:center;gap:12px')}>
                        <span style={st('width:220px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted)')}>{b.label}</span>
                        <SignedBar value={b.value} scaleMax={g.contributionScale} width={140} />
                        <span style={st('width:56px;text-align:right;font:600 13px var(--font-sans);color:var(--ink)')}>{signed(b.display, 1)}</span>
                      </div>
                    ))}
                    <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>Positive favors {g.home_team} (home); negative favors {g.away_team} (away). Power Score converts 1-for-1 into points, so these four always add up exactly to the spread above.</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div style={st('padding:32px 40px 60px;max-width:1320px;margin:0 auto;display:flex;flex-direction:column;gap:22px')}>
          <div style={st('display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
            <span style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team</span>
            <select
              value={activeTeam || ''}
              onChange={(e) => setState({ selectedTeam: e.target.value })}
              style={st('font:600 15px var(--font-sans);padding:10px 16px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
            >
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {!activeRow && (
            <p style={st('font:400 16px var(--font-sans);color:var(--ink-muted)')}>No power rating data for {activeTeam || 'this team'} yet.</p>
          )}

          {profile && (
            <div style={st('display:flex;flex-direction:column;gap:22px')}>
              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:6px')}>
                <span style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--brass)')}>Team Profile</span>
                <h2 style={st('font:900 26px var(--font-sans);margin:6px 0 4px;color:var(--ink)')}>{profile.headline}</h2>
                <p style={st('font:400 16px/1.5 var(--font-sans);color:var(--ink-muted);margin:0')}>{profile.oneLiner}</p>
              </div>

              {kpiTilesJSX}

              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:14px;max-width:760px')}>
                {profile.execSummary.map((p, i) => (
                  <p key={i} style={st('font:400 15px/1.6 var(--font-sans);color:var(--ink);margin:0')}>{p}</p>
                ))}
                {monteCarloCallout && (
                  <div style={st('background:var(--surface-page);border-left:3px solid var(--brass);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:12px 16px;font:600 14px/1.5 var(--font-sans);color:var(--ink)')}>
                    Most likely finish: {monteCarloCallout.modeWins} wins ({pct(monteCarloCallout.modeProb, 0)} of simulations). {pct(monteCarloCallout.atLeastNinePct, 0)} chance of at least 9 wins.{monteCarloCallout.rangeLow !== null && ` Simulated 90% range: ${monteCarloCallout.rangeLow} to ${monteCarloCallout.rangeHigh} wins.`}
                  </div>
                )}
              </div>

              <div style={st('display:flex;flex-direction:column;gap:14px')}>
                <div>
                  <div style={st('font:800 19px var(--font-sans);color:var(--ink)')}>Model SWOT</div>
                  <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:2px')}>Strengths and Weaknesses are what the model's numbers say right now. Opportunities and Threats are what would change the call.</div>
                </div>
                {profile.whyModelThinks && (
                  <div style={st('display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:980px')}>
                    <SWOTQuadrant label="Strengths" sub="Current evidence behind the call" items={profile.whyModelThinks.optimism} tone="positive" />
                    <SWOTQuadrant label="Weaknesses" sub="Current evidence working against it" items={profile.whyModelThinks.risks} tone="risk" />
                  </div>
                )}
                <div style={st('display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:980px')}>
                  <SWOTQuadrant label="Opportunities" sub="Model is probably too pessimistic if…" items={profile.changeOurMind.pessimisticIf} tone="positive" />
                  <SWOTQuadrant label="Threats" sub="Expectations should be lowered if…" items={profile.changeOurMind.lowerIf} tone="risk" />
                </div>
              </div>

              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:10px;max-width:760px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Five Questions That Decide the Season</div>
                <ol style={st('margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px')}>
                  {profile.fiveQuestions.map((q, i) => (
                    <li key={i} style={st('font:400 15px/1.5 var(--font-sans);color:var(--ink)')}>{q}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {!profile && activeRow && (
            <div style={st(`background:${snapshotBg};border-radius:var(--radius-md);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px`)}>
              {kpiTilesInner}
              {fallbackRationale && (
                <div style={st(`font:400 17px/1.5 var(--font-sans);color:${snapshotTextColor};opacity:.9`)}>{fallbackRationale}</div>
              )}
            </div>
          )}

          <div style={st('display:flex;flex-wrap:wrap;gap:18px;align-items:stretch')}>
            {teamDNADimensions.length > 0 && (
              <div style={st('flex:1 1 300px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team DNA</div>
                <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:-6px')}>What kind of team this is, not how good they are — each bar is this team's percentile among all {teams.length} teams on that dimension.</div>
                <TeamDNA st={st} dimensions={teamDNADimensions} />
              </div>
            )}

            {activeCoaching && (
              <div style={st('flex:1 1 300px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Coaching Overview</div>
                {[
                  { label: 'Head Coach', name: activeCoaching.head_coach, change: activeCoaching.changes.hc },
                  { label: 'Offensive Coordinator', name: activeCoaching.offensive_coordinator, change: activeCoaching.changes.oc },
                  { label: 'Defensive Coordinator', name: activeCoaching.defensive_coordinator, change: activeCoaching.changes.dc },
                ].map((row) => (
                  <div key={row.label} style={st('display:flex;flex-direction:column;gap:2px;padding-top:8px;border-top:1px solid var(--hairline)')}>
                    <div style={st('font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)')}>{row.label}</div>
                    <div style={st('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                      <span style={st('font:700 16px var(--font-sans);color:var(--ink)')}>{row.name}</span>
                      {row.change.new && <span style={st('font:700 10px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;background:var(--brass);color:var(--ink);padding:3px 8px;border-radius:999px')}>New in 2026</span>}
                    </div>
                    {row.change.new && row.change.origin && <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>{row.change.origin}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeRow && (
              <div style={st('flex:1 1 300px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Score breakdown</div>
                <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:-6px')}>Shown at full scale — Power Score above applies 45%/35%/20% weights to these three, so they won't sum to it directly.</div>
                {componentBars.map((b) => (
                  <div key={b.label} style={st('display:flex;align-items:center;gap:12px')}>
                    <span style={st('width:110px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted)')}>{b.label}</span>
                    <div style={{ flex: 1 }}><SignedBar value={b.value} scaleMax={componentScale} width="100%" /></div>
                    <span style={st('width:56px;text-align:right;font:600 13px var(--font-sans);color:var(--ink)')}>{signed(b.value, 1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={st('display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start')}>
            <div style={st('flex:1 1 300px;display:flex;flex-direction:column;gap:18px')}>
              <div style={st('font:700 14px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>People</div>

              {activeTalent && (
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:10px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Talent Map</div>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:-6px')}>Real starters, real positions — from the {talentMapSnapshot ? new Date(talentMapSnapshot + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'most recent'} depth-chart snapshot. Predates the 2026 draft class and August roster cuts, so treat this as a starting point, not today's exact 53.</div>
                  <TalentMapField players={activeTalent.players} scheme={activeTalent.scheme} />
                </div>
              )}

              {keyPersonCardJSX}
            </div>

            <div style={st('flex:1 1 300px;display:flex;flex-direction:column;gap:18px')}>
              <div style={st('font:700 14px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Schedule</div>

              {activeRow && (
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:4px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:2px')}>
                    {upcomingSchedule.length ? 'Schedule journey' : 'Full schedule'}
                  </div>
                  {journeySummary && (
                    <div style={st('font:400 12px/1.5 var(--font-sans);color:var(--ink-faint);margin-bottom:8px')}>{journeySummary}</div>
                  )}
                  {journeyRows.map((g) => (
                    <div key={g.week} style={st('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--hairline)')}>
                      <span style={st('width:26px;flex-shrink:0;font:700 11px var(--font-sans);color:var(--ink-faint)')}>W{g.week}</span>
                      {g.bye ? (
                        <span style={st('flex:1;font:600 13px var(--font-sans);color:var(--ink-faint);font-style:italic')}>Bye week</span>
                      ) : (
                        <>
                          <span style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, display: 'inline-block', background: difficultyMeta[g.difficulty].color }} title={difficultyMeta[g.difficulty].label} />
                          <span style={st('flex:1;font:600 13px var(--font-sans);color:var(--ink)')}>
                            {g.home ? 'vs' : '@'} {g.opponent}
                            {g.isDivision && <span style={st('margin-left:6px;font:700 10px var(--font-sans);letter-spacing:.04em;color:var(--ink-faint)')}>DIV</span>}
                            {g.isSwing && <span style={st('margin-left:6px;font:700 10px var(--font-sans);letter-spacing:.04em;color:var(--brass)')}>SWING</span>}
                          </span>
                          <span style={st('font:700 12px var(--font-sans);color:var(--ink-muted);text-align:right;width:38px;flex-shrink:0')}>{pct(g.win_prob, 0)}</span>
                          <span style={st('font:600 12px var(--font-sans);color:var(--ink-muted);text-align:right')}>
                            {g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                  <div style={st('font:400 11px var(--font-sans);color:var(--ink-faint);margin-top:8px')}>
                    {upcomingSchedule.length ? "Auto-filters to games on or after today's date." : "Season hasn't started — showing the full 18-week schedule."} Dot color and % are this team's own win probability for that game — green 60%+, gold a real toss-up, red 40%-or-worse. DIV = division opponent, SWING = within 5 points of a coin flip.
                  </div>
                </div>
              )}
            </div>

            <div style={st('flex:1 1 300px;display:flex;flex-direction:column;gap:18px')}>
              <div style={st('font:700 14px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Outlook</div>

              {coneRows.length > 0 && (
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:10px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Cone of Certainty — projected wins</div>
                  <svg viewBox={`0 0 ${coneChartW} ${coneRows.length * coneRowH + 24}`} width="100%" height={coneRows.length * coneRowH + 24} style={{ display: 'block' }}>
                    {coneRows.map((r, i) => {
                      const y = i * coneRowH + coneRowH / 2;
                      return (
                        <React.Fragment key={r.label}>
                          <text x={0} y={y + 4} style={{ font: '600 12px var(--font-sans)', fill: 'var(--ink-muted)' }}>{r.label}</text>
                          <line x1={coneX(r.low)} y1={y} x2={coneX(r.high)} y2={y} stroke={r.color} strokeWidth="8" strokeLinecap="round" opacity="0.35" />
                          <circle cx={coneX(r.mean)} cy={y} r="6" fill={r.color} />
                          <text x={coneX(r.low)} y={y + coneRowH / 2 - 6} style={{ font: '600 11px var(--font-sans)', fill: 'var(--ink-faint)' }} textAnchor="middle">{num(r.low, 1)}</text>
                          <text x={coneX(r.high)} y={y + coneRowH / 2 - 6} style={{ font: '600 11px var(--font-sans)', fill: 'var(--ink-faint)' }} textAnchor="middle">{num(r.high, 1)}</text>
                          <text x={coneX(r.mean)} y={y - 14} style={{ font: '700 12px var(--font-sans)', fill: 'var(--ink)' }} textAnchor="middle">{num(r.mean, 1)}</text>
                        </React.Fragment>
                      );
                    })}
                  </svg>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>90% confidence interval, expected wins out of 17 games. The simulated range is wider — that's the correction described in "How well does this model actually work?" on the Power Rankings tab.</div>
                </div>
              )}

              {histBars.length > 0 && (
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:10px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Win-total distribution — all 20,000 simulated seasons</div>
                  <svg viewBox={`0 0 ${histChartW} ${histChartH + 24}`} width="100%" height={histChartH + 24} style={{ display: 'block' }}>
                    {histBars.map((b, i) => {
                      const x = i * (histBarW + histBarGap);
                      const y = histY(b.prob);
                      const inRange = activeMC && b.wins >= Math.round(activeMC.sim_ci90_low) && b.wins <= Math.round(activeMC.sim_ci90_high);
                      return (
                        <React.Fragment key={b.wins}>
                          <rect x={x} y={y} width={histBarW} height={histChartH - y} fill={inRange ? 'var(--brass)' : 'var(--hairline)'} rx="2" />
                          <text x={x + histBarW / 2} y={histChartH + 16} style={{ font: '600 10px var(--font-sans)', fill: 'var(--ink-faint)' }} textAnchor="middle">{b.wins}</text>
                        </React.Fragment>
                      );
                    })}
                  </svg>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>Each bar is a win total (0-17); height is how often that exact total came up across 20,000 simulated seasons. Gold bars mark the 90% confidence range shown in the Cone of Certainty above — the grey bars are real possibilities too, just less likely ones.</div>
                </div>
              )}

              {activePlayoff && (
                <div style={st('display:flex;gap:14px;flex-wrap:wrap')}>
                  {[
                    { label: 'Division Win %', value: activePlayoff.division_win_pct },
                    { label: 'Playoff %', value: activePlayoff.playoff_pct },
                    { label: 'Conf. Champ %', value: activePlayoff.conf_champ_pct },
                    { label: 'Super Bowl %', value: activePlayoff.super_bowl_pct },
                  ].map((tile) => (
                    <div key={tile.label} style={st('flex:1;min-width:120px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                      <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px')}>{tile.label}</div>
                      <div style={st('font:900 30px var(--font-sans);color:var(--ink)')}>{pct(tile.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'trend' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:22px')}>
          {explainerButtons}
          {glossaryPanel}
          {validationPanel}

          <div style={st('display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
            <span style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team</span>
            <select
              value={activeTeam || ''}
              onChange={(e) => setState({ selectedTeam: e.target.value })}
              style={st('font:600 15px var(--font-sans);padding:10px 16px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
            >
              {trendTeamOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {trendDelta !== null && <span style={st(`font:700 15px var(--font-sans);color:${trendDeltaColor}`)}>{trendDeltaLabel}</span>}
          </div>

          {trendSeries.length <= 1 && (
            <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);font:400 16px/1.5 var(--font-sans);color:var(--ink-muted)')}>
              Only the preseason snapshot exists so far — this tab fills in with one point per week once the pipeline is re-run during the season. The preseason call itself is preserved permanently and never overwritten, so it'll always be the first point on this chart, however the season goes.
            </div>
          )}

          {trendSeries.length > 1 && (
            <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
              <div style={st('display:grid;grid-template-columns:55% 45%;gap:28px;align-items:stretch')}>
                <div style={{ minWidth: 0 }}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Power Score over the season</div>
                  <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                    <svg viewBox={`0 0 ${trendChartW} ${trendChartH}`} width="100%" height={trendChartH} preserveAspectRatio="none" style={{ display: 'block' }}>
                      {trendYTicks.map((tick, i) => <line key={i} x1={trendPadL - 8} y1={tick.y} x2={trendChartW} y2={tick.y} stroke="var(--hairline)" />)}
                      {trendZeroY !== null && <line x1={trendPadL - 8} y1={trendZeroY} x2={trendChartW} y2={trendZeroY} stroke="var(--ink-faint)" strokeDasharray="4 4" />}
                      <path d={trendGeom.path} fill="none" stroke={pinnedAccentColor} strokeWidth="3" />
                      {trendGeom.dots.map((d, i) => (
                        <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={pinnedAccentColor}>
                          <title>{d.label} — {activeTeam}: {d.value}</title>
                        </circle>
                      ))}
                    </svg>
                    {trendYTicks.map((tick, i) => <div key={i} style={st(tick.style)}>{tick.label}</div>)}
                    {trendGeom.dots.map((d, i) => <div key={i} style={st(d.xLabelStyle)}>{d.label}</div>)}
                  </div>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:6px;width:100%;text-align:center')}>Week (0 = preseason call)</div>
                </div>
                <div style={{ minWidth: 0, overflowX: 'auto' }}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Week-over-week</div>
                  <div style={{ minWidth: 420 }}>
                    <DataTable columns={trendTableColumns} rows={trendSeries} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'playoff' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:26px')}>
          {explainerButtons}
          {glossaryPanel}
          {validationPanel}

          <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
            {playoffSortPills.map((p) => (
              <button key={p.key} style={st(p.style)} onClick={p.onClick}>{p.label} {p.arrow}</button>
            ))}
          </div>

          {playoff.length === 0 ? (
            <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No playoff simulation data yet — run nfl_playoff_simulation.py.</div>
          ) : (
            <>
              <div style={st('font:700 14px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>AFC</div>
              <DataTable columns={playoffColumns()} rows={afcRows} />
              <div style={st('font:700 14px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-top:12px')}>NFC</div>
              <DataTable columns={playoffColumns()} rows={nfcRows} />
              <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>From a 5,000-season Monte Carlo simulation with a documented tiebreaker simplification (win% → head-to-head for clean 2-way ties → division/conference record → Power Score fallback) — see the <a href="methodology.html" style={st('color:var(--accent-primary);font-weight:700')}>Methodology page</a> for scope details.</div>
            </>
          )}
        </div>
      )}

      <div style={st('margin-top:auto;padding:18px 40px;border-top:1px solid var(--hairline);font:400 13px var(--font-sans);color:var(--ink-faint)')}>
        This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
