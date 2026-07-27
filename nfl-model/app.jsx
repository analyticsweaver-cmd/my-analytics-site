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

  const { power, winProjections, monteCarlo, monteCarloHistogram, playoff, keyPerson, preseasonPower, matchupByWeek, teamSchedule, historyRows, tab, glossaryOpen, validationOpen, pinnedTeam } = s;

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
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:22px')}>
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

              {teamDNADimensions.length > 0 && (
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team DNA</div>
                  <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:-6px')}>What kind of team this is, not how good they are — each bar is this team's percentile among all {teams.length} teams on that dimension.</div>
                  <TeamDNA st={st} dimensions={teamDNADimensions} />
                </div>
              )}

              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:14px')}>
                {profile.execSummary.map((p, i) => (
                  <p key={i} style={st('font:400 15px/1.6 var(--font-sans);color:var(--ink);margin:0')}>{p}</p>
                ))}
                {monteCarloCallout && (
                  <div style={st('background:var(--surface-page);border-left:3px solid var(--brass);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:12px 16px;font:600 14px/1.5 var(--font-sans);color:var(--ink)')}>
                    Most likely finish: {monteCarloCallout.modeWins} wins ({pct(monteCarloCallout.modeProb, 0)} of simulations). {pct(monteCarloCallout.atLeastNinePct, 0)} chance of at least 9 wins.{monteCarloCallout.rangeLow !== null && ` Simulated 90% range: ${monteCarloCallout.rangeLow} to ${monteCarloCallout.rangeHigh} wins.`}
                  </div>
                )}
              </div>

              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:10px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Five Questions That Decide the Season</div>
                <ol style={st('margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px')}>
                  {profile.fiveQuestions.map((q, i) => (
                    <li key={i} style={st('font:400 15px/1.5 var(--font-sans);color:var(--ink)')}>{q}</li>
                  ))}
                </ol>
              </div>

              {keyPersonCardJSX}

              <div style={st('display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px')}>
                <div style={st('background:var(--surface-card);border-left:3px solid var(--value-positive);border-radius:0 var(--radius-md) var(--radius-md) 0;box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:8px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--value-positive)')}>Model is probably too pessimistic if…</div>
                  <ul style={st('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px')}>
                    {profile.changeOurMind.pessimisticIf.map((t, i) => (
                      <li key={i} style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink)')}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div style={st('background:var(--surface-card);border-left:3px solid var(--value-risk);border-radius:0 var(--radius-md) var(--radius-md) 0;box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:8px')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--value-risk)')}>Expectations should be lowered if…</div>
                  <ul style={st('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px')}>
                    {profile.changeOurMind.lowerIf.map((t, i) => (
                      <li key={i} style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink)')}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div style={st('display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start')}>
          <div style={st('flex:2 1 480px;display:flex;flex-direction:column;gap:22px')}>

          {!profile && activeRow && (
            <div style={st(`background:${snapshotBg};border-radius:var(--radius-md);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px`)}>
              {kpiTilesInner}
              {fallbackRationale && (
                <div style={st(`font:400 17px/1.5 var(--font-sans);color:${snapshotTextColor};opacity:.9`)}>{fallbackRationale}</div>
              )}
            </div>
          )}

          {activeRow && (
            <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
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

          {!profile && keyPersonCardJSX}

          {activePlayoff && (
            <div style={st('display:flex;gap:20px;flex-wrap:wrap')}>
              {[
                { label: 'Division Win %', value: activePlayoff.division_win_pct },
                { label: 'Playoff %', value: activePlayoff.playoff_pct },
                { label: 'Conf. Champ %', value: activePlayoff.conf_champ_pct },
                { label: 'Super Bowl %', value: activePlayoff.super_bowl_pct },
              ].map((tile) => (
                <div key={tile.label} style={st('flex:1;min-width:150px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px')}>{tile.label}</div>
                  <div style={st('font:900 30px var(--font-sans);color:var(--ink)')}>{pct(tile.value)}</div>
                </div>
              ))}
            </div>
          )}

          </div>

          <div style={st('flex:1 1 280px;display:flex;flex-direction:column;gap:22px')}>
            {activeRow && (
              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:4px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px')}>
                  {upcomingSchedule.length ? 'Upcoming schedule' : 'Full schedule'}
                </div>
                {scheduleToShow.map((g) => (
                  <div key={g.week} style={st('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--hairline)')}>
                    <span style={st('width:26px;flex-shrink:0;font:700 11px var(--font-sans);color:var(--ink-faint)')}>W{g.week}</span>
                    {g.bye ? (
                      <span style={st('flex:1;font:600 13px var(--font-sans);color:var(--ink-faint);font-style:italic')}>Bye week</span>
                    ) : (
                      <>
                        <span style={st('flex:1;font:600 13px var(--font-sans);color:var(--ink)')}>{g.home ? 'vs' : '@'} {g.opponent}</span>
                        <span style={st('font:600 12px var(--font-sans);color:var(--ink-muted);text-align:right')}>
                          {g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                <div style={st('font:400 11px var(--font-sans);color:var(--ink-faint);margin-top:8px')}>
                  {upcomingSchedule.length ? "Auto-filters to games on or after today's date." : "Season hasn't started — showing the full 18-week schedule."}
                </div>
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
