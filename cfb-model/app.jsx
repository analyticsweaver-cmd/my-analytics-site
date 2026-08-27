const { useState, useEffect } = React;

// ----------------------------------------------------------------------
// Team colors (ported verbatim from CFB Dashboard.dc.html)
// ----------------------------------------------------------------------
const TEAM_COLORS = {
  "Alabama": "#9E1B32", "Arkansas": "#9D2235", "Auburn": "#0C2340", "Florida": "#0021A5", "Georgia": "#BA0C2F",
  "Kentucky": "#0033A0", "LSU": "#461D7C", "Ole Miss": "#14213D", "Mississippi State": "#660000", "Missouri": "#F1B82D",
  "Oklahoma": "#841617", "South Carolina": "#73000A", "Tennessee": "#FF8200", "Texas": "#BF5700", "Texas A&M": "#500000",
  "Vanderbilt": "#866D4B", "Illinois": "#E84A27", "Indiana": "#990000", "Iowa": "#FFCD00", "Maryland": "#E03A3E",
  "Michigan": "#00274C", "Michigan State": "#18453B", "Minnesota": "#7A0019", "Nebraska": "#E41C38", "Northwestern": "#4E2A84",
  "Ohio State": "#BB0000", "Oregon": "#154733", "Penn State": "#041E42", "Purdue": "#CEB888", "Rutgers": "#CC0033",
  "UCLA": "#2D68C4", "USC": "#990000", "Washington": "#4B2E83", "Wisconsin": "#C5050C", "Arizona": "#AB0520",
  "Arizona State": "#8C1D40", "Baylor": "#003015", "BYU": "#002E5D", "Cincinnati": "#E00122", "Colorado": "#CFB87C",
  "Houston": "#C8102E", "Iowa State": "#C8102E", "Kansas": "#0051BA", "Kansas State": "#512888", "Oklahoma State": "#FF7300",
  "TCU": "#4D1979", "Texas Tech": "#CC0000", "UCF": "#000000", "Utah": "#CC0000", "West Virginia": "#002855",
  "Boston College": "#98002E", "California": "#003262", "Clemson": "#F56600", "Duke": "#012169", "Florida State": "#782F40",
  "Georgia Tech": "#B3A369", "Louisville": "#AD0000", "Miami": "#F47321", "NC State": "#CC0000", "North Carolina": "#7BAFD4",
  "Pittsburgh": "#003594", "SMU": "#C8102E", "Stanford": "#8C1515", "Syracuse": "#F76900", "Virginia": "#232D4B",
  "Virginia Tech": "#630031", "Wake Forest": "#9E7E38", "Notre Dame": "#0C2340", "Army": "#000000", "UMass": "#881C1C",
  "Boise State": "#0033A0", "UTSA": "#0C2340",
};
function teamColor(team) { return TEAM_COLORS[team] || '#8C8F93'; }

const GLOSSARY_TERMS = [
  { term: 'Power Score', def: 'Overall team strength, combining offensive and defensive efficiency, adjusted for opponent quality and blended with a preseason talent/coaching prior that fades out as the season goes on.' },
  { term: 'Preseason Prior', def: "A team's rating before the blend with real season data, built from personnel (talent, returning starters, transfer portal), coaching stability, and a coaching-performance history signal. Shown as a z-score (0 = league average), the same units used on the Team Detail page." },
  { term: 'This Season', def: "The team's opponent-adjusted efficiency rating from this season's actual games alone, before blending with the Preseason Prior. Shows as '—' until the team has played at least one game." },
  { term: 'Success Rate', def: 'The percentage of plays that gain enough yardage to keep a drive "on schedule" (roughly: 50% of yards needed on 1st down, 70% on 2nd, 100% on 3rd/4th). Measures consistency, not big plays.' },
  { term: 'Explosiveness', def: 'Average yards gained per successful play. Measures big-play ability — a team can be efficient (high success rate) without being explosive, or vice versa.' },
  { term: 'Havoc Rate', def: 'How often a defense creates a disruptive play — a tackle for loss, forced fumble, interception, or pass breakup.' },
  { term: 'Run Game / Pass Game', def: "Compares one team's rushing (or passing) success rate against the specific opponent's rushing (or passing) defense — separate from the overall Success Rate bar above, which blends both together." },
  { term: 'Coaching Continuity', def: 'Reflects whether either team is dealing with a new head coach this season, and whether that coach is a first-time hire (bigger disruption) or an experienced one (smaller disruption). A team with a stable, continuous staff scores better here than one adjusting to a coaching change.' },
  { term: 'Model Edge', def: "The difference between this model's predicted margin and what the betting market's spread implies. Positive means the model favors the home team more than the market does; negative means it favors the away team more." },
  { term: 'Home Field Edge', def: "Points added to the home team's predicted margin, based on that specific team's historical home performance — not a flat number applied to every stadium." },
  { term: 'SP+', def: 'An independent, well-established power rating (built by a college football analytics site, not this model) shown alongside our number as a sanity check.' },
];


// CFB Team Profiles (added 2026-08-18, shortlist per Anna: all of Arkansas's
// 2026 opponents + anyone else in the current top 10 by Power Score).
// IMPORTANT SCOPE NOTE: this is deliberately a smaller template than the NFL
// TEAM_PROFILES object. No CFB team has any opponent-adjusted on-field stats
// yet (adj_off_success_rate, explosiveness, havoc, etc. are null for all 138
// FBS teams - games_played is 0 across the board, since the 2026 season
// hasn't started; CFBD has no game data until kickoff, ~Aug 23-30). Every
// profile below is built ONLY from what's real and available preseason:
// recruiting talent, returning production, transfer portal net value, the
// personnel+coaching prior blend, real verified coaching-change facts, and -
// where applicable - Arkansas's own model-computed win probability in that
// matchup. No fiveQuestions/changeOurMind sections yet (kept to headline,
// oneLiner, execSummary, and a two-quadrant Strengths/Weaknesses SWOT) -
// once real 2026 game data exists, these should get a full refresh with the
// same structure NFL's profiles use, including Team DNA's five currently-null
// on-field dimensions. North Alabama (Arkansas's Week 1 opponent) has no
// profile - it's an FCS program with zero rows in the CFB model's FBS-only
// dataset, so there's no real data to ground one in.
const CFB_TEAM_PROFILES = {
  'Ohio State': {
    headline: "Ohio State: The Model's #1 Team, With One Real Question Mark",
    oneLiner: "Ohio State opens 2026 atop the model's rankings on talent and continuity alone — the one thing working against that consensus is the transfer portal, where the Buckeyes posted a real net outflow in personnel value.",
    execSummary: [
      "Power Score has Ohio State #1 overall (0.161), and SP+ agrees closely, ranking them #2 nationally (30.1) — two independently built systems landing in the same neighborhood is a real signal, not a coincidence.",
      "The foundation is real: a 98th-percentile recruiting talent base and Ryan Day returning for another season give Ohio State a genuinely stable coaching situation heading into 2026.",
      "The one number working against the consensus: Ohio State's transfer portal net value (-2.5 z-score) is a real, significant net outflow — real outgoing production the incoming class and returning core will need to cover.",
    ],
    whyModelThinks: {
      optimism: [
        "98th-percentile recruiting talent — a deep, blue-chip roster by any measure.",
        "Zero coaching turnover — Ryan Day enters 2026 with full continuity.",
        "An 80th-percentile returning-production number means the on-field continuity is real, not just recruiting rankings on paper.",
        "A +9.44 home-field edge is a real, sizable, model-derived number.",
      ],
      risks: [
        "Transfer portal net value (-2.5 z-score) is a real, significant net outflow — an open question whether the incoming class fully replaces it.",
        "This is still a preseason read: no opponent-adjusted efficiency stats exist yet for any team in the country, Ohio State included, until real games are played.",
      ],
    },
  },
  Georgia: {
    headline: "Georgia: The Model's Best Recruiting Class, and Arkansas's Week 3 Gauntlet",
    oneLiner: "Georgia carries a 99.6th-percentile recruiting-talent base — about as elite as it gets nationally — into a Week 3 home date with Arkansas, where the model gives the Razorbacks just an 18% chance of winning.",
    execSummary: [
      "Power Score has Georgia #4 nationally (0.145); SP+ is a touch more conservative at #6 (24.1) — close enough that the two systems are telling a consistent story, not contradicting each other.",
      "Kirby Smart returns for a continuity year, and Georgia's 82nd-percentile returning-production number backs it up — this isn't a team leaning on a reload.",
      "Arkansas hosts Georgia in Week 3, and the model gives the Razorbacks an 18% win probability — the toughest single test on Arkansas's slate, by that number.",
    ],
    whyModelThinks: {
      optimism: [
        "99.6th-percentile recruiting talent — about as elite a recruiting base as exists in the sport.",
        "Zero coaching turnover under Kirby Smart, with an 82nd-percentile returning-production number to match.",
        "A team-specific home-field edge of 5.08 — a real, model-derived number, not a league-average estimate.",
      ],
      risks: [
        "Portal net value (-0.94 z-score) is negative — modest, but a real net outflow on an already-strong roster with less margin to absorb losses.",
        "This is still a preseason number — no in-season opponent-adjusted stats exist yet to confirm the talent shows up on the field.",
      ],
    },
  },
  'Texas A&M': {
    headline: "Texas A&M: Real Returning-Production Strength Heading Into Year Three",
    oneLiner: "Mike Elko's third season brings back 87th-percentile returning production heading into 2026, and Arkansas travels to College Station in Week 5 as a real underdog.",
    execSummary: [
      "Power Score ranks Texas A&M #6 nationally (0.136); SP+ is slightly more cautious at #9 (20.7) — a real but modest gap between the two systems.",
      "An 87th-percentile returning-production score, combined with positive portal net value (+0.77) and zero coaching turnover under Mike Elko, makes this one of the more stable preseason profiles on the board.",
      "Arkansas visits in Week 5, and the model gives the Razorbacks just an 11% win probability on the road.",
    ],
    whyModelThinks: {
      optimism: [
        "87th-percentile returning production — real, substantial roster continuity.",
        "Positive transfer portal net value (+0.77 z-score) — a real, if modest, net gain rather than a loss to backfill.",
        "Zero coaching turnover under Mike Elko, now in his third season.",
      ],
      risks: [
        "Recruiting talent (94.6th percentile) is real but isn't the program's top selling point — the roster is built more on development and continuity than a pure talent-gap advantage.",
        "Preseason number only — no opponent-adjusted efficiency data exists yet for any 2026 team.",
      ],
    },
  },
  LSU: {
    headline: "LSU: Elite Talent, a New Coach, and the Model's Biggest Gap Between Recruiting Rank and Actual Rank",
    oneLiner: "LSU recruits like a top-5 program (96th percentile) but opens 2026 ranked #33 by Power Score — a real gap between recruiting pedigree and current production, driven by a first-year coaching change and real roster turnover.",
    execSummary: [
      "Power Score has LSU at #33 nationally (0.059), while their recruiting talent alone (96th percentile) would suggest a top-10 roster — the gap is the story here, not either number in isolation.",
      "Lane Kiffin arrives from Ole Miss to replace Brian Kelly, a real, verified coaching change, and it shows up in the model as a real continuity penalty (coaching prior in the 16th percentile) — new systems take time, and the model isn't pretending otherwise.",
      "Returning production sits at just the 29th percentile — real turnover on top of the coaching change. Arkansas hosts LSU in Week 13, the regular-season finale, and the model has this one closest to a true coin flip of anyone on Arkansas's schedule (46.5%).",
    ],
    whyModelThinks: {
      optimism: [
        "96th-percentile recruiting talent — a real, elite talent base that doesn't disappear just because the coaching staff changed.",
        "Positive transfer portal net value (+1.08 z-score) — Kiffin's staff has already added real value in the portal, even in a transition year.",
        "A near-even Week 13 matchup with Arkansas (46.5%) says the model isn't writing LSU off despite the low overall rank.",
      ],
      risks: [
        "The coaching change is real and recent — Kiffin inherits the program from Brian Kelly, and the model's coaching-continuity component (16th percentile) reflects genuine first-year uncertainty, not a guess.",
        "Returning production in the 29th percentile is real, substantial turnover — a lot of what made LSU's talent base productive last season is gone.",
      ],
    },
  },
  'Ole Miss': {
    headline: "Ole Miss: The Coaching Change Everyone Worried About, Covered by a Real Portal Reload",
    oneLiner: "Pete Golding steps up to replace Lane Kiffin, and while the model does dock Ole Miss for the transition, a real transfer portal reload (+2.19 z-score) is doing real work to offset it.",
    execSummary: [
      "Power Score ranks Ole Miss #8 nationally (0.132); SP+ is actually slightly more bullish at #7 (24.0) — two systems landing almost exactly on top of each other.",
      "Pete Golding, promoted from within after Lane Kiffin's move to LSU, means real coaching-continuity risk (16th percentile) — but Ole Miss backfilled aggressively, posting a real, standout transfer portal net value (+2.19 z-score).",
      "Returning production (61st percentile) is solidly above average even through the transition — this isn't a program starting from scratch.",
    ],
    whyModelThinks: {
      optimism: [
        "A real, standout transfer portal net value (+2.19 z-score) — an aggressive, successful reload.",
        "Returning production at the 61st percentile despite the coaching change — continuity on the roster even where the staff changed.",
        "SP+ (#7) and Power Score (#8) agree closely — a real signal the model isn't an outlier here.",
      ],
      risks: [
        "Coaching continuity sits at the 16th percentile — Pete Golding's first year carries the same real, unresolved transition risk as any first-time head coach.",
        "Recruiting talent (85th percentile) is the program's relative soft spot within the SEC, meaning less margin if the portal class underperforms its projected value.",
      ],
    },
  },
  Auburn: {
    headline: "Auburn: Elite Recruiting Talent, Real Roster Turnover",
    oneLiner: "Alex Golesh inherits a 91st-percentile talent base from Hugh Freeze, but Auburn's returning-production number (19th percentile) is real and low — the roster changed as much as the staff did.",
    execSummary: [
      "Power Score has Auburn at #34 nationally (0.058), close to LSU's #33 — both programs show the same pattern: elite recruiting talent (91st percentile here) the model isn't yet crediting at full value because of a coaching change and heavy roster turnover.",
      "Returning production sits at just the 19th percentile — more of last year's on-field production left than stayed.",
      "Arkansas travels to Auburn in Week 10, and the model gives the Razorbacks a 30% win probability on the road.",
    ],
    whyModelThinks: {
      optimism: [
        "91st-percentile recruiting talent — a real, elite talent floor regardless of this year's turnover.",
        "Positive transfer portal net value (+0.6 z-score) — Golesh's staff added real value even in a transition year.",
        "A 30% Arkansas win probability (meaning Auburn is favored) despite the low overall rank suggests the model isn't discounting Auburn as heavily as the raw rank implies.",
      ],
      risks: [
        "Returning production at the 19th percentile is real, substantial turnover — this is a heavily rebuilt roster, not just a new coaching staff.",
        "Coaching continuity (16th percentile) reflects a real, first-year transition under Alex Golesh — the same open question as any coaching change.",
      ],
    },
  },
  Indiana: {
    headline: "Indiana: A Top-2 Team Built on Coaching Stability, Not Blue-Chip Recruiting",
    oneLiner: "Curt Cignetti's Hoosiers rank #2 nationally by Power Score and #1 in the entire country by SP+ — built almost entirely on coaching stability and portal work, not recruiting talent.",
    execSummary: [
      "Power Score has Indiana #2 nationally (0.159); SP+ actually ranks them #1 in the entire country (32.4) — the two systems don't just agree Indiana is elite, SP+ thinks they're the best team in college football.",
      "This isn't built on recruiting: Indiana's talent (45th percentile) is real but below average nationally — the model is crediting Curt Cignetti's program building and coaching stability, not a blue-chip roster.",
      "Home field is real signal too: an 11.35-point home edge means Bloomington is now a genuinely tough environment.",
    ],
    whyModelThinks: {
      optimism: [
        "SP+ ranks Indiana #1 in the country — outside validation for a program that wasn't in this conversation two years ago.",
        "Positive transfer portal net value (+1.42 z-score) — real, successful reload work under Cignetti.",
        "Zero coaching turnover, Cignetti entering his third season with the same system.",
        "An 11.35-point home-field edge, a real and substantial number.",
      ],
      risks: [
        "Recruiting talent sits at just the 45th percentile — below average for a team ranked this high, meaning less margin if the roster-building approach falters.",
        "Returning production is the 24th percentile — real turnover from last year's roster; the model's confidence rests more on coaching and scheme continuity than depth.",
      ],
    },
  },
  Iowa: {
    headline: "Iowa: Kirk Ferentz's Portal Class Is a Real Reload Story Nobody's Talking About",
    oneLiner: "Iowa's transfer portal net value (+1.79 z-score) is a real, standout reload under a coaching staff that's been unchanged for over two decades.",
    execSummary: [
      "Power Score ranks Iowa #9 nationally (0.113); SP+ is close behind at #12 (19.7) — a consistent read across both systems.",
      "Iowa's transfer portal net value (+1.79 z-score) is a real, standout reload under Kirk Ferentz.",
      "Returning production sits at just the 39th percentile — moderate roster turnover, offset by a real, effective portal class.",
    ],
    whyModelThinks: {
      optimism: [
        "A real, standout transfer portal net value (+1.79 z-score) under Kirk Ferentz.",
        "Zero coaching turnover — Kirk Ferentz provides the longest continuity streak in the sport.",
        "A 9.43-point home-field edge, a real and meaningfully large number.",
      ],
      risks: [
        "Recruiting talent (70th percentile) is solid but not a standout advantage — Iowa isn't out-recruiting the sport's blue bloods.",
        "Returning production at the 39th percentile means real turnover the portal class has to cover, not just supplement.",
      ],
    },
  },
  Miami: {
    headline: "Miami: Elite Talent, Real Coaching Continuity, and a Negative Portal Grade",
    oneLiner: "Mario Cristobal's roster carries 89th-percentile recruiting talent into 2026, but the model flags a real negative in the transfer portal worth watching.",
    execSummary: [
      "Power Score has Miami #10 nationally (0.112); SP+ agrees closely at #9 (20.7).",
      "89.5th-percentile recruiting talent and zero coaching turnover under Mario Cristobal give Miami a stable roster on paper.",
      "The negative: transfer portal net value (-0.74 z-score) is a real outflow — worth watching relative to a talent base this strong.",
    ],
    whyModelThinks: {
      optimism: [
        "89.5th-percentile recruiting talent, a real, elite talent base.",
        "Zero coaching turnover under Mario Cristobal, now with real system continuity.",
        "A 10.55-point home-field edge, a real and substantial number.",
      ],
      risks: [
        "Transfer portal net value (-0.74 z-score) is negative — real production left that the incoming class needs to replace.",
        "Returning production (45th percentile) is middle-of-the-pack, not a strength to lean on.",
      ],
    },
  },
  Missouri: {
    headline: "Missouri: Well Above Its Rank on Talent, Offset by a Real Portal Reload",
    oneLiner: "Eli Drinkwitz's roster recruits like a top-15 team (84th percentile) even though the model has Missouri at #16 — and Arkansas hosts them in Week 9 as a real underdog.",
    execSummary: [
      "Power Score ranks Missouri #16 nationally (0.095); SP+ is more cautious at #21 (14.4) — a real but modest gap.",
      "Recruiting talent (84th percentile) outpaces the raw rank — Eli Drinkwitz's program is recruiting like a top-15 team even though the model has it 16th.",
      "Arkansas hosts Missouri in Week 9, and the model favors Missouri on the road, giving Arkansas just a 32.7% win probability at home.",
    ],
    whyModelThinks: {
      optimism: [
        "84th-percentile recruiting talent, well above what the raw #16 rank alone would suggest.",
        "Positive transfer portal net value (+1.45 z-score), a real and strong reload grade.",
        "Zero coaching turnover — Eli Drinkwitz enters a stable season.",
      ],
      risks: [
        "Returning production is almost exactly average (55th percentile, near-zero z-score) — no real continuity edge to lean on.",
        "The talent-to-rank gap could close either direction: it could mean Missouri is undervalued, or that the roster hasn't yet translated talent into results the model can see.",
      ],
    },
  },
  'Notre Dame': {
    headline: "Notre Dame: A Massive Home-Field Edge, Paired With a Real Portal Negative",
    oneLiner: "Marcus Freeman's Fighting Irish carry a real, standout team-specific home-field number (14.27 points) into a season where the transfer portal worked against them.",
    execSummary: [
      "Power Score ranks Notre Dame #7 nationally (0.134); SP+ is more bullish at #5 (24.4).",
      "Notre Dame Stadium carries a real, standout team-specific home-field edge (+14.27 points) — a model-derived number, not a generic estimate.",
      "The real negative: transfer portal net value (-1.11 z-score) is a real, substantial outflow — production left that the roster needs to replace.",
    ],
    whyModelThinks: {
      optimism: [
        "93.8th-percentile recruiting talent — a real, deep roster.",
        "61st-percentile returning production — solid continuity on top of the talent base.",
        "A real, standout home-field edge (+14.27 points) — Notre Dame Stadium is a genuine, quantified advantage.",
        "Zero coaching turnover under Marcus Freeman.",
      ],
      risks: [
        "Transfer portal net value (-1.11 z-score) is a real, substantial outflow — production lost that the roster needs to replace.",
        "This is still a preseason number — no opponent-adjusted efficiency stats exist yet to confirm the talent shows up on the field.",
      ],
    },
  },
  Oregon: {
    headline: "Oregon: Real Returning-Production Strength, a Real Portal Negative",
    oneLiner: "Dan Lanning's Ducks bring back 88th-percentile returning production — real, substantial continuity — while posting a real net outflow in the transfer portal.",
    execSummary: [
      "Power Score ranks Oregon #5 nationally (0.142); SP+ agrees closely at #4 (25.9).",
      "Returning production sits at the 88th percentile — real, substantial continuity, meaning this roster isn't rebuilding, it's picking up where last year left off.",
      "The same story as Ohio State: transfer portal net value (-2.5 z-score) is a real, significant net outflow — real outgoing talent the deep returning core has to absorb.",
    ],
    whyModelThinks: {
      optimism: [
        "88th-percentile returning production — real, substantial continuity.",
        "96.7th-percentile recruiting talent, a real, elite talent base.",
        "Zero coaching turnover under Dan Lanning.",
      ],
      risks: [
        "Transfer portal net value (-2.5 z-score) is a real, significant net outflow, the same magnitude as Ohio State's.",
        "This is still a preseason read — no 2026 opponent-adjusted stats exist yet for any team, Oregon included.",
      ],
    },
  },
  'South Carolina': {
    headline: "South Carolina: A Real Gap Between the Model's Two Systems",
    oneLiner: "The model's two systems disagree on South Carolina by 20 ranking spots — a real, substantial gap — while the underlying personnel numbers (87th-percentile talent, 83rd-percentile returning production) back the higher read.",
    execSummary: [
      "Power Score ranks South Carolina #29 nationally (0.067); SP+ is far more skeptical at #49 (5.9) — a real, 20-spot gap between the two systems.",
      "The personnel numbers back the higher read: 87th-percentile recruiting talent and 83rd-percentile returning production, both well above what a #29-#49 team typically carries.",
      "Arkansas hosts South Carolina in Week 11, and the model has it closer to a coin flip than all but one other game on Arkansas's schedule (43.1% for Arkansas).",
    ],
    whyModelThinks: {
      optimism: [
        "87th-percentile recruiting talent and 83rd-percentile returning production — both real positives well above what the current rank alone would suggest.",
        "Positive transfer portal net value (+1.45 z-score).",
        "Zero coaching turnover under Shane Beamer.",
      ],
      risks: [
        "The 20-spot gap between Power Score (#29) and SP+ (#49) is real and substantial — one of the two systems is going to be wrong here, and it's worth watching which.",
        "This is a preseason number only — no opponent-adjusted stats exist yet to settle which system has it right.",
      ],
    },
  },
  Tennessee: {
    headline: "Tennessee: Real Talent, Real Turnover, and a Tough Week 6 Test for Arkansas",
    oneLiner: "Josh Heupel's Volunteers carry a strong talent base (89th percentile) into 2026, but real roster turnover (41st-percentile returning production) is the open question.",
    execSummary: [
      "Power Score ranks Tennessee #20 nationally (0.085); SP+ is nearly identical at #19 (15.0) — tight agreement between the two systems.",
      "Recruiting talent sits at the 89th percentile, well above the raw rank — the roster is talented even if the model hasn't fully credited it yet.",
      "Arkansas hosts Tennessee in Week 6, and the model gives Arkansas just a 36.3% win probability at home — a real early-season measuring stick.",
    ],
    whyModelThinks: {
      optimism: [
        "88.8th-percentile recruiting talent, a real, above-average talent base relative to the team's current rank.",
        "Zero coaching turnover under Josh Heupel.",
      ],
      risks: [
        "Returning production sits at just the 41st percentile — real turnover from last year's roster.",
        "Transfer portal net value (-0.85 z-score) is negative, on top of the returning-production gap — two real headwinds working against the talent base.",
      ],
    },
  },
  Texas: {
    headline: "Texas: Elite Talent and Elite Returning Production, One of the Toughest Roads on Arkansas's Schedule",
    oneLiner: "Steve Sarkisian's roster combines 98th-percentile recruiting talent with 86th-percentile returning production — a rare combination — and Arkansas travels to Austin in Week 12 as a heavy underdog.",
    execSummary: [
      "Power Score ranks Texas #12 nationally (0.11); SP+ is more cautious at #17 (16.2) — a real gap, with Power Score the more bullish of the two.",
      "Texas combines 97.5th-percentile recruiting talent with 86.2nd-percentile returning production — both numbers this high at once is genuinely rare.",
      "Arkansas travels to Texas in Week 12, and the model gives the Razorbacks just a 15.7% win probability on the road — one of the toughest single games on Arkansas's schedule.",
    ],
    whyModelThinks: {
      optimism: [
        "97.5th-percentile recruiting talent, among the most elite talent bases in the sport.",
        "86.2nd-percentile returning production — real continuity layered on top of elite talent, a rare combination.",
        "Zero coaching turnover under Steve Sarkisian.",
        "A 10.8-point home-field edge, a real and substantial number.",
      ],
      risks: [
        "Transfer portal net value (-0.73 z-score) is negative — a real, if modest, net outflow even with the strong returning core.",
        "Preseason number only — no opponent-adjusted stats exist yet for any 2026 team, Texas included.",
      ],
    },
  },
  'Texas Tech': {
    headline: "Texas Tech: A Portal-Built #3, and Both Systems Agree",
    oneLiner: "Joey McGuire's Red Raiders sit at #3 nationally in both Power Score and SP+ — a rare exact agreement — built on a real transfer portal class, not blue-chip recruiting.",
    execSummary: [
      "Power Score and SP+ both rank Texas Tech #3 nationally (0.157 and 27.6 respectively) — an unusually tight agreement between two independently built systems.",
      "This isn't a recruiting story: talent sits at the 79th percentile, solid but not the program's calling card — the model is crediting a real, standout transfer portal class (+1.55 z-score) and real returning production (62nd percentile).",
      "Zero coaching turnover under Joey McGuire, and an 11.04-point home-field edge — a real and substantial number.",
    ],
    whyModelThinks: {
      optimism: [
        "Power Score and SP+ both rank Texas Tech #3 nationally — rare, strong agreement between two independent systems.",
        "A real, standout transfer portal net value (+1.55 z-score) — an effective reload.",
        "62nd-percentile returning production on top of the portal class — genuine continuity, not just new additions.",
        "An 11.04-point home-field edge, a real and substantial number.",
      ],
      risks: [
        "Recruiting talent (79th percentile) is solid but not the program's calling card — the roster is built more on transfer-portal execution than a talent-gap advantage, which is a different kind of bet.",
        "Preseason number only — no opponent-adjusted stats exist yet to confirm the portal class translates on the field.",
      ],
    },
  },
  Tulsa: {
    headline: "Tulsa: A Week 4 Home Game the Model Says Arkansas Should Win Comfortably",
    oneLiner: "Tulsa is a clear outlier — ranked outside the top 100 nationally by both systems — and the model gives Arkansas a 78.8% win probability when the Razorbacks host the Golden Hurricane in Week 4.",
    execSummary: [
      "Power Score has Tulsa at #101 nationally (-0.032); SP+ is even more pessimistic at #104 (-10.0) — both systems agree this is a clear roster gap, not a close call.",
      "Recruiting talent (36th percentile) and a near-zero home-field edge (+0.48 points) reflect a program without the resource base of the Power 4 programs on Arkansas's schedule — included here only because Arkansas plays them, not because of national ranking.",
      "Arkansas hosts Tulsa in Week 4, and the model gives the Razorbacks a 78.8% win probability — the most lopsided matchup on Arkansas's 2026 schedule.",
    ],
    whyModelThinks: {
      optimism: [
        "Positive transfer portal net value (+0.71 z-score) — a real, modest reload success despite the program's overall resource gap.",
        "Returning production is almost exactly average for FBS (53rd percentile) — no unusual turnover working against them.",
      ],
      risks: [
        "Recruiting talent sits at just the 36th percentile — real, below-average for FBS.",
        "A near-zero home-field edge (+0.48 points) is a real, low number — even Tulsa's home environment isn't grading as a real advantage in the model.",
      ],
    },
  },
  Utah: {
    headline: "Utah: A New Coach Replacing a Legend, Backed by Real Roster Continuity",
    oneLiner: "Morgan Scalley takes over for Kyle Whittingham, and while the model dings Utah for that transition, 80th-percentile returning production says the roster itself barely changed — Arkansas travels to Salt Lake City in Week 2 as a real underdog.",
    execSummary: [
      "SP+ actually likes Utah more than Power Score does — #8 nationally (22.2) versus #11 (0.111) — a real gap worth noting.",
      "Morgan Scalley, promoted from within after Kyle Whittingham's departure, is a real, verified coaching change, and the model's coaching-continuity component reflects genuine first-year uncertainty.",
      "The offset: 80.1st-percentile returning production, a real, above-average number, meaning most of the on-field roster carries over even though the sideline changed. Arkansas travels to Utah in just Week 2, and the model gives the Razorbacks a 15.5% win probability on the road.",
    ],
    whyModelThinks: {
      optimism: [
        "80.1st-percentile returning production — real continuity on the field even with a new head coach.",
        "A 9.91-point home-field edge, a real and meaningfully large number for a Week 2 road test.",
        "Essentially neutral transfer portal value (-0.02 z-score) — no real net loss during the transition.",
      ],
      risks: [
        "The coaching change is real: Morgan Scalley's first year as head coach, replacing a two-decade tenure under Kyle Whittingham, carries the same kind of first-year uncertainty as any coaching transition.",
        "Recruiting talent (69th percentile) is solid but not a standout advantage — not a strength to lean on if the coaching transition is rocky.",
      ],
    },
  },
  Vanderbilt: {
    headline: "Vanderbilt: Clark Lea's Program Keeps Climbing, and Arkansas Is a Real Underdog in Week 7",
    oneLiner: "Vanderbilt's continued rise under Clark Lea (#13 Power Score, #11 SP+) means Arkansas travels to Nashville in Week 7 as an underdog by the model's own number.",
    execSummary: [
      "Power Score ranks Vanderbilt #13 nationally (0.107); SP+ is slightly more bullish at #11 (20.3) — both systems now have Vanderbilt solidly inside the top 15, a real shift for a program that wasn't in this range a few years ago.",
      "Clark Lea returns for a continuity season with a 60th-percentile talent base — modest by national standards, but the program's trajectory is real, not a one-year blip.",
      "Arkansas travels to Vanderbilt in Week 7, and the model gives the Razorbacks just a 16.4% win probability on the road.",
    ],
    whyModelThinks: {
      optimism: [
        "Both Power Score (#13) and SP+ (#11) now rank Vanderbilt inside the top 15 nationally — real, model-independent agreement on a program on the rise.",
        "Positive transfer portal net value (+0.39 z-score).",
        "Zero coaching turnover under Clark Lea, now building on a proven system.",
        "A 7.09-point home-field edge, a real and solid number.",
      ],
      risks: [
        "Returning production sits at just the 42nd percentile — real turnover from last year's roster.",
        "Recruiting talent (60th percentile) is modest relative to the SEC's upper tier — the program's ceiling may depend more on development and portal work than a talent-gap advantage.",
      ],
    },
  },
};

// Real, source-cited preseason "notable player" list - from
// CFB Model/cfb_model_pipeline's skill_watchlist.csv (2027 mock draft
// boards) + trenches_watchlist.csv (Walter Camp/Athlon/Phil Steele
// preseason All-America teams, since mock drafts skip O-line/D-line).
// Only ~20 of 138 teams have entries - not comprehensive, same
// graceful-no-op treatment as CFB_TEAM_PROFILES for unlisted teams.
// Auto-derived "who's actually starting" (usage-based) isn't included
// here yet - that needs cfb_qb_watch.py run for real on live 2026 usage
// data, which doesn't exist until games are played.
const CFB_KEY_PLAYERS = {
  'Texas': [
    { name: 'Arch Manning', position: 'QB', note: '2027 mock draft top prospect' },
    { name: 'Trevor Goosby', position: 'OT', note: 'Walter Camp 2026 preseason All-America, 1st team' },
    { name: 'Colin Simmons', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
  ],
  'Oregon': [
    { name: 'Dante Moore', position: 'QB', note: '2027 mock draft top prospect' },
    { name: 'Teitum Tuioti', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
    { name: "A'Mauri Washington", position: 'DL', note: 'Walter Camp 2026 preseason All-America, 2nd team' },
  ],
  'Ohio State': [
    { name: 'Julian Sayin', position: 'QB', note: '2027 mock draft top prospect' },
    { name: 'Jeremiah Smith', position: 'WR', note: '2027 mock draft top prospect' },
    { name: 'Austin Siereveld', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
  ],
  'USC': [{ name: 'Jayden Maiava', position: 'QB', note: '2027 mock draft top prospect' }],
  'Miami': [{ name: 'Darian Mensah', position: 'QB', note: '2027 mock draft top prospect' }],
  'Notre Dame': [
    { name: 'CJ Carr', position: 'QB', note: '2027 mock draft top prospect' },
    { name: 'Anthonie Knapp', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
  ],
  'Oklahoma State': [{ name: 'Drew Mestemaker', position: 'QB', note: '2027 mock draft top prospect' }],
  'Clemson': [{ name: 'T.J. Moore', position: 'WR', note: '2027 mock draft top prospect' }],
  'Virginia Tech': [
    { name: 'Kemari Copeland', position: 'DL', note: '2027 mock draft top prospect' },
    { name: 'Ayden Greene', position: 'WR', note: '2027 mock draft top prospect' },
  ],
  'Virginia': [{ name: 'McKale Boley', position: 'OT', note: '2027 mock draft top prospect' }],
  'Iowa': [
    { name: 'Kade Pieper', position: 'C', note: 'Walter Camp 2026 preseason All-America, 1st team' },
  ],
  'South Carolina': [{ name: 'Dylan Stewart', position: 'DE', note: '2027 mock draft top prospect' }],
  'Indiana': [
    { name: 'Carter Smith', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
    { name: 'Tyrique Tucker', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 1st team' },
  ],
  'Cincinnati': [{ name: 'Evan Tengesdahl', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'Tennessee': [{ name: 'Wendell Moe Jr.', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'LSU': [{ name: 'Jordan Seaton', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'Michigan': [
    { name: 'Andrew Sprague', position: 'OL', note: 'Walter Camp 2026 preseason All-America, 2nd team' },
    { name: 'John Henry Daley', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 2nd team' },
  ],
  'Missouri': [{ name: 'Cayden Green', position: 'OG', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'Minnesota': [{ name: 'Anthony Smith', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'Oklahoma': [{ name: 'David Stone', position: 'DL', note: 'Walter Camp 2026 preseason All-America, 2nd team' }],
  'SMU': [{ name: 'PJ Williams', position: 'OT', note: 'Athlon 4th team / Phil Steele 2nd team OT' }],
  'Louisville': [{ name: 'Clev Lubin', position: 'DL', note: 'Athlon 2026 preseason All-America, 3rd team' }],
};

// Bar narration: reads the SAME contribution numbers already driving the
// Efficiency/Scheme bars and turns the single biggest driver (plus a
// second factor, if it either reinforces or fights the first) into one
// plain sentence. Template-based on real numbers, not hardcoded per team -
// works for any matchup with hasFullModel data.
function buildMatchupNarration(g, efficiencyBars, schemeBars) {
  const allBars = [...efficiencyBars, ...schemeBars];
  const sorted = [...allBars].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const top = sorted[0];
  if (!top || Math.abs(top.value) < 0.05) {
    return `${g.away_team} and ${g.home_team} grade out close across the board here — no single factor is doing much of the work.`;
  }
  const favoredTeam = top.value >= 0 ? g.home_team : g.away_team;
  const otherTeam = top.value >= 0 ? g.away_team : g.home_team;
  const second = sorted[1];
  const secondMatters = second && Math.abs(second.value) >= 0.05;
  const sameSide = secondMatters && Math.sign(second.value) === Math.sign(top.value);
  const oppositeSide = secondMatters && Math.sign(second.value) !== Math.sign(top.value);
  let sentence = `${favoredTeam} leans on ${top.label.toLowerCase()} in this matchup`;
  if (sameSide) sentence += `, backed up by an edge in ${second.label.toLowerCase()} too`;
  else if (oppositeSide) sentence += `, though ${otherTeam} claws some of it back on ${second.label.toLowerCase()}`;
  sentence += '.';
  return sentence;
}

function CFBSWOTQuadrant({ label, sub, items, tone }) {
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

// ----------------------------------------------------------------------
// Section ribbon (2026-08 team-page redesign, per HANDOFF-README.md §1) -
// a notched team-colour ribbon that replaces the old plain uppercase
// section labels. Background is always the active team's real colour via
// teamColor()/TEAM_COLORS - never a hardcoded hex.
// ----------------------------------------------------------------------
function SectionRibbon({ label, note, color }) {
  return (
    <div style={st('display:flex;align-items:center;margin:44px 0 0')}>
      <span style={st(`display:inline-block;background:${color};color:var(--paper);font:900 13px var(--font-sans);letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;padding:9px 34px 9px 40px;white-space:nowrap;clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%)`)}>{label}</span>
      {note ? <span style={st('font:600 13px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-left:16px')}>{note}</span> : null}
    </div>
  );
}

// CFB Team Overview contents rail (README §3.7). Static list, no scrollspy
// (not required for this pass) - first item highlighted statically, same
// as the NFL sibling's rail (§2.4). "Five questions" and "Talent in the
// national field" are both listed in the prototype's rail but neither has
// real data behind it yet on the CFB side (no fiveQuestions section, no
// all-FBS talent distribution) - left out rather than linking to a section
// that doesn't exist, the same treatment the handoff gives the NFL side's
// still-blocked "Talent in the national field" block.
const CFB_TEAM_RAIL_ITEMS = [
  { id: 'where-they-stand', label: 'Where they stand' },
  { id: 'built-from', label: 'What the number is built from' },
  { id: 'the-read', label: 'The read' },
  { id: 'two-systems', label: 'Two systems, one team' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'gauntlet', label: 'The Week gauntlet' },
  { id: 'model-swot', label: 'Model SWOT' },
  { id: 'team-dna', label: 'Team DNA, as it fills in' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'home-field-edge', label: 'Home field edge' },
  { id: 'run-pass-lean', label: 'Run / pass lean' },
  { id: 'power-score-trend', label: 'Power Score trend' },
];
function CFBContentsRail({ color }) {
  return (
    <div style={st('width:212px;flex-shrink:0;border-right:1px solid var(--hairline);background:var(--surface-page)')}>
      <div style={st('padding:20px 20px 10px;font:700 11px var(--font-sans);letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;color:var(--ink-faint)')}>Contents</div>
      {CFB_TEAM_RAIL_ITEMS.map((item, i) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          style={st(i === 0
            ? `display:block;padding:9px 20px;font:700 13px var(--font-sans);color:var(--ink);background:var(--surface-card);border-left:3px solid ${color};text-decoration:none`
            : `display:block;padding:9px 20px 9px 23px;font:600 13px var(--font-sans);color:var(--ink-muted);text-decoration:none`)}
        >{item.label}</a>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------

// Parses a "key:value;key2:value2" CSS text string (as used throughout the
// original .dc.html design) into a React style object, so the design's
// inline style strings can be reused verbatim instead of hand-retranslated.
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
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + n.toFixed(d);
}

// Largest-remainder rounding: rounds `parts` to `decimals` places so they sum
// EXACTLY to `total` rounded to the same precision, instead of each part and
// the total being rounded independently (which can silently drift — classic
// "sum of roundings != rounding of sum"). Used by the rankings sidebar's
// worked example so the Prior/Season lines always add up to the displayed
// Power Score at the displayed precision.
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

function readableTextColor(hex) {
  const h = (hex || '#8C8F93').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0D10' : '#FFFFFF';
}

function oneLinerFor(powerRows, team) {
  const rows = powerRows || [];
  const row = rows.find((r) => r.team === team);
  if (!row || rows.length < 2) return '';
  const pct = (key, higherBetter) => {
    const vals = rows.map((r) => Number(r[key]) || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    if (max === min) return 50;
    const v = Number(row[key]) || 0;
    return (higherBetter ? (v - min) / (max - min) : (max - v) / (max - min)) * 100;
  };
  const offPct = (pct('adj_off_success_rate', true) + pct('adj_off_explosiveness', true)) / 2;
  const defPct = (pct('adj_def_success_rate', false) + pct('adj_def_explosiveness', false) + pct('adj_def_havoc', true)) / 3;
  const diff = offPct - defPct;
  if (diff > 15) return 'Strong on offense, lagging on defense.';
  if (diff < -15) return 'Top-heavy on defense, below-average on offense.';
  return 'Balanced across offense and defense.';
}

function biggestMoverFor(series, metricDefs) {
  if (series.length < 2) return '';
  const last = series[series.length - 1], prev = series[series.length - 2];
  let best = null;
  metricDefs.forEach((m) => {
    const diff = (Number(last[m.key]) || 0) - (Number(prev[m.key]) || 0);
    const absDiff = Math.abs(diff);
    if (!best || absDiff > best.absDiff) {
      const improving = m.higherBetter ? diff >= 0 : diff <= 0;
      best = { absDiff, diff, label: m.shortLabel || m.label, direction: improving ? 'improving' : 'declining', decimals: m.decimals ?? 3 };
    }
  });
  if (!best) return '';
  return `${best.label} ${best.direction} fastest: ${signed(best.diff, best.decimals)}/week`;
}

function buildIndexChart(series, metricDefs, maxW, minW, chartH, chartKey, setChartHover, clearChartHover) {
  const padL = 16, padR = 16, padT = 16, padB = 34;
  const n = series.length;
  const spacing = 90;
  const chartW = Math.min(maxW, Math.max(minW, padL + padR + Math.max(n - 1, 1) * spacing));
  const innerH = chartH - padT - padB;
  const stepX = n > 1 ? (chartW - padL - padR) / (n - 1) : 0;
  const DASH_PATTERNS = ['', '7 5', '2 4'];
  const lines = metricDefs.map((m, mi) => {
    const vals = series.map((s) => Number(s[m.key]) || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = (max - min) || 0.0001;
    const dots = series.map((s, i) => {
      const v = Number(s[m.key]) || 0;
      const goodness = m.higherBetter ? (v - min) / range : (max - v) / range;
      const cx = padL + i * stepX, cy = padT + (1 - goodness) * innerH;
      const weekLabel = `Wk ${s.week}`, valueLabel = num(v, m.decimals ?? 3);
      const leftPct = (cx / chartW) * 100, topPct = (cy / chartH) * 100;
      const tipText = `${weekLabel} (${s.date}) — ${m.shortLabel || m.label}: ${valueLabel}`;
      return {
        cx, cy, date: s.date, weekLabel, valueLabel,
        onEnter: chartKey ? () => setChartHover(chartKey, leftPct, topPct, tipText) : undefined,
        onLeave: chartKey ? () => clearChartHover() : undefined,
      };
    });
    const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.cx},${d.cy}`).join(' ');
    const latest = n ? Number(series[n - 1][m.key]) : null;
    return { key: m.key, label: m.label, shortLabel: m.shortLabel || m.label, color: m.color, dash: DASH_PATTERNS[mi % DASH_PATTERNS.length], path, dots, latestLabel: latest != null ? num(latest, m.decimals ?? 3) : '—' };
  });
  return {
    lines, chartW, chartH, padL, padT,
    axisTopStyle: `position:absolute;left:0;top:${padT - 6}px;font:600 10px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)`,
    axisBottomStyle: `position:absolute;left:0;top:${innerH + padT - 4}px;font:600 10px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)`,
  };
}

// ----------------------------------------------------------------------
// DataTable (ported verbatim from the design system's DataTable.jsx)
// ----------------------------------------------------------------------
// Visual walk-through of the CFB Power Score formula for the Power Rankings
// tab's second column. Unlike the NFL model's fixed 45/35/20 split, CFB blends
// two ingredients on a shifting weekly weight, and its rating isn't already in
// points, so this reads scale/home_edge/last_calibrated live from marginFit
// (assets/data/cfb-data.json's margin_fit, refreshed by refresh_cfb_data.py)
// rather than hardcoding a number that goes stale the next time the model is
// recalibrated.
function CFBPowerScoreWalkthrough({ team, rating, gamesPlayed, scale, homeEdge, lastCalibrated, priorRating, priorWeight: priorWeightProp, seasonRating, seasonWeight: seasonWeightProp }) {
  const SHRINKAGE_K = 8;
  const seasonWeight = seasonWeightProp != null ? seasonWeightProp : (gamesPlayed != null ? gamesPlayed / (gamesPlayed + SHRINKAGE_K) : null);
  const priorWeight = priorWeightProp != null ? priorWeightProp : (seasonWeight != null ? 1 - seasonWeight : null);
  const scaledPoints = (rating != null && scale != null) ? rating * scale : null;
  // The two weighted parts must sum EXACTLY to the displayed Power Score at
  // 3dp — same rounding pattern (roundPartsToTotal) that keeps the table's
  // two-lane bar consistent with the number it's drawn next to.
  const hasParts = priorRating != null && seasonRating != null && priorWeight != null && seasonWeight != null && rating != null;
  const rawParts = hasParts ? [priorWeight * priorRating, seasonWeight * seasonRating] : null;
  const roundedParts = rawParts ? roundPartsToTotal(rawParts, rating, 3) : null;
  return (
    <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:20px')}>
      <div>
        <div style={st('font:700 13px var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:14px')}>How Power Score Is Built</div>
        <div style={st('display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;align-content:flex-start;font:900 19px/1.25 var(--font-sans);color:var(--ink)')}>
          <span style={{ color: 'var(--steel)' }}>Preseason Prior</span>
          <span style={{ color: 'var(--ink-faint)' }}>+</span>
          <span style={{ color: 'var(--brass)' }}>This Season's Efficiency</span>
          <span style={{ color: 'var(--ink-faint)' }}>=</span>
          <span>Power Score</span>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:14px')}>
        <div style={st('display:flex;gap:10px;align-items:flex-start')}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--steel)', marginTop: 6, flexShrink: 0 }} />
          <div>
            <div style={st('font:700 14px var(--font-sans);color:var(--ink)')}>Preseason Prior</div>
            <div style={st('font:400 13px/1.5 var(--font-sans);color:var(--ink-muted)')}>Personnel (talent, returning starters, transfer portal), coaching stability, and a coaching-performance history signal, checked against last season's real SP+ rating.</div>
          </div>
        </div>
        <div style={st('display:flex;gap:10px;align-items:flex-start')}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--brass)', marginTop: 6, flexShrink: 0 }} />
          <div>
            <div style={st('font:700 14px var(--font-sans);color:var(--ink)')}>This Season's Efficiency</div>
            <div style={st('font:400 13px/1.5 var(--font-sans);color:var(--ink-muted)')}>Opponent-adjusted success rate (mostly) and explosiveness (a little), tracked separately for offense, defense, run, and pass.</div>
          </div>
        </div>
      </div>

      {seasonWeight != null && (
        <div style={st('background:var(--surface-page);border-radius:var(--radius-sm);padding:14px 16px;font:400 13px/1.5 var(--font-sans);color:var(--ink-muted)')}>
          The blend shifts weekly: games played &divide; (games played + 8). {team ? `${team} has` : 'This team has'} played {gamesPlayed} game{gamesPlayed === 1 ? '' : 's'}, so its rating is currently <b style={st('color:var(--ink)')}>{Math.round(priorWeight * 100)}% preseason prior</b> and <b style={st('color:var(--ink)')}>{Math.round(seasonWeight * 100)}% real 2026 results</b>.
        </div>
      )}

      {team && roundedParts && (
        <div style={st('border-top:1px solid var(--hairline);padding-top:18px;display:flex;flex-direction:column;gap:8px')}>
          <div style={st('font:700 13px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px')}>Worked example: {team}</div>
          <div style={st('display:flex;justify-content:space-between;gap:12px;font:500 14px var(--font-sans);color:var(--ink)')}>
            <span>Prior ({num(priorRating, 3)}) &times; {Math.round(priorWeight * 100)}%</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{signed(roundedParts[0], 3)}</span>
          </div>
          <div style={st('display:flex;justify-content:space-between;gap:12px;font:500 14px var(--font-sans);color:var(--ink)')}>
            <span>Season ({num(seasonRating, 3)}) &times; {Math.round(seasonWeight * 100)}%</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{signed(roundedParts[1], 3)}</span>
          </div>
          <div style={st('display:flex;justify-content:space-between;gap:12px;font:700 15px var(--font-sans);color:var(--ink);border-top:1px solid var(--hairline);padding-top:8px;margin-top:4px')}>
            <span>Power Score</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{signed(rating, 3)}</span>
          </div>
          {scale != null && (
            <div style={st('font:400 13px/1.5 var(--font-sans);color:var(--ink-muted)')}>Roughly {Math.abs(Math.round(scaledPoints))} points {scaledPoints >= 0 ? 'better' : 'worse'} than the model's league-average team, before either team's own home-field edge is added.</div>
          )}
        </div>
      )}

      {scale != null && (
        <div style={st('background:var(--surface-page);border-radius:var(--radius-sm);padding:16px 18px;font:400 13px/1.55 var(--font-sans);color:var(--ink-muted)')}>
          <span style={st('color:var(--ink);font-weight:700')}>The scale isn&rsquo;t fixed for the season.</span> That &times;{num(scale, 0)} conversion factor was last recalibrated {lastCalibrated || 'recently'}, off three completed seasons of real results. It gets re-evaluated whenever the model is recalibrated, not on a set schedule, so today&rsquo;s number is &ldquo;as of {lastCalibrated || 'today'},&rdquo; not a season-long constant. Home-field edge is also team-specific elsewhere on the site, not the single flat number this simplified example leaves out.
        </div>
      )}
    </div>
  );
}

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

// Two-lane diverging blend bar (Power Rankings table, Power Score column).
// Fixed lanes — prior on top, season below — so the color order never flips
// and each lane's side of the shared center line reads as its sign. Lane
// width doubles as the weekly blend weight: early season the steel lane
// dominates every row, and the brass lane grows week over week.
function TwoLaneBar({ segs, width = 88, height = 15 }) {
  return (
    <div style={{ width, height, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'var(--hairline)', left: '50%' }} />
      {segs.map((seg, i) => (
        <div key={i} style={{ position: 'absolute', height: seg.height, top: seg.top, left: seg.left, width: seg.width, background: seg.color }} />
      ))}
    </div>
  );
}

// Power Rankings table (Direction 1A handoff) — a bespoke fixed-column-width
// grid, not the generic DataTable: every column has an exact pixel width and
// its own padding/alignment, and the ungrouped table wraps a sticky header +
// scrolling body + sticky legend footer in one flex column so it can be
// stretched to exactly match the sidebar's height. `scroll` selects that
// three-part flex layout; conference-grouped tables render as a plain
// header+rows block instead (no internal scroll, no legend — with a table
// per conference, that would be redundant).
function RankingsTable({ columns, rows, scroll }) {
  const gridCols = columns.map((c) => c.width).join(' ');
  const header = (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, background: 'var(--surface-dark)', flexShrink: 0 }}>
      {columns.map((c) => (
        <div key={c.key} style={st(`padding:${c.headerPad};color:var(--text-inverse);font-weight:700;font-size:12px;letter-spacing:${c.headerTracking};text-transform:uppercase;text-align:${c.headerAlign}`)}>
          {c.label}
        </div>
      ))}
    </div>
  );
  const body = rows.map((r, ri) => (
    <div key={r.team} style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center', background: r.isPinned ? '#FBF3E0' : (ri % 2 ? 'var(--surface-page)' : 'var(--surface-card)'), borderBottom: '1px solid var(--hairline)' }}>
      {columns.map((c) => <React.Fragment key={c.key}>{c.render(r)}</React.Fragment>)}
    </div>
  ));

  if (!scroll) {
    return (
      <div style={st('border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card)')}>
        {header}
        {body}
      </div>
    );
  }

  return (
    <div style={st('display:flex;flex-direction:column;min-width:0;border-radius:var(--radius-md);box-shadow:var(--shadow-card);overflow:hidden')}>
      {header}
      <div className="rankings-table-scroll-body" style={st('flex:1;min-height:0;overflow:auto;background:var(--surface-card)')} tabIndex="0" aria-label="Power rankings table, scrollable">{body}</div>
      <div style={st('flex-shrink:0;background:var(--surface-card);border-top:1px solid var(--hairline);padding:10px 20px;display:flex;align-items:center;gap:18px;flex-wrap:wrap')}>
        <span style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint)')}>Bar</span>
        <span style={st('display:flex;align-items:center;gap:7px')}><span style={{ width: 12, height: 10, background: 'var(--steel)', display: 'inline-block' }} /><span style={st('font:600 13px var(--font-sans);color:var(--ink-muted)')}>Preseason prior</span></span>
        <span style={st('display:flex;align-items:center;gap:7px')}><span style={{ width: 12, height: 10, background: 'var(--brass)', display: 'inline-block' }} /><span style={st('font:600 13px var(--font-sans);color:var(--ink-muted)')}>This season</span></span>
        <span style={st('font:400 13px var(--font-sans);color:var(--ink-faint)')}>Lane width is the blended weight. Left of centre is negative.</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// App
// ----------------------------------------------------------------------
const DEFAULT_PINNED_TEAM = 'Arkansas';
const PINNED_ACCENT = 'brass'; // 'brass' | 'steel'
const TOP_N = 25;

function App() {
  // Deep-linkable team profile: read ?tab=&team= once on load so a URL like
  // cfb-model/index.html?tab=team&team=Ohio+State opens straight to that
  // team's profile - the "no shareable URL" gap the design-system audit
  // flagged. Falls back to the normal defaults if either param is absent
  // or the team name doesn't match anything (validated for real once
  // `teams` loads, same as any other selectedTeam value).
  function readURLState() {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const teamParam = params.get('team');
      return {
        tab: tabParam || 'rankings',
        selectedTeam: teamParam ? decodeURIComponent(teamParam) : DEFAULT_PINNED_TEAM,
      };
    } catch (e) {
      return { tab: 'rankings', selectedTeam: DEFAULT_PINNED_TEAM };
    }
  }
  const initialURLState = readURLState();

  const [s, setStateRaw] = useState({
    chartHover: null,
    tab: initialURLState.tab,
    powerRows: [],
    matchupRows: [],
    historyRows: [],
    sortKey: 'POWER_RATING_SHRUNK',
    sortDir: 'desc',
    expandedMatchup: null,
    selectedTeam: initialURLState.selectedTeam,
    pinnedTeam: DEFAULT_PINNED_TEAM,
    groupByConference: false,
    showAllRankings: false,
    weekInput: '',
    availableWeeks: [],
    matchupWeek: null,
    matchupByWeek: {},
    teamSchedule: {},
    generatedAt: null,
    loaded: false,
    pipelineError: null,
  });
  function setState(update) {
    setStateRaw((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  }

  // Static-site version: data is a pre-generated snapshot (assets/data/cfb-data.json),
  // built locally by the pipeline and redeployed — no live /api/data or /api/run-pipeline
  // server on this site. Re-run the pipeline locally and redeploy to refresh.
  async function loadData() {
    try {
      // Cache-bust with a timestamp query param + no-store, so a fresh
      // data push shows up on reload instead of getting served a stale
      // copy from Netlify's CDN or the browser's own HTTP cache (bug
      // Anna hit 2026-08-06 - had to hard-refresh to see a pipeline update).
      const res = await fetch(`../assets/data/cfb-data.json?v=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      const weeks = data.available_weeks || [];
      const latestWeek = weeks.length ? weeks[weeks.length - 1] : null;
      // Default the Matchup Breakdown tab to the next week that hasn't been
      // played yet, not the latest snapshot week - a matchup preview should
      // open on what's coming up, not automatically jump to Week 15 just
      // because that's the last week with a generated prediction file
      // (found by Anna 2026-08-20: right now every game is unplayed, so
      // this correctly resolves to Week 1). Built from team_schedule's real
      // per-game dates rather than the matchup files themselves, which
      // don't carry a date field. Falls back to latestWeek if we can't
      // find a real "next" week (e.g. every scheduled game has already
      // happened, or no schedule data loaded).
      const todayISO = new Date().toISOString().slice(0, 10);
      const weekMinDate = {};
      Object.values(data.team_schedule || {}).forEach((games) => {
        (games || []).forEach((g) => {
          if (g.week == null || !g.date) return;
          const d = g.date.slice(0, 10);
          if (weekMinDate[g.week] == null || d < weekMinDate[g.week]) weekMinDate[g.week] = d;
        });
      });
      const nextWeek = weeks.find((w) => weekMinDate[w] != null && weekMinDate[w] >= todayISO);
      const defaultWeek = nextWeek != null ? nextWeek : latestWeek;
      setState({
        powerRows: data.power || [],
        historyRows: data.history || [],
        matchupByWeek: data.matchup_by_week || {},
        teamSchedule: data.team_schedule || {},
        matchupRows: defaultWeek != null ? (data.matchup_by_week || {})[String(defaultWeek)] || [] : [],
        availableWeeks: weeks,
        matchupWeek: defaultWeek,
        weekInput: defaultWeek != null ? String(defaultWeek) : '',
        generatedAt: data.generated_at || null,
        marginFit: data.margin_fit || null,
        loaded: true,
      });
    } catch (e) {
      setState({ loaded: true, pipelineError: `Couldn't load data: ${e.message || e}` });
    }
  }

  useEffect(() => { loadData(); }, []);

  function selectWeek(weekStr) {
    const week = parseInt(weekStr, 10);
    const rows = s.matchupByWeek[String(week)] || [];
    setState({ weekInput: weekStr, matchupWeek: week, matchupRows: rows });
  }

  function setChartHover(chart, leftPct, topPct, text) {
    setState({ chartHover: { chart, leftPct, topPct, text } });
  }
  function clearChartHover() {
    setState({ chartHover: null });
  }

  const pinnedAccentColor = PINNED_ACCENT === 'steel' ? 'var(--accent-primary)' : 'var(--brass)';
  const topN = TOP_N;
  const { powerRows, matchupRows, historyRows, tab, sortKey, sortDir, expandedMatchup, selectedTeam, pinnedTeam, teamSchedule, marginFit } = s;

  // Keep the URL in sync with tab/team so the current view is always
  // bookmarkable/shareable (replaceState, not pushState - this shouldn't
  // spam the back button every time someone picks a different team).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (tab && tab !== 'rankings') params.set('tab', tab); else params.delete('tab');
      if (tab === 'team' && selectedTeam) params.set('team', selectedTeam); else params.delete('team');
      const query = params.toString();
      const newURL = window.location.pathname + (query ? `?${query}` : '');
      window.history.replaceState(null, '', newURL);
    } catch (e) { /* no-op if history API is unavailable */ }
  }, [tab, selectedTeam]);

  const togglePin = (team) => setState((prev) => {
    const willPin = prev.pinnedTeam !== team;
    return { pinnedTeam: willPin ? team : null, selectedTeam: willPin ? team : prev.selectedTeam };
  });
  const toggleGroupByConference = () => setState((prev) => ({ groupByConference: !prev.groupByConference }));

  const TAB_DEFS = [
    { id: 'rankings', label: 'Season Power Rankings', tone: 'var(--ink)', textOn: 'var(--paper)' },
    { id: 'matchup', label: 'Matchup Breakdown', tone: 'var(--accent-primary)', textOn: 'var(--paper)' },
    { id: 'team', label: 'Team Overview', tone: 'var(--brass)', textOn: 'var(--ink)' },
    { id: 'glossary', label: 'Glossary', tone: 'var(--steel)', textOn: 'var(--paper)' },
  ];
  const tabsList = TAB_DEFS.map((t) => {
    const active = tab === t.id;
    return {
      id: t.id, label: t.label,
      style: `padding:14px 18px;background:${active ? t.tone : 'none'};border:none;border-radius:8px 8px 0 0;font:700 13px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;color:${active ? t.textOn : 'var(--ink-muted)'};border-bottom:3px solid ${active ? 'var(--paper)' : 'transparent'};margin-bottom:-1px;transition:background .15s`,
      onClick: () => setState({ tab: t.id }),
    };
  });

  const powerSorted = [...(powerRows || [])].sort((a, b) => (Number(b.POWER_RATING_SHRUNK) || 0) - (Number(a.POWER_RATING_SHRUNK) || 0));
  const pinnedIdx = pinnedTeam ? powerSorted.findIndex((r) => r.team === pinnedTeam) : -1;
  const pinnedRailFound = pinnedIdx !== -1;
  const pinnedRow = pinnedRailFound ? powerSorted[pinnedIdx] : null;
  const noPinnedTeam = !pinnedTeam;
  const pinnedNotInData = !!pinnedTeam && !pinnedRailFound;

  const rankRows = powerSorted.map((r, i) => ({ ...r, rank: i + 1, isPinned: r.team === pinnedTeam }));

  const SORT_FIELDS = [
    { key: 'POWER_RATING_SHRUNK', label: 'Rating' },
    { key: 'team', label: 'Team' },
    { key: 'conference', label: 'Conference' },
    { key: 'games_played', label: 'Record' },
    { key: 'SP_PLUS', label: 'SP+' },
  ];
  const sortPills = SORT_FIELDS.map((f) => ({
    key: f.key, label: f.label,
    arrow: sortKey === f.key ? (sortDir === 'asc' ? '▲' : '▼') : '',
    style: `padding:6px 14px;border-radius:999px;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid ${sortKey === f.key ? 'var(--ink)' : 'var(--hairline)'};background:${sortKey === f.key ? 'var(--ink)' : 'transparent'};color:${sortKey === f.key ? 'var(--paper)' : 'var(--ink-muted)'}`,
    onClick: () => {
      if (s.sortKey === f.key) setState({ sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' });
      else setState({ sortKey: f.key, sortDir: 'desc' });
    },
  }));

  const tableSorted = [...rankRows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });
  let tableDisplayRows = tableSorted;
  if (!s.showAllRankings && tableSorted.length > topN) {
    tableDisplayRows = tableSorted.slice(0, topN);
    if (!tableDisplayRows.some((r) => r.isPinned)) {
      const pinnedFull = tableSorted.find((r) => r.isPinned);
      if (pinnedFull) tableDisplayRows = [...tableDisplayRows, pinnedFull];
    }
  }

  // ---------------- Two-lane blend bar (Power Rankings Row 3) ----------------
  // The two weighted rating-scale components that sum to POWER_RATING_SHRUNK.
  // `priorRating` is the prior ON THE RATING SCALE (not prior_z, which is a
  // z-score used only in the table's Prior column) — derived exactly from the
  // shrunk rating rather than assuming a rescale factor, per the handoff.
  const SHRINKAGE_K = 8;
  function cfbRowParts(r) {
    const gp = Number(r.games_played) || 0;
    const seasonWeight = gp / (gp + SHRINKAGE_K);
    const priorWeight = 1 - seasonWeight;
    const shrunk = Number(r.POWER_RATING_SHRUNK) || 0;
    const seasonRating = r.POWER_RATING != null ? Number(r.POWER_RATING) : 0;
    const priorRating = priorWeight > 0 ? (shrunk - seasonWeight * seasonRating) / priorWeight : shrunk;
    return {
      seasonWeight, priorWeight, priorRating, seasonRating,
      priorPart: priorWeight * priorRating,
      seasonPart: seasonWeight * seasonRating,
    };
  }
  // Largest same-sign weighted stack across the whole field — NOT the max
  // absolute POWER_RATING_SHRUNK (globalScaleMax's old job), since a team
  // whose two parts have opposite signs can have a same-sign stack bigger
  // than its net rating. Using the net rating here would let a lane overflow
  // the row.
  const segUnits = Math.max(0.001, ...rankRows.map((r) => {
    const { priorPart, seasonPart } = cfbRowParts(r);
    const up = Math.max(0, priorPart) + Math.max(0, seasonPart);
    const down = Math.abs(Math.min(0, priorPart)) + Math.abs(Math.min(0, seasonPart));
    return Math.max(up, down);
  }));
  function rankRowSegs(r) {
    const { priorPart, seasonPart } = cfbRowParts(r);
    const segs = [];
    [[priorPart, '0%', 'var(--steel)'], [seasonPart, '58%', 'var(--brass)']].forEach(([value, top, color]) => {
      const width = Math.min(50, (Math.abs(value) / segUnits) * 50);
      if (width < 0.4) return;
      segs.push({ top, height: '42%', left: (value >= 0 ? 50 : 50 - width) + '%', width: width + '%', color });
    });
    return segs;
  }

  // ---------------- SP+ Δ (Power Rankings Row 3) ----------------
  // spRank = the team's rank when the field is sorted by SP_PLUS descending,
  // computed once here rather than trusting a rank column from the CSV. Teams
  // missing SP_PLUS are excluded from the ranking (not just given a '—' gap)
  // so they don't shift everyone else's spRank.
  const spRankable = [...rankRows]
    .filter((r) => r.SP_PLUS !== null && r.SP_PLUS !== undefined && !Number.isNaN(Number(r.SP_PLUS)))
    .sort((a, b) => (Number(b.SP_PLUS) || 0) - (Number(a.SP_PLUS) || 0));
  const spRankByTeam = {};
  spRankable.forEach((r, i) => { spRankByTeam[r.team] = i + 1; });

  // ---------------- Tier chip (Power Rankings Team column) ----------------
  // 135+ teams and no logos: a Power-4 / Group-of-5 / Independent chip says
  // more than arbitrary team colors, and TEAM_COLORS doesn't cover every FBS
  // team anyway (most Group-of-5 programs fall back to the same gray).
  const P4_CONFERENCES = new Set(['SEC', 'Big Ten', 'Big 12', 'ACC']);
  function tierChipColor(conference) {
    if (!conference) return 'var(--neutral-tan)';
    if (P4_CONFERENCES.has(conference)) return 'var(--ink)';
    if (conference === 'FBS Independents') return 'var(--neutral-tan)';
    return 'var(--steel)';
  }

  const rankColumns = [
    {
      key: 'team', width: '186px', label: 'Team', headerPad: '13px 20px', headerAlign: 'left', headerTracking: '.09em',
      render: (r) => (
        <div key="team" style={st('padding:9px 20px;display:flex;align-items:center;gap:10px;min-width:0')} title={r.team}>
          <div aria-hidden="true" style={{ width: 4, height: 20, borderRadius: 2, flexShrink: 0, background: tierChipColor(r.conference) }} />
          <span style={st('font:600 17px var(--font-sans);color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{`${r.rank}. ${r.team}`}</span>
        </div>
      ),
    },
    {
      key: 'POWER_RATING_SHRUNK', width: '152px', label: 'Power Score', headerPad: '13px 16px', headerAlign: 'right', headerTracking: '.09em',
      render: (r) => (
        <div key="POWER_RATING_SHRUNK" style={st('padding:9px 16px;display:flex;align-items:center;justify-content:flex-end;gap:12px')}>
          <span style={st('font:600 17px var(--font-sans);color:var(--ink);font-variant-numeric:tabular-nums;min-width:46px;text-align:right')}>{num(r.POWER_RATING_SHRUNK, 3)}</span>
          <TwoLaneBar segs={rankRowSegs(r)} />
        </div>
      ),
    },
    {
      key: 'prior_z', width: '60px', label: 'Prior', headerPad: '13px 10px', headerAlign: 'right', headerTracking: '.06em',
      render: (r) => <div key="prior_z" style={st('padding:9px 10px;font:400 16px var(--font-sans);color:var(--ink);text-align:right;font-variant-numeric:tabular-nums')}>{r.prior_z == null ? '—' : signed(r.prior_z, 2)}</div>,
    },
    {
      key: 'this_season', width: '70px', label: 'Season', headerPad: '13px 10px', headerAlign: 'right', headerTracking: '.06em',
      render: (r) => {
        const gp = Number(r.games_played) || 0;
        const text = (gp === 0 || r.POWER_RATING == null) ? '—' : signed(Number(r.POWER_RATING) * (marginFit ? Number(marginFit.scale) : 1), marginFit ? 1 : 3);
        return <div key="this_season" style={st('padding:9px 10px;font:400 16px var(--font-sans);color:var(--ink);text-align:right;font-variant-numeric:tabular-nums')}>{text}</div>;
      },
    },
    {
      key: 'conference', width: 'minmax(0,1fr)', label: 'Conference', headerPad: '13px 14px', headerAlign: 'right', headerTracking: '.09em',
      render: (r) => <div key="conference" style={st('padding:9px 14px;font:400 15px var(--font-sans);color:var(--ink-muted);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')} title={r.conference || ''}>{r.conference || '—'}</div>,
    },
    {
      key: 'games_played', width: '56px', label: 'Rec', headerPad: '13px 10px', headerAlign: 'right', headerTracking: '.06em',
      render: (r) => <div key="games_played" style={st('padding:9px 10px;font:400 16px var(--font-sans);color:var(--ink);text-align:right;font-variant-numeric:tabular-nums')}>{r.record || '0-0'}</div>,
    },
    {
      key: 'SP_PLUS', width: '54px', label: 'SP+', headerPad: '13px 10px', headerAlign: 'right', headerTracking: '.06em',
      render: (r) => <div key="SP_PLUS" style={st('padding:9px 10px;font:400 16px var(--font-sans);color:var(--ink);text-align:right;font-variant-numeric:tabular-nums')}>{num(r.SP_PLUS, 1)}</div>,
    },
    {
      key: 'sp_gap', width: '64px', label: 'SP+ Δ', headerPad: '13px 8px', headerAlign: 'right', headerTracking: '.04em',
      render: (r) => {
        const spRank = spRankByTeam[r.team];
        const gap = spRank != null ? spRank - r.rank : null;
        const gapText = gap == null ? '—' : (gap === 0 ? '—' : signed(gap, 0));
        const gapColor = gap == null ? 'var(--ink-faint)' : (Math.abs(gap) > 15 ? 'var(--brass)' : (Math.abs(gap) > 5 ? 'var(--steel)' : 'var(--ink-faint)'));
        return <div key="sp_gap" style={st(`padding:9px 8px;font:600 15px var(--font-sans);text-align:right;font-variant-numeric:tabular-nums;color:${gapColor}`)}>{gapText}</div>;
      },
    },
    {
      key: 'pin', width: '48px', label: 'Pin', headerPad: '13px 10px', headerAlign: 'center', headerTracking: '.06em',
      render: (r) => {
        const isPinned = r.isPinned;
        return (
          <div key="pin" style={st('padding:9px 10px;text-align:center')}>
            <button
              onClick={() => togglePin(r.team)}
              title={isPinned ? `Unpin ${r.team}` : `Pin ${r.team}`}
              aria-label={isPinned ? `Unpin ${r.team}` : `Pin ${r.team}`}
              aria-pressed={isPinned}
              style={st('background:none;border:none;cursor:pointer;padding:2px;display:inline-flex')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ color: isPinned ? pinnedAccentColor : 'var(--ink-faint)' }}>
                <path d="M12 2.5l2.99 6.06 6.69.97-4.84 4.72 1.14 6.66L12 17.77l-5.98 3.14 1.14-6.66-4.84-4.72 6.69-.97z" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ];
  const rankColumnsGrouped = rankColumns.filter((c) => c.key !== 'conference');

  // ---------------- Group by Conference (Power Rankings) ----------------
  // Uses the full rankRows, not the topN-truncated display rows — grouped
  // view was never subject to the top-N cut.
  const CONFERENCE_ORDER = [...new Set(rankRows.map((r) => r.conference).filter(Boolean))].sort();
  const groupedByConference = CONFERENCE_ORDER
    .map((conference) => ({
      conference,
      rows: rankRows.filter((r) => r.conference === conference).sort((a, b) => (Number(b.POWER_RATING_SHRUNK) || 0) - (Number(a.POWER_RATING_SHRUNK) || 0)),
    }))
    .filter((g) => g.rows.length);

  // ---------------- Reading-the-scale strip chart (Power Rankings Row 1) ----------------
  const teamCount = rankRows.length;
  const cfbScores = rankRows.map((r) => Number(r.POWER_RATING_SHRUNK) || 0);
  const stripLo = Math.floor((cfbScores.length ? Math.min(...cfbScores) : -0.1) * 20) / 20 - 0.01;
  const stripHi = Math.ceil((cfbScores.length ? Math.max(...cfbScores) : 0.1) * 20) / 20 + 0.01;
  const stripSpan = Math.max(0.001, stripHi - stripLo);
  const stripPos = (v) => ((v - stripLo) / stripSpan) * 100;
  const stripZeroPct = stripPos(0) + '%';
  const stripStrongest = rankRows[0] || null;
  const stripWeakest = rankRows.length ? rankRows[rankRows.length - 1] : null;
  const stripRangeLabel = stripStrongest && stripWeakest
    ? `${stripStrongest.team} ${signed(stripStrongest.POWER_RATING_SHRUNK, 3)} to ${stripWeakest.team} ${signed(stripWeakest.POWER_RATING_SHRUNK, 3)}`
    : '—';
  const stripPinnedRow = pinnedTeam ? rankRows.find((r) => r.team === pinnedTeam) : null;
  const stripTicks = rankRows.map((r) => {
    const rating = Number(r.POWER_RATING_SHRUNK) || 0;
    const isPinnedTick = stripPinnedRow && r.team === stripPinnedRow.team;
    return {
      team: r.team,
      isPinnedTick,
      style: isPinnedTick
        ? st(`position:absolute;top:14px;height:44px;width:3px;border-radius:2px;background:var(--ink);left:${stripPos(rating)}%`)
        : st(`position:absolute;top:22px;height:30px;width:2px;border-radius:1px;opacity:.5;background:${rating >= 0 ? 'var(--value-positive)' : 'var(--value-risk)'};left:${stripPos(rating)}%`),
    };
  });
  const aboveAvgCount = rankRows.filter((r) => (Number(r.POWER_RATING_SHRUNK) || 0) >= 0).length;
  let stripCaption = rankRows.length
    ? `${aboveAvgCount} of ${teamCount} teams sit above average`
    : 'Power ratings haven’t loaded yet';
  const topClusterN = Math.min(25, rankRows.length);
  if (topClusterN >= 2) {
    const clusterSpread = Number((Number(rankRows[0].POWER_RATING_SHRUNK) - Number(rankRows[topClusterN - 1].POWER_RATING_SHRUNK)).toFixed(3));
    stripCaption += `, and the top ${topClusterN} are packed inside ${clusterSpread.toFixed(3)} rating points of each other`;
  }
  stripCaption += '.';

  // ---------------- Power Score walkthrough (Power Rankings visual panel) ----------------
  // Uses the pinned team (Arkansas by default) so the worked example always
  // reflects real, current data instead of a hardcoded team.
  const walkthroughRow = pinnedRow || rankRows[0] || null;
  const walkthroughParts = walkthroughRow ? cfbRowParts(walkthroughRow) : null;

  // Run/Pass bars below show a single *net* edge (home offense-vs-away-
  // defense minus away offense-vs-home-defense). Anna's catch (2026-08-06):
  // that net can't tell a genuine stalemate (both teams mediocre at
  // running/passing) apart from a shootout (both teams strong on offense
  // AND leaky on defense, so the two big edges just cancel out). These
  // percentile lookups expose the two ingredients behind the net so that
  // distinction is visible without adding a permanent second bar per stat.
  const powerByTeam = Object.fromEntries((powerRows || []).map((r) => [r.team, r]));
  const fieldValues = (field) => (powerRows || []).map((r) => Number(r[field]));
  const rushOffPool = fieldValues('adj_off_rush_success');
  const rushDefPool = fieldValues('adj_def_rush_success');
  const passOffPool = fieldValues('adj_off_pass_success');
  const passDefPool = fieldValues('adj_def_pass_success');
  // Defense stats are "success rate allowed" - low is good - so invert the
  // raw percentile the same way dnaPctInverted() does elsewhere in this
  // file, keeping "higher percentile = better" consistent across the page.
  const defGoodPctl = (pool, raw) => {
    const p = percentileRank(pool, raw);
    return p === null ? null : 100 - p;
  };
  const sideDetail = (offField, defField, offPool, defPool) => (offTeam, defTeam) => {
    const offRow = powerByTeam[offTeam];
    const defRow = powerByTeam[defTeam];
    if (!offRow || !defRow) return null;
    const offPctl = percentileRank(offPool, Number(offRow[offField]));
    const defPctl = defGoodPctl(defPool, Number(defRow[defField]));
    if (offPctl === null || defPctl === null) return null;
    return { offPctl, defPctl };
  };
  const rushSide = sideDetail('adj_off_rush_success', 'adj_def_rush_success', rushOffPool, rushDefPool);
  const passSide = sideDetail('adj_off_pass_success', 'adj_def_pass_success', passOffPool, passDefPool);
  // "Live matchup" flag: both directions pair a strong offense (>=60th
  // percentile) against a leaky defense (<=40th percentile allowed-success),
  // regardless of which team the net favors - this is the shootout case
  // that a net-only bar hides.
  const bothSidesLoaded = (side) => !!side && side.offPctl >= 60 && side.defPctl <= 40;

  const matchupsWithFlags = (matchupRows || []).map((g, i) => ({ ...g, _isPinnedGame: g.home_team === pinnedTeam || g.away_team === pinnedTeam, _origIdx: i }));
  const matchupSorted = [...matchupsWithFlags].sort((a, b) => {
    if (a._isPinnedGame !== b._isPinnedGame) return a._isPinnedGame ? -1 : 1;
    return Math.abs(b.model_edge || 0) - Math.abs(a.model_edge || 0);
  });
  const matchupList = matchupSorted.map((g) => {
    const key = `${g.home_team}-${g.away_team}-${g._origIdx}`;
    const expanded = expandedMatchup === key;
    const edgeVal = g.model_edge;
    const edgeColor = edgeVal > 0 ? 'var(--value-positive)' : edgeVal < 0 ? 'var(--value-risk)' : 'var(--ink-muted)';
    const maxAbs = Math.max(Math.abs(g.success_contribution || 0), Math.abs(g.explosive_contribution || 0), Math.abs(g.havoc_contribution || 0), Math.abs(g.rush_contribution || 0), Math.abs(g.pass_contribution || 0), 1);
    const homeColor = teamColor(g.home_team);
    const awayColor = teamColor(g.away_team);
    const makeBar = (b) => {
      const positive = b.value >= 0;
      const pct = Math.min(50, (Math.abs(b.value) / maxAbs) * 50);
      return {
        ...b, valueLabel: signed(b.value, 1),
        barWrapStyle: 'flex:1;height:12px;position:relative;background:var(--hairline);border-radius:3px',
        barFillStyle: `position:absolute;top:0;bottom:0;${positive ? 'left:50%' : 'right:50%'};width:${pct}%;background:${positive ? homeColor : awayColor};border-radius:3px`,
      };
    };
    const efficiencyBars = [
      { label: 'Success rate', value: g.success_contribution || 0 },
      { label: 'Explosiveness', value: g.explosive_contribution || 0 },
      { label: 'Havoc', value: g.havoc_contribution || 0 },
    ].map(makeBar);
    const rushHomeSide = rushSide(g.home_team, g.away_team);
    const rushAwaySide = rushSide(g.away_team, g.home_team);
    const passHomeSide = passSide(g.home_team, g.away_team);
    const passAwaySide = passSide(g.away_team, g.home_team);
    const rushLive = bothSidesLoaded(rushHomeSide) && bothSidesLoaded(rushAwaySide);
    const passLive = bothSidesLoaded(passHomeSide) && bothSidesLoaded(passAwaySide);
    const rushDetail = (rushHomeSide && rushAwaySide)
      ? `${g.home_team} rush off (${rushHomeSide.offPctl}th pctl) vs ${g.away_team} run D (${rushHomeSide.defPctl}th pctl) \u00b7 ${g.away_team} rush off (${rushAwaySide.offPctl}th pctl) vs ${g.home_team} run D (${rushAwaySide.defPctl}th pctl)`
      : null;
    const passDetail = (passHomeSide && passAwaySide)
      ? `${g.home_team} pass off (${passHomeSide.offPctl}th pctl) vs ${g.away_team} pass D (${passHomeSide.defPctl}th pctl) \u00b7 ${g.away_team} pass off (${passAwaySide.offPctl}th pctl) vs ${g.home_team} pass D (${passAwaySide.defPctl}th pctl)`
      : null;
    const schemeBars = [
      { label: 'Run game', value: g.rush_contribution || 0, detail: rushDetail, liveMatchup: rushLive },
      { label: 'Pass game', value: g.pass_contribution || 0, detail: passDetail, liveMatchup: passLive },
    ].map(makeBar);
    const hasFullModel = g.predicted_margin != null;
    const homeWinPct = g.home_win_prob != null ? Math.round(g.home_win_prob * 100) : null;
    const preseasonFavored = homeWinPct != null ? (homeWinPct >= 50 ? g.home_team : g.away_team) : null;
    const preseasonPct = homeWinPct != null ? (homeWinPct >= 50 ? homeWinPct : 100 - homeWinPct) : null;
    const narration = hasFullModel ? buildMatchupNarration(g, efficiencyBars, schemeBars) : null;
    const keyPlayersHome = CFB_KEY_PLAYERS[g.home_team] || [];
    const keyPlayersAway = CFB_KEY_PLAYERS[g.away_team] || [];
    // "Things to watch for" - reuses each team's already-written profile
    // bullets (CFB_TEAM_PROFILES.whyModelThinks) instead of writing new
    // matchup-specific copy. Graceful no-op for the ~117 unprofiled teams.
    const homeProfile = CFB_TEAM_PROFILES[g.home_team];
    const awayProfile = CFB_TEAM_PROFILES[g.away_team];
    const watchFor = [
      homeProfile && { team: g.home_team, text: (homeProfile.whyModelThinks.risks || [])[0] || (homeProfile.whyModelThinks.optimism || [])[0] },
      awayProfile && { team: g.away_team, text: (awayProfile.whyModelThinks.risks || [])[0] || (awayProfile.whyModelThinks.optimism || [])[0] },
    ].filter((w) => w && w.text);
    return {
      key, homeTeam: g.home_team, awayTeam: g.away_team, hasFullModel, narration, keyPlayersHome, keyPlayersAway, watchFor,
      cardStyle: `border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card);border:${g._isPinnedGame ? `2px solid ${pinnedAccentColor}` : '1px solid var(--hairline)'}`,
      predictedLabel: hasFullModel
        ? `Model ${g.predicted_margin > 0 ? '+' : ''}${num(g.predicted_margin, 1)}`
        : (preseasonFavored ? `Preseason: ${preseasonFavored} ${preseasonPct}%` : 'Model —'),
      marketLabel: g.market_spread != null ? `Market ${num(-g.market_spread, 1)}` : 'Market —',
      edgeLabel: g.model_edge != null ? `${g.model_edge > 0 ? '+' : ''}${num(g.model_edge, 1)} edge` : 'No line',
      edgeColor, expanded, onToggle: () => setState({ expandedMatchup: expanded ? null : key }), efficiencyBars, schemeBars,
      colorLegend: 'Bar color and position both indicate which team a stat favors — bars extending toward a team, in that team’s color, favor that team.',
      marginNote: `Predicted margin: positive = ${g.home_team} favored by that many points, negative = ${g.away_team} favored.`,
      homeFieldNote: `Home field edge applied: ${num(g.home_field_edge_used, 2)} pts${g.neutral_site ? ' (neutral site — 0 used)' : ''}`,
      preseasonNote: preseasonFavored ? `Preseason baseline: ${preseasonFavored} favored, ${preseasonPct}% win probability — from each team's aggregate Power Score, before any 2026 games are played. The efficiency/scheme breakdown below needs real opponent-adjusted stats, which don't exist until this team has played a game.` : `No prediction available yet for this game.`,
    };
  });

  const teams = [...new Set((historyRows || []).map((r) => r.team))].sort();
  if (pinnedTeam && !teams.includes(pinnedTeam)) teams.unshift(pinnedTeam);
  const activeTeam = teams.includes(selectedTeam) ? selectedTeam : (teams[0] || pinnedTeam);
  const teamOptions = teams.map((t) => ({ value: t, label: t }));

  const seriesFor = (teamName) => (historyRows || [])
    .filter((r) => r.team === teamName)
    .sort((a, b) => new Date(a.date_pulled) - new Date(b.date_pulled))
    .map((r) => ({
      week: r.max_week_played, rating: Number(r.POWER_RATING_SHRUNK), date: r.date_pulled,
      off_sr: r.adj_off_success_rate, off_exp: r.adj_off_explosiveness,
      def_sr: r.adj_def_success_rate, def_exp: r.adj_def_explosiveness, def_havoc: r.adj_def_havoc,
      sp_plus: r.SP_PLUS, games: r.games_played,
    }));

  const selectedSeries = seriesFor(activeTeam);
  const showPinnedOverlay = activeTeam !== pinnedTeam;
  const pinnedSeries = showPinnedOverlay ? seriesFor(pinnedTeam) : [];

  const allRatings = [...selectedSeries, ...pinnedSeries].map((p) => p.rating).filter((v) => !Number.isNaN(v));
  const minR = allRatings.length ? Math.min(...allRatings, 0) : -0.1;
  const maxR = allRatings.length ? Math.max(...allRatings, 0) : 0.1;
  const range = (maxR - minR) || 0.001;
  const chartW = 480, chartH = 300, padL = 50, padR = 16, padT = 16, padB = 34;
  const innerH = chartH - padT - padB;
  const scaleY = (v) => padT + ((maxR - v) / range) * innerH;
  const tickCount = 4;
  const yTicks = [];
  for (let i = 0; i < tickCount; i++) {
    const v = maxR - (i * range) / (tickCount - 1);
    const y = scaleY(v);
    yTicks.push({ y, label: num(v, 3), style: `position:absolute;left:0;top:${y}px;transform:translateY(-50%);width:${padL - 10}px;text-align:right;font:11px var(--font-sans);color:var(--ink-muted)` });
  }
  const buildGeom = (series) => {
    const n = series.length;
    if (!n) return { path: '', dots: [] };
    const stepX = n > 1 ? (chartW - padL - padR) / (n - 1) : 0;
    const dots = series.map((p, i) => {
      const cx = padL + i * stepX, cy = scaleY(p.rating);
      return {
        cx, cy, label: `Wk ${p.week}`, value: num(p.rating, 3),
        xLabelStyle: `position:absolute;left:${(cx / chartW) * 100}%;top:${chartH - 8}px;transform:translate(-50%,0);font:11px var(--font-sans);color:var(--ink-muted);white-space:nowrap`,
      };
    });
    const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.cx},${d.cy}`).join(' ');
    return { path, dots };
  };
  const selectedGeom = buildGeom(selectedSeries);
  const pinnedGeom = showPinnedOverlay ? buildGeom(pinnedSeries) : { path: '', dots: [] };
  const zeroY = (minR < 0 && maxR > 0) ? scaleY(0) : null;

  const delta = selectedSeries.length >= 2 ? selectedSeries[selectedSeries.length - 1].rating - selectedSeries[selectedSeries.length - 2].rating : null;
  const trendDeltaLabel = delta !== null ? `${delta >= 0 ? '▲' : '▼'} ${num(Math.abs(delta), 3)} vs last snapshot` : '';
  const trendDeltaColor = delta !== null ? (delta >= 0 ? 'var(--value-positive)' : 'var(--value-risk)') : 'var(--ink-muted)';

  const activeRankRow = rankRows.find((r) => r.team === activeTeam);
  const latestHist = selectedSeries.length ? selectedSeries[selectedSeries.length - 1] : null;
  const snapshotTiles = [
    { label: 'Power Score', value: activeRankRow ? num(activeRankRow.POWER_RATING_SHRUNK, 3) : (latestHist ? num(latestHist.rating, 3) : '—'), sublabel: '' },
    { label: 'Rank', value: activeRankRow ? `#${activeRankRow.rank}` : '—', sublabel: activeRankRow ? `of ${rankRows.length}` : '' },
    { label: 'SP+', value: activeRankRow ? num(activeRankRow.SP_PLUS, 1) : (latestHist ? num(latestHist.sp_plus, 1) : '—'), sublabel: '' },
    { label: 'Games', value: activeRankRow ? (activeRankRow.games_played ?? '—') : (latestHist ? (latestHist.games ?? '—') : '—'), sublabel: 'played' },
  ];
  const oneLiner = oneLinerFor(powerRows, activeTeam);
  const hasPowerData = !!activeRankRow;
  const profile = CFB_TEAM_PROFILES[activeTeam];
  const truthy = (v) => v === true || v === 'True' || v === 'true';
  const coachIsNew = hasPowerData && truthy(activeRankRow.hc_changed);
  const coachIsFirstTime = coachIsNew && truthy(activeRankRow.first_time_hc);
  const coachNoChange = hasPowerData && !coachIsNew;
  const coachName = coachIsNew ? (activeRankRow.new_coach || '—') : '—';
  const coachPrev = activeRankRow ? (activeRankRow.prev_coach || '—') : '—';
  const coachCardBorder = coachIsNew ? '2px solid var(--brass)' : '1px solid var(--hairline)';
  const relianceZ = hasPowerData ? (Number(activeRankRow.reliance_z) || 0) : 0;
  const leanPct = Math.max(4, Math.min(96, 50 - relianceZ * 25));
  const leanMarkerStyle = `position:absolute;top:-3px;bottom:-3px;left:${leanPct}%;width:14px;height:18px;transform:translateX(-50%);background:var(--accent-primary);border-radius:4px;border:2px solid var(--surface-card)`;
  const fragilityRaw = hasPowerData ? (activeRankRow.fragility_type || '') : '';
  const fragilityLabel = fragilityRaw ? fragilityRaw.charAt(0).toUpperCase() + fragilityRaw.slice(1) : '—';

  // Schedule Journey (mirrors NFL sibling's, TEAM_PROFILE_DESIGN_SYSTEM.md
  // section 7): "a timeline, not an opponent list." Anna's ask 2026-08-06.
  // Built from cfb_team_schedule.json (cfb_matchup.py's build_team_schedules())
  // - the full season schedule, independent of which weeks have actually
  // had predict_week() run for them. Weeks with no prediction yet (or
  // preseason, before the matchup model can even run - see
  // has_matchup_stats in cfb_matchup.py) come through with win_prob null,
  // rendered as an explicit "not yet predicted" state rather than hidden
  // or guessed at.
  const fullTeamSchedule = (teamSchedule || {})[activeTeam] || [];
  const todayISO = new Date().toISOString().slice(0, 10);
  const upcomingTeamSchedule = fullTeamSchedule.filter((g) => !g.date || g.date.slice(0, 10) >= todayISO);
  const scheduleToShow = upcomingTeamSchedule.length ? upcomingTeamSchedule : fullTeamSchedule;
  const formatGameDate = (iso) => {
    if (!iso) return '—';
    // Anchor to noon UTC before formatting - CFBD's startDate is midnight
    // UTC, and converting straight to local time can roll the displayed
    // date back a day west of the UTC line otherwise (same fix the NFL
    // sibling applies to its own schedule dates).
    return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const scheduleDifficultyMeta = {
    favorable: { label: 'Favorable', color: 'var(--value-positive)' },
    competitive: { label: 'Competitive', color: 'var(--brass)' },
    difficult: { label: 'Difficult', color: 'var(--value-risk)' },
    unknown: { label: 'Not yet predicted', color: 'var(--ink-faint)' },
  };
  const scheduleJourneyRows = scheduleToShow.map((g) => {
    if (g.win_prob === null || g.win_prob === undefined) return { ...g, difficulty: 'unknown', isSwing: false };
    const wp = Number(g.win_prob);
    const difficulty = wp >= 0.6 ? 'favorable' : wp <= 0.4 ? 'difficult' : 'competitive';
    return { ...g, difficulty, isSwing: Math.abs(wp - 0.5) <= 0.05 };
  });
  const knownScheduleGames = scheduleJourneyRows.filter((g) => g.difficulty !== 'unknown');
  const toughestScheduleGame = knownScheduleGames.length
    ? knownScheduleGames.reduce((worst, g) => (g.win_prob < worst.win_prob ? g : worst), knownScheduleGames[0])
    : null;
  const scheduleSwingGames = knownScheduleGames.filter((g) => g.isSwing);
  const scheduleSummary = knownScheduleGames.length
    ? (scheduleSwingGames.length > 0
        ? `${scheduleSwingGames.length} swing game${scheduleSwingGames.length === 1 ? '' : 's'} on the board (within 5 points of a coin flip) \u2014 the toughest single test is Week ${toughestScheduleGame.week}, ${toughestScheduleGame.home ? 'vs' : '@'} ${toughestScheduleGame.opponent} (${Math.round(toughestScheduleGame.win_prob * 100)}% win probability).`
        : `No true coin-flip games on the board yet \u2014 the toughest single test is Week ${toughestScheduleGame.week}, ${toughestScheduleGame.home ? 'vs' : '@'} ${toughestScheduleGame.opponent} (${Math.round(toughestScheduleGame.win_prob * 100)}% win probability).`)
    : (fullTeamSchedule.length ? 'Win probabilities not generated yet for these games \u2014 run the matchup pipeline to populate them.' : '');


  // Team DNA (shared component, team-dna.js) - identity, not grades: "what
  // kind of team is this," not "how good are they." Every dimension below
  // reuses a field the pipeline already computes (no new data work) - see
  // percentileRank() in team-dna.js for how raw values become 0-100 bars.
  const dnaValues = (field) => rankRows.map((r) => Number(r[field]));
  const dnaPct = (field) => hasPowerData ? percentileRank(dnaValues(field), Number(activeRankRow[field])) : null;
  const dnaPctInverted = (field) => {
    const p = dnaPct(field);
    return p === null ? null : 100 - p;
  };
  const coachContinuityPct = !hasPowerData ? null : (coachIsNew ? Math.min(15, dnaPct('coaching_prior_z') ?? 15) : dnaPct('coaching_prior_z'));
  const teamDNADimensions = [
    { label: 'Talent', pct: dnaPct('talent_z') },
    { label: 'Rushing Offense', pct: dnaPct('adj_off_rush_success') },
    { label: 'Passing Offense', pct: dnaPct('adj_off_pass_success') },
    { label: 'Explosiveness', pct: dnaPct('adj_off_explosiveness') },
    { label: 'Defensive Strength', pct: dnaPctInverted('adj_def_success_rate') },
    { label: 'Disruption (Havoc)', pct: dnaPct('adj_def_havoc') },
    { label: 'Roster Continuity', pct: dnaPct('returning_production_z') },
    { label: 'Coaching Continuity', pct: coachContinuityPct },
  ];
  const personnelScale = 2.2;
  const personnelBars = [
    { label: 'Talent', value: hasPowerData ? (Number(activeRankRow.talent_z) || 0) : 0 },
    { label: 'Returning Prod.', value: hasPowerData ? (Number(activeRankRow.returning_production_z) || 0) : 0 },
    { label: 'Portal Activity', value: hasPowerData ? (Number(activeRankRow.portal_net_z) || 0) : 0 },
  ].map((p) => {
    const positive = p.value >= 0;
    const pct = Math.min(50, (Math.abs(p.value) / personnelScale) * 50);
    return {
      label: p.label, valueLabel: signed(p.value, 2),
      fillStyle: `position:absolute;top:0;bottom:0;${positive ? 'left:50%' : 'right:50%'};width:${pct}%;background:${positive ? 'var(--value-positive)' : 'var(--value-risk)'};border-radius:3px`,
    };
  });
  const homeEdgeVal = hasPowerData && activeRankRow.team_home_edge != null ? Number(activeRankRow.team_home_edge) : null;
  const homeEdgeLabel = homeEdgeVal != null && !isNaN(homeEdgeVal) ? `${signed(homeEdgeVal, 1)} pts` : '—';
  const showSnapshotBox = activeTeam !== pinnedTeam;
  const snapshotBg = teamColor(activeTeam);
  const snapshotTextColor = readableTextColor(snapshotBg);
  const snapshotAccentColor = snapshotTextColor === '#0B0D10' ? 'rgba(11,13,16,.6)' : 'rgba(255,255,255,.7)';
  const snapshotBoxStyle = `background:${snapshotBg};border-radius:var(--radius-md);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px`;

  const offenseMetricDefs = [
    { key: 'off_sr', label: 'Off. Success Rate (higher = better)', shortLabel: 'Off. Success Rate', color: 'var(--accent-primary)', higherBetter: true, decimals: 3 },
    { key: 'off_exp', label: 'Off. Explosiveness (higher = better)', shortLabel: 'Off. Explosiveness', color: 'var(--brass)', higherBetter: true, decimals: 2 },
  ];
  const defenseMetricDefs = [
    { key: 'def_sr', label: 'Success Rate Allowed (lower = better)', shortLabel: 'Success Rate Allowed', color: 'var(--accent-primary)', higherBetter: false, decimals: 3 },
    { key: 'def_exp', label: 'Explosiveness Allowed (lower = better)', shortLabel: 'Explosiveness Allowed', color: 'var(--brass)', higherBetter: false, decimals: 2 },
    { key: 'def_havoc', label: 'Havoc Rate (higher = better)', shortLabel: 'Havoc Rate', color: 'var(--value-positive)', higherBetter: true, decimals: 3 },
  ];
  const offenseChart = buildIndexChart(selectedSeries, offenseMetricDefs, 300, 200, 260, 'offense', setChartHover, clearChartHover);
  const defenseChart = buildIndexChart(selectedSeries, defenseMetricDefs, 300, 200, 260, 'defense', setChartHover, clearChartHover);
  const chartHover = s.chartHover;
  const offenseHoverVisible = !!(chartHover && chartHover.chart === 'offense');
  const defenseHoverVisible = !!(chartHover && chartHover.chart === 'defense');
  const hoverTipStyle = chartHover ? `position:absolute;left:${chartHover.leftPct}%;top:${chartHover.topPct}%;transform:translate(-50%,-135%);background:var(--ink);color:var(--paper);font:600 11px var(--font-sans);padding:5px 9px;border-radius:6px;white-space:nowrap;pointer-events:none;z-index:5` : '';
  const offenseMover = biggestMoverFor(selectedSeries, offenseMetricDefs);
  const defenseMover = biggestMoverFor(selectedSeries, defenseMetricDefs);

  const dirColor = (diff, higherBetter) => (diff === 0 || Number.isNaN(diff)) ? 'var(--ink-muted)' : ((higherBetter ? diff > 0 : diff < 0) ? 'var(--value-positive)' : 'var(--value-risk)');
  const weekRows = selectedSeries.map((row, i) => {
    const prev = i > 0 ? selectedSeries[i - 1] : null;
    const ratingDelta = prev ? row.rating - prev.rating : null;
    return {
      week: row.week,
      powerRating: num(row.rating, 3),
      deltaLabel: ratingDelta !== null ? signed(ratingDelta, 3) : '—',
      deltaColor: ratingDelta !== null ? dirColor(ratingDelta, true) : 'var(--ink-muted)',
      offSr: num(row.off_sr, 3), offSrColor: prev ? dirColor(row.off_sr - prev.off_sr, true) : 'var(--ink)',
      offExp: num(row.off_exp, 2), offExpColor: prev ? dirColor(row.off_exp - prev.off_exp, true) : 'var(--ink)',
      defSr: num(row.def_sr, 3), defSrColor: prev ? dirColor(row.def_sr - prev.def_sr, false) : 'var(--ink)',
      defExp: num(row.def_exp, 2), defExpColor: prev ? dirColor(row.def_exp - prev.def_exp, false) : 'var(--ink)',
      havoc: num(row.def_havoc, 3), havocColor: prev ? dirColor(row.def_havoc - prev.def_havoc, true) : 'var(--ink)',
    };
  }).reverse();
  const weekTableProps = {
    columns: [
      { key: 'week', label: 'Week', render: (r) => `Wk ${r.week}` },
      { key: 'powerRating', label: 'Power Rtg', render: (r) => r.powerRating },
      { key: 'delta', label: 'Δ Wk', render: (r) => <span style={{ color: r.deltaColor, fontWeight: 700 }}>{r.deltaLabel}</span> },
      { key: 'offSr', label: 'Off Succ%', render: (r) => <span style={{ color: r.offSrColor }}>{r.offSr}</span> },
      { key: 'offExp', label: 'Off Expl', render: (r) => <span style={{ color: r.offExpColor }}>{r.offExp}</span> },
      { key: 'defSr', label: 'Def Succ%', render: (r) => <span style={{ color: r.defSrColor }}>{r.defSr}</span> },
      { key: 'defExp', label: 'Def Expl', render: (r) => <span style={{ color: r.defExpColor }}>{r.defExp}</span> },
      { key: 'havoc', label: 'Havoc', render: (r) => <span style={{ color: r.havocColor }}>{r.havoc}</span> },
    ],
    rows: weekRows,
  };


  // ----------------------------------------------------------------------
  // CFB Team Overview redesign (HANDOFF-README.md §3) - everything below
  // reads fields already computed above (activeRankRow, teamDNADimensions,
  // dnaPct, coachContinuityPct, teamSchedule, s.matchupByWeek, etc.); no
  // new data wiring, only new layout built from what's already loaded.
  // ----------------------------------------------------------------------
  const activeTeamColor = teamColor(activeTeam);
  const arkansasRankRow = rankRows.find((r) => r.team === 'Arkansas') || null;

  // §3.2 "What the number is built from" - the same four preseason inputs
  // already on the page (talent_z, returning_production_z, portal_net_z,
  // coaching continuity), read at whatever precision each is already shown
  // at elsewhere on this page (percentile for talent/returning/coaching -
  // same dnaPct() the Team DNA bars use - raw z-score for portal, matching
  // how CFB_TEAM_PROFILES copy already cites it).
  const builtFromTalentPct = dnaPct('talent_z');
  const builtFromReturningPct = dnaPct('returning_production_z');
  const builtFromPortalPct = dnaPct('portal_net_z');
  const builtFromCoachingPct = coachContinuityPct;
  const builtFromReturningVal = hasPowerData ? Number(activeRankRow.returning_production_z) : null;
  const builtFromPortalVal = hasPowerData ? Number(activeRankRow.portal_net_z) : null;
  const tierRead = (pct) => {
    if (pct === null || pct === undefined || Number.isNaN(pct)) return 'Not enough data yet.';
    if (pct >= 90) return 'Elite by national standards.';
    if (pct >= 70) return 'Solidly above the national average.';
    if (pct >= 40) return 'Roughly average nationally.';
    return 'Below the national average.';
  };
  const builtFromRows = [
    {
      key: 'talent', label: 'Recruiting talent', big: true, color: 'var(--ink)',
      valueLabel: builtFromTalentPct != null ? num(builtFromTalentPct, 1) : '—',
      caption: builtFromTalentPct != null ? `${Math.round(builtFromTalentPct)}th percentile nationally` : 'Not loaded yet',
      read: tierRead(builtFromTalentPct),
    },
    {
      key: 'returning', label: 'Returning production', big: false, color: 'var(--ink)',
      valueLabel: builtFromReturningVal !== null && !Number.isNaN(builtFromReturningVal) ? signed(builtFromReturningVal, 2) : '—',
      caption: builtFromReturningPct != null ? `${Math.round(builtFromReturningPct)}th percentile` : '—',
      read: builtFromReturningVal !== null && !Number.isNaN(builtFromReturningVal)
        ? (builtFromReturningVal >= 0 ? 'More of last season’s production came back than most rosters.' : 'More turnover than most rosters carried into this season.')
        : 'Not loaded yet.',
    },
    {
      key: 'portal', label: 'Portal net value', big: false, color: 'var(--value-risk)',
      valueLabel: builtFromPortalVal !== null && !Number.isNaN(builtFromPortalVal) ? signed(builtFromPortalVal, 2) : '—',
      caption: builtFromPortalPct != null ? `${Math.round(builtFromPortalPct)}th percentile` : '—',
      read: builtFromPortalVal !== null && !Number.isNaN(builtFromPortalVal)
        ? (builtFromPortalVal >= 0 ? 'A net gain in the transfer portal.' : 'A net outflow in the transfer portal.')
        : 'Not loaded yet.',
    },
    {
      key: 'coaching', label: 'Coaching continuity', big: false, color: 'var(--value-positive)',
      valueLabel: builtFromCoachingPct != null ? `${Math.round(builtFromCoachingPct)}th` : '—',
      caption: hasPowerData ? (coachIsNew ? (coachIsFirstTime ? 'First-time head coach' : 'New head coach') : 'No coaching change') : '—',
      read: hasPowerData ? (coachIsNew ? 'A new staff means real first-year uncertainty.' : 'Same staff, same system — real continuity.') : 'Not loaded yet.',
    },
  ];

  // §3.6 Model SWOT flags - "reason leads, number flags it": rank the same
  // four preseason inputs by percentile so the strongest two and the single
  // weakest are real, team-specific numbers (not Georgia's worked-example
  // 99.6 / 82nd / -0.94, which only apply to Georgia).
  const swotFactorPool = [
    { label: 'Recruiting talent', pct: builtFromTalentPct, flag: builtFromTalentPct != null ? num(builtFromTalentPct, 1) : '—' },
    { label: 'Returning production', pct: builtFromReturningPct, flag: builtFromReturningPct != null ? `${Math.round(builtFromReturningPct)}th` : '—' },
    { label: 'Portal net value', pct: builtFromPortalPct, flag: builtFromPortalVal !== null && !Number.isNaN(builtFromPortalVal) ? signed(builtFromPortalVal, 2) : '—' },
    { label: 'Coaching continuity', pct: builtFromCoachingPct, flag: builtFromCoachingPct != null ? `${Math.round(builtFromCoachingPct)}th` : '—' },
  ].filter((f) => f.pct !== null && f.pct !== undefined && !Number.isNaN(f.pct));
  const swotStrengthFlags = [...swotFactorPool].sort((a, b) => b.pct - a.pct).slice(0, 2);
  const swotWeaknessFlag = swotFactorPool.length ? [...swotFactorPool].sort((a, b) => a.pct - b.pct)[0] : null;
  // Football-forward copy rule: the pre-written profile bullets
  // (whyModelThinks.optimism[0]/risks[0]) are written number-first
  // ("99.6th-percentile recruiting talent — ..."), which is exactly what a
  // "reason leads, number flags it" lead claim must not do once the number
  // is pulled out into its own flag beside it. These two sentences are
  // freshly generated from the same real per-team data (never invented)
  // instead of reusing that number-first bullet verbatim as the headline.
  const swotStrengthHeadline = swotStrengthFlags.length >= 2
    ? `${activeTeam} isn't just ranked well — the model can point to real personnel reasons why, led by ${swotStrengthFlags[0].label.toLowerCase()} and ${swotStrengthFlags[1].label.toLowerCase()} (${swotStrengthFlags[0].flag} and ${swotStrengthFlags[1].flag}).`
    : swotStrengthFlags.length === 1
      ? `${activeTeam}'s clearest real edge, by the model's own inputs, is ${swotStrengthFlags[0].label.toLowerCase()} (${swotStrengthFlags[0].flag}).`
      : (profile ? profile.whyModelThinks.optimism[0] : '');
  const swotWeaknessHeadline = swotWeaknessFlag
    ? `${activeTeam}'s biggest open question, by the model's own inputs, is ${swotWeaknessFlag.label.toLowerCase()} — real enough to watch, not yet enough to move the number (${swotWeaknessFlag.flag}).`
    : (profile ? profile.whyModelThinks.risks[0] : '');

  // §3.5 Team DNA, as it fills in - "live" vs. "pending" is just whether
  // percentileRank() returned a real number, so a dimension reclassifies
  // itself automatically the moment on-field stats exist - no flag to
  // maintain by hand.
  const dnaLiveDims = teamDNADimensions.filter((d) => d.pct !== null && d.pct !== undefined);
  const dnaPendingDims = teamDNADimensions.filter((d) => d.pct === null || d.pct === undefined);
  const DNA_DIM_NOTES = {
    'Talent': 'Recruiting-class strength, blended across the last four cycles.',
    'Rushing Offense': "Rushing success rate against the specific opponent's run defense.",
    'Passing Offense': "Passing success rate against the specific opponent's pass defense.",
    'Explosiveness': 'Average yards gained per successful play.',
    'Defensive Strength': 'Opponent-adjusted success rate allowed.',
    'Disruption (Havoc)': 'Tackles for loss, forced fumbles, interceptions and pass breakups, per snap.',
    'Roster Continuity': "How much of last season's on-field production is still on the roster.",
    'Coaching Continuity': 'Whether the staff — and specifically the head coach — carried over from last season.',
  };

  // §3.3 Schedule rail - one column per week of the real schedule (season
  // length varies by team - Arkansas plays into Week 13 - so this sizes to
  // the real data rather than a hardcoded 12). Bar height is this team's
  // own win probability for that game (win_prob), the same field the old
  // schedule-journey list already read.
  const scheduleMaxWeek = fullTeamSchedule.reduce((m, g) => Math.max(m, Number(g.week) || 0), 0) || 12;
  const scheduleByWeek = {};
  fullTeamSchedule.forEach((g) => { if (g.week) scheduleByWeek[g.week] = g; });
  const scheduleRailWeeks = [];
  for (let w = 1; w <= scheduleMaxWeek; w++) scheduleRailWeeks.push(scheduleByWeek[w] || null);
  const scheduleLoadedCount = scheduleRailWeeks.filter((g) => g && g.win_prob !== null && g.win_prob !== undefined).length;

  // §3.4 The Week N gauntlet - Arkansas is the site's own team, so
  // whichever week Arkansas plays the team currently on screen is "the
  // gauntlet" for that team's page. Read straight off Arkansas's own
  // schedule entry (same teamSchedule the rail above uses) so the
  // probability, week and home/away are exactly what the model already
  // published - not re-derived or inverted.
  const arkansasSchedule = (teamSchedule || {})['Arkansas'] || [];
  const gauntletGame = activeTeam !== 'Arkansas' ? (arkansasSchedule.find((g) => g.opponent === activeTeam) || null) : null;
  const gauntletArkansasHome = gauntletGame ? !!gauntletGame.home : false;
  const gauntletHostTeam = gauntletGame ? (gauntletArkansasHome ? 'Arkansas' : activeTeam) : null;
  const gauntletPct = gauntletGame && gauntletGame.win_prob !== null && gauntletGame.win_prob !== undefined ? Math.round(gauntletGame.win_prob * 100) : null;
  const gauntletHostRankRow = gauntletGame ? (gauntletArkansasHome ? arkansasRankRow : activeRankRow) : null;
  const gauntletHomeEdgeLabel = gauntletHostRankRow && gauntletHostRankRow.team_home_edge != null ? `${signed(gauntletHostRankRow.team_home_edge, 2)} pts` : '—';
  const gauntletMatchupRow = gauntletGame
    ? Object.values(s.matchupByWeek || {}).flat().find((g) => (g.home_team === 'Arkansas' && g.away_team === activeTeam) || (g.away_team === 'Arkansas' && g.home_team === activeTeam))
    : null;
  const gauntletMarginLabel = gauntletMatchupRow && gauntletMatchupRow.predicted_margin != null ? signed(gauntletMatchupRow.predicted_margin, 1) : '—';
  const gauntletRead = gauntletGame && gauntletPct != null
    ? (gauntletArkansasHome
        ? `${activeTeam} travels to face Arkansas in Week ${gauntletGame.week}, and the model's read on that trip is worth knowing before anything else on the schedule (Arkansas ${gauntletPct}% at home).`
        : `Arkansas travels to ${activeTeam} in Week ${gauntletGame.week} — a real road test by the model's own number (Arkansas ${gauntletPct}%).`)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>

      <div style={st('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:26px 40px 0')}>
        <div style={st('display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
          <a href="../index.html" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <img src="assets/logo-lockup-transparent.png" style={{ height: 44 }} alt="Weaver Analytics" />
          </a>
          <h1 style={st('font:900 22px var(--font-sans);color:var(--ink);margin:0;white-space:nowrap;flex-shrink:0')}>The Weaver Line</h1>
          <nav style={st('display:flex;gap:16px;flex-wrap:wrap;margin-left:8px')}>
            <a href="../index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Home</a>
            <a href="methodology.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Methodology</a>
            <a href="../nfl-model/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>NFL Model</a>
            <a href="../validation.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Validation</a>
            <a href="../pre-read/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Pre-Read</a>
            <a href="../dashboards/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Dashboards</a>
            <a href="../blog/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Blog</a>
          </nav>
        </div>
        <div style={st('display:flex;align-items:center;gap:20px;flex-wrap:wrap')}>
          <div style={st('display:flex;align-items:center;gap:10px')}>
            <label style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Week</label>
            {s.availableWeeks.length > 0 ? (
              <select
                value={s.weekInput}
                onChange={(e) => selectWeek(e.target.value)}
                style={st('font:600 14px var(--font-sans);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
              >
                {s.availableWeeks.map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            ) : (
              <span style={st('font:600 14px var(--font-sans);color:var(--ink-faint)')}>—</span>
            )}
            {s.availableWeeks.length > 0 && (
              <span style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')} title="This is a hand-run snapshot pipeline, not a live weekly feed — new weeks get added as they're generated, so gaps between them are expected, not missing data.">
                Snapshots so far: {s.availableWeeks.map((w) => `Wk ${w}`).join(', ')}
              </span>
            )}
          </div>
          <div style={st('display:flex;align-items:center;gap:14px')}>
            {s.generatedAt && (
              <span style={st('font:600 12px var(--font-sans);color:var(--ink-faint)')}>Data as of {s.generatedAt}</span>
            )}
            <div style={st('font:700 12px var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted)')}>College Football Model</div>
          </div>
        </div>
      </div>

      {s.pipelineError && (
        <div style={st('margin:16px 40px 0;padding:12px 18px;border-radius:var(--radius-sm);background:var(--value-risk-light);color:var(--paper);font:600 13px var(--font-sans)')}>
          {s.pipelineError}
        </div>
      )}

      <div style={st('padding:10px 40px 0')}>
        <p style={st('font:400 16px/1.5 var(--font-sans);color:var(--ink-muted);margin:0')}>Power ratings, matchup edges, and week-over-week trends — pin any team to keep it visible across every tab.</p>
      </div>

      <div style={st('margin:24px 40px 0;background:var(--surface-dark);border-radius:var(--radius-md);padding:20px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px')}>
        <div style={st('display:flex;align-items:center;gap:14px')}>
          <span style={st(`font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:${pinnedAccentColor}`)}>Pinned</span>
          {noPinnedTeam && <span style={st('font:600 15px var(--font-sans);color:var(--paper);opacity:.7')}>No team pinned — click the pin icon on any team to track them here.</span>}
          {!noPinnedTeam && <span style={st('font:900 24px var(--font-sans);color:var(--paper)')}>{pinnedTeam}</span>}
        </div>
        {pinnedRailFound && (
          <div style={st('display:flex;gap:28px;font:600 15px var(--font-sans);color:var(--paper);flex-wrap:wrap')}>
            <span>Rank <b>#{pinnedIdx + 1}</b> / {powerSorted.length}</span>
            <span>Rating <b>{num(pinnedRow.POWER_RATING_SHRUNK, 3)}</b></span>
            <span>SP+ <b>{num(pinnedRow.SP_PLUS, 1)}</b></span>
            <span style={{ opacity: 0.7 }}>{pinnedRow.games_played ?? '—'} games</span>
          </div>
        )}
        {pinnedNotInData && (
          <span style={st('font:600 14px var(--font-sans);color:var(--paper);opacity:.7')}>Waiting on power ratings to track {pinnedTeam}</span>
        )}
      </div>

      <div style={st('display:flex;gap:4px;padding:0 40px;margin-top:28px;border-bottom:1px solid var(--hairline)')}>
        {tabsList.map((t) => (
          <button key={t.id} style={st(t.style)} onClick={t.onClick}>{t.label}</button>
        ))}
      </div>

      {tab === 'rankings' && !s.loaded && (
        // Loading skeleton (first paint, fetch in flight): the static copy in
        // both cards and the sidebar's equation/definitions is real content
        // and can render instantly; only the table body and the numbers that
        // depend on data are left empty. No spinner, no placeholder box.
        <div style={st('padding:28px 40px 44px;display:flex;flex-direction:column;gap:24px')}>
          <div className="rankings-top-row">
            <div style={st('background:var(--surface-card);border:1px solid var(--hairline);border-radius:var(--radius-md);padding:26px 28px;display:flex;flex-direction:column;gap:10px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-muted)')}>Reading the scale</div>
              <div style={st('font:900 26px/1.2 var(--font-sans);color:var(--ink)')}>The rating isn&rsquo;t points yet.</div>
              <p style={st('font:400 19px/1.5 var(--font-sans);color:var(--ink);margin:0;text-wrap:pretty')}>Zero is a perfectly average FBS team.</p>
            </div>
            <div style={st('background:var(--surface-card);border:1px solid var(--hairline);border-radius:var(--radius-md);padding:26px 28px')} />
          </div>
          <div className="rankings-two-col">
            <div style={st('display:flex;flex-direction:column;min-width:0;border-radius:var(--radius-md);box-shadow:var(--shadow-card);overflow:hidden')}>
              <div style={{ display: 'grid', gridTemplateColumns: rankColumns.map((c) => c.width).join(' '), background: 'var(--surface-dark)' }}>
                {rankColumns.map((c) => (
                  <div key={c.key} style={st(`padding:${c.headerPad};color:var(--text-inverse);font-weight:700;font-size:12px;letter-spacing:${c.headerTracking};text-transform:uppercase;text-align:${c.headerAlign}`)}>{c.label}</div>
                ))}
              </div>
            </div>
            <div>
              <CFBPowerScoreWalkthrough team={null} rating={null} gamesPlayed={null} scale={null} homeEdge={null} lastCalibrated={null} />
            </div>
          </div>
        </div>
      )}

      {tab === 'rankings' && s.loaded && rankRows.length === 0 && (
        // No powerRows at all (pipeline hasn't run): Card A stands alone
        // full-width, Card B and the sidebar are removed rather than shown
        // empty, and the table's spot carries today's message verbatim.
        <div style={st('padding:28px 40px 44px;display:flex;flex-direction:column;gap:24px')}>
          <div style={st('display:grid;grid-template-columns:1fr;gap:24px')}>
            <div style={st('background:var(--surface-card);border:1px solid var(--hairline);border-radius:var(--radius-md);padding:26px 28px;display:flex;flex-direction:column;gap:10px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-muted)')}>Reading the scale</div>
              <div style={st('font:900 26px/1.2 var(--font-sans);color:var(--ink)')}>The rating isn&rsquo;t points yet.</div>
              <p style={st('font:400 19px/1.5 var(--font-sans);color:var(--ink);margin:0;text-wrap:pretty')}>Zero is a perfectly average FBS team.</p>
            </div>
          </div>
          <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No power ratings yet — run the pipeline to generate cfb_power_ratings.csv.</div>
        </div>
      )}

      {tab === 'rankings' && s.loaded && rankRows.length > 0 && (
        <div style={st('padding:28px 40px 44px;display:flex;flex-direction:column;gap:24px')}>

          {/* Row 1 — reading-the-scale explainer + all-teams strip chart */}
          <div className="rankings-top-row">
            <div style={st('background:var(--surface-card);border:1px solid var(--hairline);border-radius:var(--radius-md);padding:26px 28px;display:flex;flex-direction:column;gap:10px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-muted)')}>Reading the scale</div>
              <div style={st('font:900 26px/1.2 var(--font-sans);color:var(--ink)')}>The rating isn&rsquo;t points yet.</div>
              {marginFit ? (
                <p style={st('font:400 19px/1.5 var(--font-sans);color:var(--ink);margin:0;text-wrap:pretty')}>
                  Zero is a perfectly average FBS team. Multiply a rating by the model&rsquo;s current &times;{num(marginFit.scale, 0)} conversion factor to get points, then subtract two teams&rsquo; numbers and add the home team&rsquo;s own edge for a predicted margin.
                </p>
              ) : (
                <p style={st('font:400 19px/1.5 var(--font-sans);color:var(--ink);margin:0;text-wrap:pretty')}>Zero is a perfectly average FBS team.</p>
              )}
            </div>

            <div style={st('background:var(--surface-card);border:1px solid var(--hairline);border-radius:var(--radius-md);padding:26px 28px;display:flex;flex-direction:column;gap:6px')}>
              <div style={st('display:flex;align-items:baseline;justify-content:space-between;gap:16px')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-muted)')}>All {teamCount} teams on one axis</div>
                <div style={st('font:600 13px var(--font-sans);color:var(--ink-faint)')}>{stripRangeLabel}</div>
              </div>
              <div style={st('position:relative;height:78px;margin-top:10px')} role="img" aria-label={stripCaption}>
                <div style={st('position:absolute;left:0;right:0;top:36px;height:1px;background:var(--hairline)')} />
                <div style={{ position: 'absolute', top: 0, bottom: 22, width: 1, background: 'var(--ink)', left: stripZeroPct }} />
                {stripTicks.map((t) => <div key={t.team} style={t.style} />)}
                {stripPinnedRow && (
                  <div style={{ position: 'absolute', top: 0, left: stripPos(Number(stripPinnedRow.POWER_RATING_SHRUNK) || 0) + '%', transform: 'translateX(-50%)', font: '700 11px var(--font-sans)', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink)', whiteSpace: 'nowrap' }}>{stripPinnedRow.team}</div>
                )}
                <div style={{ position: 'absolute', top: 60, left: stripZeroPct, transform: 'translateX(-50%)', font: '700 11px var(--font-sans)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>Average</div>
                <div style={st('position:absolute;top:0;left:0;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--value-risk)')}>Weakest</div>
                <div style={st('position:absolute;top:0;right:0;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--value-positive)')}>Strongest</div>
              </div>
              <p style={st('font:400 15px/1.45 var(--font-sans);color:var(--ink-muted);margin:6px 0 0;text-wrap:pretty')}>{stripCaption}</p>
            </div>
          </div>

          {/* Row 2 — sort pills, show-all toggle, group by conference */}
          <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
            {!s.groupByConference && (
              <React.Fragment>
                <span style={st('font:700 12px var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin-right:2px')}>Sort</span>
                {sortPills.map((p) => (
                  <button key={p.key} style={st(p.style)} onClick={p.onClick}>{p.label} {p.arrow}</button>
                ))}
              </React.Fragment>
            )}
            <span style={{ flex: 1 }} />
            {!s.groupByConference && tableSorted.length > topN && (
              <button
                style={st('padding:6px 14px;border-radius:999px;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid var(--hairline);background:transparent;color:var(--ink-muted)')}
                onClick={() => setState((prev) => ({ showAllRankings: !prev.showAllRankings }))}
              >{s.showAllRankings ? `Show top ${topN}` : `Show all ${tableSorted.length}`}</button>
            )}
            <button
              style={st(`padding:6px 14px;border-radius:999px;font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid ${s.groupByConference ? 'var(--ink)' : 'var(--hairline)'};background:${s.groupByConference ? 'var(--ink)' : 'transparent'};color:${s.groupByConference ? 'var(--paper)' : 'var(--ink-muted)'}`)}
              onClick={toggleGroupByConference}
            >Group by Conference</button>
          </div>

          {/* Row 3 — table (or grouped-by-conference tables) + Power Score walkthrough sidebar */}
          <div className="rankings-two-col">
            {s.groupByConference ? (
              <div style={st('display:flex;flex-direction:column;gap:24px;min-width:0')}>
                {groupedByConference.map((g) => (
                  <div key={g.conference}>
                    <div style={st('font:700 13px var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px')}>{g.conference}</div>
                    <RankingsTable columns={rankColumnsGrouped} rows={g.rows} />
                  </div>
                ))}
              </div>
            ) : (
              <RankingsTable columns={rankColumns} rows={tableDisplayRows} scroll />
            )}

            <div>
              <CFBPowerScoreWalkthrough
                team={walkthroughRow ? walkthroughRow.team : null}
                rating={walkthroughRow ? Number(walkthroughRow.POWER_RATING_SHRUNK) : null}
                gamesPlayed={walkthroughRow ? (Number(walkthroughRow.games_played) || 0) : null}
                scale={marginFit ? Number(marginFit.scale) : null}
                homeEdge={marginFit ? Number(marginFit.home_edge) : null}
                lastCalibrated={marginFit ? marginFit.last_calibrated : null}
                priorRating={walkthroughParts ? walkthroughParts.priorRating : null}
                priorWeight={walkthroughParts ? walkthroughParts.priorWeight : null}
                seasonRating={walkthroughParts ? walkthroughParts.seasonRating : null}
                seasonWeight={walkthroughParts ? walkthroughParts.seasonWeight : null}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'matchup' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:20px')}>
          <div style={st('display:flex;align-items:center;gap:10px')}>
            <label style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Week</label>
            {s.availableWeeks.length > 0 ? (
              <select
                value={s.weekInput}
                onChange={(e) => selectWeek(e.target.value)}
                style={st('font:600 14px var(--font-sans);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
              >
                {s.availableWeeks.map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            ) : (
              <span style={st('font:600 14px var(--font-sans);color:var(--ink-faint)')}>—</span>
            )}
          </div>

          <div style={st('font:400 16px var(--font-sans);color:var(--ink-muted)')}>
            {s.matchupWeek != null
              ? `Week ${s.matchupWeek} — sorted by |model edge| — ${pinnedTeam || 'pinned team'}'s games pinned to the top.`
              : `Sorted by |model edge| — ${pinnedTeam || 'pinned team'}'s games pinned to the top.`}
          </div>
          <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint)')}>
            Positive numbers favor the home team, negative favor the away team — for both "Model" and "Market." Expand any card to see the full breakdown.
          </div>

          <div style={st('display:flex;flex-direction:column;gap:14px')}>
            {matchupList.length === 0 && (
              <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No matchup predictions yet — run the pipeline for a week to generate them.</div>
            )}
            {matchupList.map((g) => (
              <div key={g.key} style={st(g.cardStyle)}>
                <button onClick={g.onToggle} style={st('width:100%;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;text-align:left;border:none;background:var(--surface-card);cursor:pointer;gap:16px;flex-wrap:wrap')}>
                  <span style={st('font:700 18px var(--font-sans);color:var(--ink)')}>{g.awayTeam} <span style={st('color:var(--ink-muted);font-weight:400')}>at</span> {g.homeTeam}</span>
                  <span style={st('display:flex;align-items:center;gap:18px;font:600 15px var(--font-sans)')}>
                    <span style={st('color:var(--ink-muted)')}>{g.predictedLabel}</span>
                    <span style={st('color:var(--ink-muted)')}>{g.marketLabel}</span>
                    <span style={st(`color:${g.edgeColor};font-weight:700`)}>{g.edgeLabel}</span>
                  </span>
                </button>
                {g.expanded && (
                  <div style={st('padding:6px 22px 20px;background:var(--surface-page);display:flex;flex-direction:column;gap:12px')}>
                    <div style={st('display:flex;align-items:center;gap:12px')}>
                      <span style={{ width: 130, flexShrink: 0 }} />
                      <div style={st('flex:1;display:flex;justify-content:space-between;font:700 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)')}>
                        <span>{g.awayTeam} &#8592;</span>
                        <span>&#8594; {g.homeTeam}</span>
                      </div>
                      <span style={{ width: 56, flexShrink: 0 }} />
                    </div>
                    {g.narration && (
                      <div style={st('font:600 13px/1.5 var(--font-sans);color:var(--ink)')}>{g.narration}</div>
                    )}
                    {g.hasFullModel ? (
                      <>
                        <div style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-top:6px')}>Efficiency</div>
                        {g.efficiencyBars.map((b) => (
                          <div key={b.label} style={st('display:flex;align-items:center;gap:12px')}>
                            <span style={st('width:130px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted)')}>{b.label}</span>
                            <div style={st(b.barWrapStyle)}><div style={st(b.barFillStyle)} /></div>
                            <span style={st('width:56px;text-align:right;font:600 13px var(--font-sans);color:var(--ink)')}>{b.valueLabel}</span>
                          </div>
                        ))}
                        <div style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-top:10px')}>Scheme &amp; Staff</div>
                        {g.schemeBars.map((b) => (
                          <div key={b.label} style={st('display:flex;flex-direction:column;gap:3px')}>
                            <div style={st('display:flex;align-items:center;gap:12px')}>
                              <span style={st('width:130px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
                                {b.label}
                                {b.liveMatchup && (
                                  <span title="Both teams grade well here against a leaky opposing unit - the net edge looks quiet, but this is a live, high-variance matchup, not a stalemate." style={st('font:700 9px var(--font-sans);letter-spacing:.03em;text-transform:uppercase;background:var(--brass);color:var(--ink);padding:2px 6px;border-radius:999px;cursor:help')}>Live matchup</span>
                                )}
                              </span>
                              <div style={st(b.barWrapStyle)}><div style={st(b.barFillStyle)} /></div>
                              <span style={st('width:56px;text-align:right;font:600 13px var(--font-sans);color:var(--ink)')}>{b.valueLabel}</span>
                            </div>
                            {b.detail && <div style={st('padding-left:142px;font:400 11px var(--font-sans);color:var(--ink-faint)')}>{b.detail}</div>}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={st('padding:14px 16px;background:var(--surface-card);border-radius:var(--radius-sm);font:400 13px/1.5 var(--font-sans);color:var(--ink-muted)')}>{g.preseasonNote}</div>
                    )}
                    <div style={st('font:600 13px var(--font-sans);color:var(--ink-faint);margin-top:4px')}>{g.homeFieldNote}</div>
                    {g.hasFullModel && <div style={st('font:600 12px var(--font-sans);color:var(--ink-faint)')}>{g.colorLegend}</div>}
                    {g.hasFullModel && <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>{g.marginNote}</div>}
                    {(g.keyPlayersHome.length > 0 || g.keyPlayersAway.length > 0) && (
                      <div style={st('margin-top:8px')}>
                        <div style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:6px')}>Players to Watch</div>
                        <div style={st('display:flex;gap:20px;flex-wrap:wrap')}>
                          {[{ team: g.awayTeam, list: g.keyPlayersAway }, { team: g.homeTeam, list: g.keyPlayersHome }].filter((c) => c.list.length > 0).map((c) => (
                            <div key={c.team} style={st('display:flex;flex-direction:column;gap:3px')}>
                              <span style={st('font:700 12px var(--font-sans);color:var(--ink-muted)')}>{c.team}</span>
                              {c.list.map((p) => (
                                <span key={p.name} style={st('font:400 12px var(--font-sans);color:var(--ink)')} title={p.note}>{p.name} <span style={st('color:var(--ink-faint)')}>({p.position})</span></span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {g.watchFor.length > 0 && (
                      <div style={st('margin-top:8px')}>
                        <div style={st('font:700 11px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:6px')}>Things to Watch For</div>
                        {g.watchFor.map((w) => (
                          <div key={w.team} style={st('font:400 13px/1.5 var(--font-sans);color:var(--ink-muted);margin-bottom:4px')}><strong style={st('color:var(--ink)')}>{w.team}:</strong> {w.text}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div style={st('display:flex;align-items:stretch')}>
          <CFBContentsRail color={activeTeamColor} />
          <div style={st('flex:1;min-width:0;padding:32px 40px 60px;display:flex;flex-direction:column;gap:22px')}>

          <div style={st('display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
            <span style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team</span>
            <select
              value={activeTeam || ''}
              onChange={(e) => setState({ selectedTeam: e.target.value })}
              style={st('font:600 15px var(--font-sans);padding:10px 16px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-card);color:var(--ink)')}
            >
              {teamOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {delta !== null && <span style={st(`font:700 15px var(--font-sans);color:${trendDeltaColor}`)}>{trendDeltaLabel}</span>}
          </div>

          {activeTeam !== pinnedTeam && (
            <div style={st(snapshotBoxStyle)}>
              <div style={st('display:flex;gap:16px;flex-wrap:wrap')}>
                {snapshotTiles.map((st_) => (
                  <div key={st_.label} style={{ minWidth: 150 }}>
                    <div style={st(`font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:${snapshotAccentColor};margin-bottom:8px`)}>{st_.label}</div>
                    <div style={st(`font:900 32px var(--font-sans);color:${snapshotTextColor}`)}>{st_.value}</div>
                    {st_.sublabel && <div style={st(`font:400 13px var(--font-sans);color:${snapshotTextColor};opacity:.65;margin-top:2px`)}>{st_.sublabel}</div>}
                  </div>
                ))}
              </div>
              <div style={st(`font:400 17px/1.5 var(--font-sans);color:${snapshotTextColor};opacity:.9`)}>{oneLiner}</div>
            </div>
          )}

          {/* §3.1 Summary — "Where they stand." Team-colour stripe + tightened
              dark banner: headline/one-liner on the left, a national-rank
              marque + Power Score on the right (both real, from activeRankRow). */}
          {profile && (
            <div id="where-they-stand" style={st('display:flex;flex-direction:column')}>
              <div style={st(`height:6px;background:${activeTeamColor};border-radius:var(--radius-sm) var(--radius-sm) 0 0`)} />
              <div style={st('background:var(--surface-dark);padding:22px 40px 24px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap')}>
                <div style={st('min-width:0;flex:1 1 420px')}>
                  <div style={st('font:700 11px var(--font-sans);letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;color:var(--paper);opacity:.6;margin-bottom:10px')}>{activeTeam} · Preseason Read 2026</div>
                  <div style={st('font:900 34px/1.12 var(--font-sans);color:var(--paper);text-wrap:balance;max-width:740px')}>{profile.headline}</div>
                  <div style={st('font:400 19px/1.4 var(--font-sans);color:var(--paper);opacity:.85;margin-top:12px;max-width:640px')}>{profile.oneLiner}</div>
                </div>
                <div style={st('flex-shrink:0;text-align:right')}>
                  <div style={st('font:900 54px/.85 var(--font-sans);color:var(--paper)')}>{hasPowerData ? `#${activeRankRow.rank}` : '—'}</div>
                  <div style={st('font:600 14px var(--font-sans);color:var(--brass);margin-top:8px')}>Power Score {hasPowerData ? num(activeRankRow.POWER_RATING_SHRUNK, 3) : '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* §3.2 "What the number is built from" — the four preseason inputs,
              sized by importance, plus the real 75/25 personnel-vs-coaching
              model weighting as a stacked bar. */}
          {hasPowerData && (
            <div id="built-from" style={st('display:flex;flex-direction:column;gap:16px')}>
              <SectionRibbon label="What the number is built from" color={activeTeamColor} />
              <div style={st('overflow-x:auto')}>
                <div style={st('display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;min-width:640px;border-top:2px solid var(--ink);border-bottom:1px solid var(--hairline)')}>
                  {builtFromRows.map((row, i) => (
                    <div key={row.key} style={st(`padding:20px 22px;display:flex;flex-direction:column;gap:6px${i > 0 ? ';border-left:1px solid var(--hairline)' : ''}`)}>
                      <div style={st('font:700 12px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted)')}>{row.label}</div>
                      <div style={st(`font:900 ${row.big ? '64px/.9' : '34px/.95'} var(--font-sans);color:${row.color}`)}>{row.valueLabel}</div>
                      <div style={st('font:600 15px var(--font-sans);color:var(--ink-muted)')}>{row.caption}</div>
                      <div style={st('font:400 14px/1.45 var(--font-sans);color:var(--ink-faint)')}>{row.read}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={st('height:44px;border-radius:var(--radius-sm);overflow:hidden;display:flex')}>
                <div style={st(`width:75%;background:${activeTeamColor};display:flex;align-items:center;justify-content:center`)}>
                  <span style={st('font:900 15px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--paper)')}>Personnel · 75%</span>
                </div>
                <div style={st(`width:25%;background:color-mix(in srgb, ${activeTeamColor} 22%, transparent);display:flex;align-items:center;justify-content:center`)}>
                  <span style={st('font:900 15px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink)')}>Coaching · 25%</span>
                </div>
              </div>
              <div style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink-faint);max-width:640px')}>
                Documented model weighting, not an estimate. Three of the four inputs above are personnel — so a case against {activeTeam}'s number is a case against recruiting, returning production and the portal, not the coaching staff.
              </div>
            </div>
          )}

          {/* §3.7 rail's "The read" — the profile's own execSummary bullets,
              moved out of the tightened Summary banner so the banner itself
              stays short. */}
          {profile && (
            <div id="the-read" style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:14px')}>
              <div style={st('display:flex;flex-direction:column;gap:10px')}>
                {profile.execSummary.map((line, i) => (
                  <div key={i} style={st('display:flex;gap:10px;align-items:flex-start')}>
                    <span style={st('font:700 14px var(--font-sans);color:var(--ink-faint);flex-shrink:0')}>{i + 1}</span>
                    <span style={st('font:400 17px/1.5 var(--font-sans);color:var(--ink)')}>{line}</span>
                  </div>
                ))}
              </div>
              <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);border-top:1px solid var(--hairline);padding-top:10px')}>
                Preseason only — no 2026 opponent-adjusted on-field stats exist yet for any FBS team. Built from recruiting talent, returning production, transfer portal value, and coaching continuity.
              </div>
            </div>
          )}

          {/* "Two systems, one team" — offense trend + defense trend, unchanged
              charts, kept as sub-labelled cards per README §1's CFB table
              (no ribbon on these two, per the ribbon-conversion table). */}
          {selectedSeries.length > 0 && (
            <div id="two-systems" style={st('display:flex;flex-direction:column;gap:16px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Two systems, one team</div>
              <div style={st('display:flex;gap:20px;flex-wrap:wrap')}>
                <div style={st('flex:1;min-width:320px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Offense trend</div>
                  <div style={st('display:flex;align-items:baseline;gap:10px;background:var(--surface-page);border-radius:var(--radius-sm);padding:10px 16px;margin-bottom:16px')}>
                    <span style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);flex-shrink:0')}>Biggest mover</span>
                    <span style={st('font:600 15px var(--font-sans);color:var(--ink)')}>{offenseMover}</span>
                  </div>
                  <div style={st('display:grid;grid-template-columns:65% 35%;gap:16px;align-items:center')}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                        <svg viewBox={`0 0 ${offenseChart.chartW} ${offenseChart.chartH}`} width="100%" height={offenseChart.chartH} style={{ display: 'block' }}>
                          <line x1={offenseChart.padL} y1={offenseChart.padT} x2={offenseChart.padL} y2={offenseChart.chartH} stroke="var(--hairline)" />
                          {offenseChart.lines.map((ln) => (
                            <React.Fragment key={ln.key}>
                              <path d={ln.path} fill="none" stroke={ln.color} strokeWidth="2.5" strokeDasharray={ln.dash} />
                              {ln.dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="5" fill={ln.color} onMouseEnter={d.onEnter} onMouseLeave={d.onLeave} style={{ cursor: 'pointer' }} />)}
                            </React.Fragment>
                          ))}
                        </svg>
                        <div style={st(offenseChart.axisTopStyle)}>Better</div>
                        <div style={st(offenseChart.axisBottomStyle)}>Worse</div>
                        {offenseHoverVisible && <div style={st(hoverTipStyle)}>{chartHover.text}</div>}
                      </div>
                      <div style={st('width:100%;font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>Normalized index per metric, higher = better performance — hover for exact values.</div>
                    </div>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {offenseChart.lines.map((ln) => (
                        <div key={ln.key} style={st('display:flex;align-items:center;gap:8px')}>
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: ln.color, flexShrink: 0, display: 'inline-block' }} />
                          <div style={st('font:600 13px/1.3 var(--font-sans);color:var(--ink-muted)')}>{ln.shortLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={st('flex:1;min-width:320px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Defense trend</div>
                  <div style={st('display:flex;align-items:baseline;gap:10px;background:var(--surface-page);border-radius:var(--radius-sm);padding:10px 16px;margin-bottom:16px')}>
                    <span style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);flex-shrink:0')}>Biggest mover</span>
                    <span style={st('font:600 15px var(--font-sans);color:var(--ink)')}>{defenseMover}</span>
                  </div>
                  <div style={st('display:grid;grid-template-columns:65% 35%;gap:16px;align-items:center')}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                        <svg viewBox={`0 0 ${defenseChart.chartW} ${defenseChart.chartH}`} width="100%" height={defenseChart.chartH} style={{ display: 'block' }}>
                          <line x1={defenseChart.padL} y1={defenseChart.padT} x2={defenseChart.padL} y2={defenseChart.chartH} stroke="var(--hairline)" />
                          {defenseChart.lines.map((ln) => (
                            <React.Fragment key={ln.key}>
                              <path d={ln.path} fill="none" stroke={ln.color} strokeWidth="2.5" strokeDasharray={ln.dash} />
                              {ln.dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="5" fill={ln.color} onMouseEnter={d.onEnter} onMouseLeave={d.onLeave} style={{ cursor: 'pointer' }} />)}
                            </React.Fragment>
                          ))}
                        </svg>
                        <div style={st(defenseChart.axisTopStyle)}>Better</div>
                        <div style={st(defenseChart.axisBottomStyle)}>Worse</div>
                        {defenseHoverVisible && <div style={st(hoverTipStyle)}>{chartHover.text}</div>}
                      </div>
                      <div style={st('width:100%;font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>Normalized index per metric, higher = better performance (accounts for lower-is-better stats) — hover for exact values.</div>
                    </div>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {defenseChart.lines.map((ln) => (
                        <div key={ln.key} style={st('display:flex;align-items:center;gap:8px')}>
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: ln.color, flexShrink: 0, display: 'inline-block' }} />
                          <div style={st('font:600 13px/1.3 var(--font-sans);color:var(--ink-muted)')}>{ln.shortLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* §3.3 Schedule rail — one column per real week of the schedule,
              bar height = this team's own win probability, em-dashed slots
              where the model hasn't run that game yet. Placed immediately
              before the gauntlet, per README §3.3. */}
          {hasPowerData && fullTeamSchedule.length > 0 && (
            <div id="schedule" style={st('display:flex;flex-direction:column;gap:16px')}>
              <SectionRibbon label="Schedule" color={activeTeamColor} />
              <div style={st('overflow-x:auto')}>
                <div style={st(`display:grid;grid-template-columns:repeat(${scheduleMaxWeek},minmax(64px,1fr));gap:8px;align-items:end;min-width:${scheduleMaxWeek * 72}px`)}>
                  {scheduleRailWeeks.map((g, i) => {
                    const wk = i + 1;
                    const hasProb = !!(g && g.win_prob !== null && g.win_prob !== undefined);
                    const pct = hasProb ? Math.round(g.win_prob * 100) : null;
                    const barH = hasProb ? Math.max(10, Math.round(g.win_prob * 104)) : 10;
                    const site = g ? (g.neutral_site ? 'Neutral' : (g.home ? 'Home' : 'Away')) : '—';
                    return (
                      <div key={wk} style={st('display:flex;flex-direction:column')}>
                        <div style={st('height:104px;flex-shrink:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center')}>
                          {hasProb && <div style={st(`font:900 17px/1 var(--font-sans);color:${activeTeamColor};margin-bottom:4px`)}>{pct}%</div>}
                          <div style={st(`width:100%;height:${barH}px;background:${hasProb ? activeTeamColor : 'var(--hairline)'};border-radius:2px 2px 0 0`)} />
                        </div>
                        <div style={st(`height:56px;padding-top:8px;border-top:1px solid ${hasProb ? 'var(--ink)' : 'var(--hairline)'};display:flex;flex-direction:column;gap:2px`)}>
                          <div style={st('font:700 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)')}>WK {wk}</div>
                          <div style={st(g ? 'font:700 14px var(--font-sans);color:var(--ink)' : 'font:600 14px var(--font-sans);color:var(--ink-faint)')}>{g ? g.opponent : '—'}</div>
                          <div style={st('font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)')}>{site}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={st('font:400 12px/1.5 var(--font-sans);color:var(--ink-faint)')}>
                {scheduleLoadedCount} of {scheduleMaxWeek} week{scheduleMaxWeek === 1 ? '' : 's'} loaded with a real win probability — the rest fill in with opponent, site and a per-game number as the model runs them.
              </div>
            </div>
          )}

          {/* §3.4 The Week N gauntlet — Arkansas's own game against whichever
              team is on screen, read straight off Arkansas's schedule row.
              Only renders when this team is actually on Arkansas's slate. */}
          {gauntletGame && gauntletPct != null && (
            <div id="gauntlet" style={st('display:flex;flex-direction:column;gap:16px')}>
              <SectionRibbon label={`The Week ${gauntletGame.week} gauntlet`} color={activeTeamColor} />
              <div style={st('margin:0 -40px;background:var(--surface-dark);padding:40px;display:grid;grid-template-columns:280px minmax(0,1fr);gap:44px;align-items:center')}>
                <div>
                  <div style={st('font:900 88px/.85 var(--font-sans);color:var(--paper)')}>{gauntletPct}%</div>
                  <div style={st('font:600 17px var(--font-sans);color:var(--paper);opacity:.8;margin-top:10px')}>Arkansas win probability, at {gauntletHostTeam}</div>
                </div>
                <div style={st('display:flex;flex-direction:column;gap:22px')}>
                  <div style={st('font:400 21px/1.5 var(--font-sans);color:var(--paper)')}>{gauntletRead}</div>
                  <div style={st('display:flex;gap:32px;flex-wrap:wrap;border-top:1px solid rgba(247,244,236,.2);padding-top:18px')}>
                    <div>
                      <div style={st('font:900 22px var(--font-sans);color:var(--paper)')}>{gauntletHomeEdgeLabel}</div>
                      <div style={st('font:600 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--paper);opacity:.6;margin-top:4px')}>Home field edge</div>
                    </div>
                    <div>
                      <div style={st('font:900 22px var(--font-sans);color:var(--paper)')}>{gauntletMarginLabel}</div>
                      <div style={st('font:600 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--paper);opacity:.6;margin-top:4px')}>Predicted margin</div>
                    </div>
                    <div>
                      <div style={st('font:900 22px var(--font-sans);color:var(--paper)')}>{`Wk ${gauntletGame.week} · ${gauntletArkansasHome ? 'at Arkansas' : `at ${activeTeam}`}`}</div>
                      <div style={st('font:600 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--paper);opacity:.6;margin-top:4px')}>Week &amp; site</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* §3.6 Model SWOT — inverted from the NFL pattern: the strongest
              claim leads full-width on ink, with the two best real inputs as
              flags; the weakest input leads the weakness card below it. */}
          {profile && (
            <div id="model-swot" style={st('display:flex;flex-direction:column;gap:16px')}>
              <SectionRibbon label="Model SWOT" color={activeTeamColor} />
              <div style={st('background:var(--surface-dark);border-radius:var(--radius-md);padding:var(--card-padding);display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:28px;align-items:center')}>
                <div style={st('font:700 26px/1.32 var(--font-sans);color:var(--paper)')}>{swotStrengthHeadline}</div>
                <div style={st('display:flex;flex-direction:column;gap:14px;border-left:1px solid rgba(247,244,236,.2);padding-left:24px')}>
                  {swotStrengthFlags.map((f) => (
                    <div key={f.label}>
                      <div style={st('font:900 34px/.95 var(--font-sans);color:var(--value-positive-light)')}>{f.flag}</div>
                      <div style={st('font:600 13px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--paper);opacity:.7;margin-top:4px')}>{f.label}</div>
                    </div>
                  ))}
                  {swotStrengthFlags.length === 0 && <div style={st('font:600 13px var(--font-sans);color:var(--paper);opacity:.6')}>—</div>}
                </div>
              </div>
              <div style={st('display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px')}>
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px;border-left:3px solid var(--value-risk)')}>
                  <div style={st('display:flex;align-items:flex-start;justify-content:space-between;gap:16px')}>
                    <div style={st('font:700 18px/1.35 var(--font-sans);color:var(--ink)')}>{swotWeaknessHeadline}</div>
                    {swotWeaknessFlag && (
                      <div style={st('flex-shrink:0;text-align:right')}>
                        <div style={st('font:900 30px/.95 var(--font-sans);color:var(--value-risk)')}>{swotWeaknessFlag.flag}</div>
                        <div style={st('font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-top:2px')}>{swotWeaknessFlag.label}</div>
                      </div>
                    )}
                  </div>
                  {/* Full original risks list (not sliced) — swotWeaknessHeadline
                      above is freshly generated, not drawn from risks[0], so
                      nothing from the profile's own written copy is dropped. */}
                  {profile.whyModelThinks.risks.length > 0 && (
                    <ul style={st('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px')}>
                      {profile.whyModelThinks.risks.map((t, i) => <li key={i} style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink-muted)')}>{t}</li>)}
                    </ul>
                  )}
                </div>
                <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px;border-left:3px solid var(--value-positive)')}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--value-positive)')}>Also working</div>
                  {profile.whyModelThinks.optimism.length > 0 ? (
                    <ul style={st('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px')}>
                      {profile.whyModelThinks.optimism.map((t, i) => <li key={i} style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink)')}>{t}</li>)}
                    </ul>
                  ) : (
                    <div style={st('font:400 14px var(--font-sans);color:var(--ink-faint)')}>—</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* §3.5 Team DNA, as it fills in — three live rows (percentile bar),
              five pending rows (dashed empty track) instead of eight bars
              where five are quietly zero. */}
          {hasPowerData && (
            <div id="team-dna" style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:14px')}>
              <SectionRibbon label="Team DNA, as it fills in" color={activeTeamColor} />
              <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint)')}>Three dimensions are live in August; five unlock once this team has played a real, opponent-adjusted game.</div>
              <div style={st('display:flex;flex-direction:column')}>
                {dnaLiveDims.map((d) => (
                  <div key={d.label} style={st('display:grid;grid-template-columns:230px minmax(0,1fr) 70px;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--hairline)')}>
                    <div>
                      <div style={st('font:700 18px var(--font-sans);color:var(--ink)')}>{d.label}</div>
                      <div style={st('font:400 13px/1.4 var(--font-sans);color:var(--ink-faint)')}>{DNA_DIM_NOTES[d.label] || ''}</div>
                    </div>
                    <div style={st('height:12px;border-radius:var(--radius-pill);background:var(--hairline);position:relative;overflow:hidden')}>
                      <div style={st(`position:absolute;top:0;bottom:0;left:0;width:${Math.max(0, Math.min(100, d.pct))}%;background:var(--brass);border-radius:var(--radius-pill)`)} />
                    </div>
                    <div style={st('font:700 16px var(--font-sans);color:var(--ink);text-align:right')}>{Math.round(d.pct)}</div>
                  </div>
                ))}
                {dnaPendingDims.map((d) => (
                  <div key={d.label} style={st('display:grid;grid-template-columns:230px minmax(0,1fr) 70px;gap:14px;align-items:center;padding:12px 0;border-top:1px dashed var(--hairline)')}>
                    <div>
                      <div style={st('font:600 16px var(--font-sans);color:var(--ink-faint)')}>{d.label}</div>
                      <div style={st('font:400 13px/1.4 var(--font-sans);color:var(--ink-faint)')}>{DNA_DIM_NOTES[d.label] || ''}</div>
                    </div>
                    <div style={st('height:1px;border-top:1px dashed var(--hairline)')} />
                    <div style={st('font:600 12px var(--font-sans);color:var(--ink-faint);text-align:right')}>Week 1</div>
                  </div>
                ))}
              </div>
              <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);border-top:1px solid var(--hairline);padding-top:10px')}>Pending dimensions need opponent-adjusted on-field stats — those unlock once this team has played, starting Week 1.</div>
            </div>
          )}

          {/* Coaching · Home field edge · Run / pass lean — per README §1's
              CFB ribbon table. Preseason Personnel's three bars are now
              folded into "What the number is built from" (§3.2) above. */}
          {hasPowerData && (
            <div style={st('display:flex;gap:20px;flex-wrap:wrap')}>
              <div id="coaching" style={st(`flex:1;min-width:260px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);border:${coachCardBorder}`)}>
                <SectionRibbon label="Coaching" color={activeTeamColor} />
                <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px')}>
                  <div style={st('font:700 20px var(--font-sans);color:var(--ink)')}>{coachName}</div>
                  {coachIsNew && <span style={st('font:700 10px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;background:var(--brass);color:var(--ink);padding:3px 8px;border-radius:999px')}>New in 2026</span>}
                  {coachIsFirstTime && <span style={st('font:700 10px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;background:var(--surface-page);color:var(--ink-muted);padding:3px 8px;border-radius:999px;border:1px solid var(--hairline)')}>First-time HC</span>}
                </div>
                {coachIsNew && <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>previously: {coachPrev}</div>}
                {coachNoChange && <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>No coaching change this season</div>}
              </div>

              <div id="home-field-edge" style={st('flex:0 1 220px;min-width:200px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;justify-content:center')}>
                <SectionRibbon label="Home field edge" color={activeTeamColor} />
                <div style={st('font:900 30px var(--font-sans);color:var(--ink);margin-top:14px')}>{homeEdgeLabel}</div>
                <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:4px')}>Adjustment to this team's predicted margin when playing at home — can be negative for teams with a poor home track record.</div>
              </div>

              <div id="run-pass-lean" style={st('flex:1;min-width:260px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                <SectionRibbon label="Run / pass lean" color={activeTeamColor} />
                <div style={st('display:flex;justify-content:space-between;font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-top:14px;margin-bottom:6px')}>
                  <span>Leans Run &#8592;</span><span>&#8594; Leans Pass</span>
                </div>
                <div style={st('position:relative;height:12px;background:var(--hairline);border-radius:3px')}>
                  <div style={st('position:absolute;top:-2px;bottom:-2px;left:50%;width:1px;background:var(--ink-faint)')} />
                  <div style={st(leanMarkerStyle)} />
                </div>
                <div style={st('font:600 13px var(--font-sans);color:var(--ink-muted);margin-top:10px')}>{fragilityLabel}</div>
              </div>
            </div>
          )}

          {/* Power Score trend — chart + week-over-week table, unchanged
              content, moved to close out the page per README §3.7's rail
              order and re-labelled per §1's CFB ribbon table. */}
          {selectedSeries.length > 0 && (
            <div id="power-score-trend" style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:16px')}>
              <SectionRibbon label="Power Score trend" color={activeTeamColor} />
              <div style={st('display:grid;grid-template-columns:45% 55%;gap:28px;align-items:stretch')}>
                <div style={{ minWidth: 0, marginLeft: 14 }}>
                  <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                    <div style={st('position:absolute;left:-14px;top:0;bottom:34px;display:flex;align-items:center;justify-content:center;width:14px')}>
                      <span style={st('display:inline-block;transform:rotate(-90deg);white-space:nowrap;font:700 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint)')}>Power Score</span>
                    </div>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} preserveAspectRatio="none" style={{ display: 'block' }}>
                      {yTicks.map((tick, i) => <line key={i} x1={padL - 8} y1={tick.y} x2={chartW} y2={tick.y} stroke="var(--hairline)" />)}
                      {zeroY !== null && <line x1={padL - 8} y1={zeroY} x2={chartW} y2={zeroY} stroke="var(--ink-faint)" strokeDasharray="4 4" />}
                      {showPinnedOverlay && pinnedGeom.path && <path d={pinnedGeom.path} fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeDasharray="5 5" />}
                      <path d={selectedGeom.path} fill="none" stroke={pinnedAccentColor} strokeWidth="3" />
                      {selectedGeom.dots.map((d, i) => (
                        <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={pinnedAccentColor}>
                          <title>{d.label} — {activeTeam}: {d.value}</title>
                        </circle>
                      ))}
                    </svg>
                    {yTicks.map((tick, i) => <div key={i} style={st(tick.style)}>{tick.label}</div>)}
                    {selectedGeom.dots.map((d, i) => <div key={i} style={st(d.xLabelStyle)}>{d.label}</div>)}
                  </div>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:6px;width:100%;text-align:center')}>Week</div>
                </div>
                <div style={{ minWidth: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px')}>Week-over-week</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ minWidth: 760 }}>
                      <DataTable columns={weekTableProps.columns} rows={weekTableProps.rows} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSeries.length === 0 && (
            <p style={st('font:400 16px var(--font-sans);color:var(--ink-muted)')}>No history for {activeTeam || 'this team'} yet.</p>
          )}
          </div>
        </div>
      )}

      {tab === 'glossary' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:26px;max-width:760px')}>
          <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:20px')}>
            {GLOSSARY_TERMS.map((gl) => (
              <div key={gl.term}>
                <div style={st('font:700 17px var(--font-sans);color:var(--ink);margin-bottom:4px')}>{gl.term}</div>
                <div style={st('font:400 15px/1.5 var(--font-sans);color:var(--ink-muted)')}>{gl.def}</div>
              </div>
            ))}
          </div>
          <div style={st('font:400 13px/1.5 var(--font-sans);color:var(--ink-faint)')}>For the full methodology and validation results behind these terms, see the <a href="methodology.html" style={st('color:var(--accent-primary);font-weight:700')}>Methodology page</a>.</div>
        </div>
      )}

      <div style={st('margin-top:auto;padding:18px 40px;border-top:1px solid var(--hairline);font:400 13px var(--font-sans);color:var(--ink-faint)')}>
        This is a static snapshot generated locally by the pipeline and redeployed periodically — it doesn't refresh live in the browser.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
