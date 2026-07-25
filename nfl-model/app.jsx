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
  { id: 'playoff', label: 'Playoff Picture', tone: 'var(--value-positive)', textOn: 'var(--paper)' },
];

function App() {
  const [s, setStateRaw] = useState({
    tab: 'rankings',
    power: [],
    winProjections: [],
    monteCarlo: [],
    playoff: [],
    keyPerson: [],
    matchupByWeek: {},
    availableWeeks: [],
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
        playoff: data.playoff || [],
        keyPerson: data.key_person || [],
        matchupByWeek: data.matchup_by_week || {},
        availableWeeks: weeks,
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

  const { power, winProjections, monteCarlo, playoff, keyPerson, matchupByWeek, tab, glossaryOpen, validationOpen, pinnedTeam } = s;

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
          <span title={r.rationale || ''} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

    return {
      key, ...g,
      cardStyle: `border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card);border:${g._isPinnedGame ? `2px solid ${pinnedAccentColor}` : '1px solid var(--hairline)'}`,
      homeColor, awayColor, homeWinPct, expanded,
      onToggle: () => setState({ expandedMatchup: expanded ? null : key }),
      contributionBars, contributionScale,
      spreadLabel: g.spread != null ? `${g.home_team} ${signed(g.spread, 1)}` : '—',
      hfaNote: g.neutral_site ? 'Neutral site — no home field adjustment' : `Home field adjustment: ${signed(g.hfa_adj, 1)} pts`,
    };
  });

  // ---------------- Team Detail tab ----------------
  const teams = [...new Set(power.map((r) => r.team))].sort();
  const activeTeam = teams.includes(s.selectedTeam) ? s.selectedTeam : (teams[0] || pinnedTeam);
  const activeRow = power.find((r) => r.team === activeTeam);
  const activeProj = winProjections.find((r) => r.team === activeTeam);
  const activeMC = monteCarlo.find((r) => r.team === activeTeam);
  const activePlayoff = playoff.find((r) => r.team === activeTeam);
  const activeKeyPerson = keyPerson.filter((r) => r.team === activeTeam);
  const snapshotBg = teamColor(activeTeam);
  const snapshotTextColor = readableTextColor(snapshotBg);

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
            <a href="methodology.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>Methodology</a>
            <a href="../cfb-model/index.html" style={st('font:700 11px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);text-decoration:none')}>CFB Model</a>
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
        <p style={st('font:400 16px/1.5 var(--font-sans);color:var(--ink-muted);margin:0')}>Power ratings, schedule projections, win-total uncertainty, and playoff odds — a preseason snapshot, not a weekly-updated live model. Pin any team to keep it visible across every tab.</p>
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
                    <span style={st('font:700 18px var(--font-sans);color:var(--ink)')}>{g.away_team} <span style={st('color:var(--ink-muted);font-weight:400')}>at</span> {g.home_team}{g.neutral_site && <span style={st('font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-left:8px')}>Neutral site</span>}</span>
                    <span style={st('font:700 15px var(--font-sans);color:var(--ink)')}>{g.spreadLabel}</span>
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
                    <span>{pct(1 - (g.win_prob || 0.5))} win</span>
                    <span>{pct(g.win_prob || 0.5)} win</span>
                  </div>
                  <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>{g.hfaNote} · {g.away_team} power {num(g.away_power, 2)}, {g.home_team} power {num(g.home_power, 2)} · {g.expanded ? 'Hide' : 'Show'} spread breakdown</div>
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

          {activeRow && (
            <div style={st(`background:${snapshotBg};border-radius:var(--radius-md);padding:var(--card-padding);display:flex;flex-direction:column;gap:18px`)}>
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
              </div>
              <div style={st(`font:400 17px/1.5 var(--font-sans);color:${snapshotTextColor};opacity:.9`)}>{activeRow.rationale}</div>
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

          <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:16px')}>
            <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Key-Person Dependency</div>
            {activeKeyPerson.length > 0 ? activeKeyPerson.map((k) => (
              <div key={k.player} style={st('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 0;border-top:1px solid var(--hairline)')}>
                <div>
                  <div style={st('font:700 15px var(--font-sans);color:var(--ink)')}>{k.player} <span style={st('font-weight:400;color:var(--ink-muted)')}>({k.position})</span></div>
                  <div style={st(`font:600 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:${confidenceColor(k.confidence)}`)}>{k.confidence}</div>
                </div>
                <div style={st('display:flex;gap:24px;font:600 14px var(--font-sans);color:var(--ink)')}>
                  <span>If healthy: <b>{num(k.power_score_if_healthy, 2)}</b></span>
                  <span>If down: <b>{num(k.power_score_if_down, 2)}</b></span>
                  <span style={st('color:var(--value-risk)')}>Cliff: <b>{signed(k.cliff, 2)}</b></span>
                </div>
              </div>
            )) : (
              <div style={st('font:400 14px/1.5 var(--font-sans);color:var(--ink-faint)')}>No single flagged player currently drives this team's projection — Key-Person Dependency is only computed for teams with a high-Downside player identified in the model's risk scoring.</div>
            )}
          </div>

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
