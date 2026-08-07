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
  { term: 'Success Rate', def: 'The percentage of plays that gain enough yardage to keep a drive "on schedule" (roughly: 50% of yards needed on 1st down, 70% on 2nd, 100% on 3rd/4th). Measures consistency, not big plays.' },
  { term: 'Explosiveness', def: 'Average yards gained per successful play. Measures big-play ability — a team can be efficient (high success rate) without being explosive, or vice versa.' },
  { term: 'Havoc Rate', def: 'How often a defense creates a disruptive play — a tackle for loss, forced fumble, interception, or pass breakup.' },
  { term: 'Run Game / Pass Game', def: "Compares one team's rushing (or passing) success rate against the specific opponent's rushing (or passing) defense — separate from the overall Success Rate bar above, which blends both together." },
  { term: 'Coaching Continuity', def: 'Reflects whether either team is dealing with a new head coach this season, and whether that coach is a first-time hire (bigger disruption) or an experienced one (smaller disruption). A team with a stable, continuous staff scores better here than one adjusting to a coaching change.' },
  { term: 'Model Edge', def: "The difference between this model's predicted margin and what the betting market's spread implies. Positive means the model favors the home team more than the market does; negative means it favors the away team more." },
  { term: 'Home Field Edge', def: "Points added to the home team's predicted margin, based on that specific team's historical home performance — not a flat number applied to every stadium." },
  { term: 'SP+', def: 'An independent, well-established power rating (built by a college football analytics site, not this model) shown alongside our number as a sanity check.' },
];

const CFB_VALIDATION_STATS = [
  { headline: 'Backtested across three seasons: pooled MAE 13.71, RMSE 17.41 (2023\u20132025, n=1,979 games)', gloss: 'Walk-forward validation, pooled for real statistical power rather than trusted one season at a time. The matchup-decomposed model (rush/pass/havoc/coaching edges) beats the aggregate Power Score model on pooled accuracy: 13.65 MAE vs. 13.71.' },
  { headline: 'Win-probability calibration: Brier score 0.208 (naive always-50% baseline: 0.250)', gloss: 'A real, substantial improvement over guessing. Unlike the NFL sibling model, this came back well-calibrated out of the box \u2014 the tail-overconfidence problem that needed a Monte Carlo-averaging fix on the NFL side doesn\u2019t show up here, so no equivalent fix was needed.' },
  { headline: 'A 2026-08-06 pooling pass found and fixed two real bugs', gloss: 'Coaching-continuity signal was silently zero in every backtest run to date (never actually threaded into the multi-season code). Separately, pooling exposed real multicollinearity \u2014 three coefficients flipped sign between the single-season and pooled fits \u2014 fixed by dropping the redundant success_diff term. Both caught by pooling three seasons together instead of validating one at a time.', link: { href: 'methodology.html', label: 'Read the full methodology \u2192' } },
  { headline: 'The run/pass fragility flag was checked and found not to predict backtest error', gloss: 'Fragile teams\u2019 error is only 0.244 points higher than balanced teams\u2019, against a standard error of 0.422 \u2014 within noise, not a real effect. Reported as an honest negative result: the flag stays a qualitative watchlist tool on team pages, never wired into the actual rating.' },
];

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
    glossaryOpen: false,
    validationOpen: false,
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
      setState({
        powerRows: data.power || [],
        historyRows: data.history || [],
        matchupByWeek: data.matchup_by_week || {},
        teamSchedule: data.team_schedule || {},
        matchupRows: latestWeek != null ? (data.matchup_by_week || {})[String(latestWeek)] || [] : [],
        availableWeeks: weeks,
        matchupWeek: latestWeek,
        weekInput: latestWeek != null ? String(latestWeek) : '',
        generatedAt: data.generated_at || null,
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
  const { powerRows, matchupRows, historyRows, tab, sortKey, sortDir, expandedMatchup, selectedTeam, glossaryOpen, validationOpen, pinnedTeam, teamSchedule } = s;

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
  const toggleGlossary = () => setState((prev) => ({ glossaryOpen: !prev.glossaryOpen, validationOpen: false }));
  const toggleValidation = () => setState((prev) => ({ validationOpen: !prev.validationOpen, glossaryOpen: false }));
  const glossaryButtonStyle = `display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;border:1px solid var(--hairline);background:${glossaryOpen ? 'var(--ink)' : 'var(--surface-card)'};color:${glossaryOpen ? 'var(--paper)' : 'var(--ink-muted)'};font:700 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;cursor:pointer`;
  const validationButtonStyle = `display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;border:1px solid var(--hairline);background:${validationOpen ? 'var(--ink)' : 'var(--surface-card)'};color:${validationOpen ? 'var(--paper)' : 'var(--ink-muted)'};font:700 12px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;cursor:pointer`;

  const TAB_DEFS = [
    { id: 'rankings', label: 'Season Power Rankings', tone: 'var(--ink)', textOn: 'var(--paper)' },
    { id: 'matchup', label: 'Matchup Breakdown', tone: 'var(--accent-primary)', textOn: 'var(--paper)' },
    { id: 'team', label: 'Team Overview', tone: 'var(--brass)', textOn: 'var(--ink)' },
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
  const globalScaleMax = Math.max(0.001, ...rankRows.map((r) => Math.abs(Number(r.POWER_RATING_SHRUNK) || 0)));

  const SORT_FIELDS = [
    { key: 'POWER_RATING_SHRUNK', label: 'Rating' },
    { key: 'team', label: 'Team' },
    { key: 'games_played', label: 'Games' },
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
  if (tableSorted.length > topN) {
    tableDisplayRows = tableSorted.slice(0, topN);
    if (!tableDisplayRows.some((r) => r.isPinned)) {
      const pinnedFull = tableSorted.find((r) => r.isPinned);
      if (pinnedFull) tableDisplayRows = [...tableDisplayRows, pinnedFull];
    }
  }
  const rankTableProps = {
    columns: [
      {
        key: 'team', label: 'Team', render: (r) => r.isPinned ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: pinnedAccentColor, flexShrink: 0, display: 'inline-block' }} />
            {`${r.rank}. ${r.team}`}
          </span>
        ) : `${r.rank}. ${r.team}`,
      },
      {
        key: 'POWER_RATING_SHRUNK', label: 'Rating', render: (r) => {
          const val = Number(r.POWER_RATING_SHRUNK) || 0;
          const positive = val >= 0;
          const pct = Math.min(50, (Math.abs(val) / globalScaleMax) * 50);
          const color = positive ? 'var(--value-positive)' : 'var(--value-risk)';
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <div style={{ width: 56, height: 8, position: 'relative', background: 'var(--hairline)', borderRadius: 4, flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: positive ? '50%' : (50 - pct) + '%', width: pct + '%', background: color, borderRadius: 4 }} />
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{num(val, 3)}</span>
            </div>
          );
        },
      },
      { key: 'games_played', label: 'Games', render: (r) => r.games_played ?? '—' },
      { key: 'SP_PLUS', label: 'SP+', render: (r) => num(r.SP_PLUS, 1) },
      {
        key: 'pin', label: 'Pin', render: (r) => {
          const isPinned = r.isPinned;
          return (
            <button
              onClick={() => togglePin(r.team)}
              title={isPinned ? `Unpin ${r.team}` : `Pin ${r.team}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: isPinned ? pinnedAccentColor : 'var(--ink-faint)' }}>
                <path d="M12 2.5l2.99 6.06 6.69.97-4.84 4.72 1.14 6.66L12 17.77l-5.98 3.14 1.14-6.66-4.84-4.72 6.69-.97z" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
          );
        },
      },
    ],
    rows: tableDisplayRows,
  };

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
    const maxAbs = Math.max(Math.abs(g.success_contribution || 0), Math.abs(g.explosive_contribution || 0), Math.abs(g.havoc_contribution || 0), Math.abs(g.rush_contribution || 0), Math.abs(g.pass_contribution || 0), Math.abs(g.coaching_contribution || 0), 1);
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
      { label: 'Coaching continuity', value: g.coaching_contribution || 0 },
    ].map(makeBar);
    return {
      key, homeTeam: g.home_team, awayTeam: g.away_team,
      cardStyle: `border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card);border:${g._isPinnedGame ? `2px solid ${pinnedAccentColor}` : '1px solid var(--hairline)'}`,
      predictedLabel: `Model ${g.predicted_margin > 0 ? '+' : ''}${num(g.predicted_margin, 1)}`,
      marketLabel: g.market_spread != null ? `Market ${num(-g.market_spread, 1)}` : 'Market —',
      edgeLabel: g.model_edge != null ? `${g.model_edge > 0 ? '+' : ''}${num(g.model_edge, 1)} edge` : 'No line',
      edgeColor, expanded, onToggle: () => setState({ expandedMatchup: expanded ? null : key }), efficiencyBars, schemeBars,
      colorLegend: 'Bar color and position both indicate which team a stat favors — bars extending toward a team, in that team’s color, favor that team.',
      marginNote: `Predicted margin: positive = ${g.home_team} favored by that many points, negative = ${g.away_team} favored.`,
      homeFieldNote: `Home field edge applied: ${num(g.home_field_edge_used, 2)} pts${g.neutral_site ? ' (neutral site — 0 used)' : ''}`,
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

  const glossaryArrow = glossaryOpen ? '▲' : '▼';
  const validationArrow = validationOpen ? '▲' : '▼';
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
      {CFB_VALIDATION_STATS.map((v) => (
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
      <button style={st(glossaryButtonStyle)} onClick={toggleGlossary}>What do these mean? {glossaryArrow}</button>
      <button style={st(validationButtonStyle)} onClick={toggleValidation}>How well does this model actually work? {validationArrow}</button>
    </div>
  );

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

          <div style={st('max-height:560px;overflow:auto;border-radius:var(--radius-md)')}>
            {rankTableProps.rows.length
              ? <DataTable columns={rankTableProps.columns} rows={rankTableProps.rows} />
              : <div style={st('padding:40px;text-align:center;font:400 15px var(--font-sans);color:var(--ink-faint);background:var(--surface-card);border-radius:var(--radius-md)')}>No power ratings yet — run the pipeline to generate cfb_power_ratings.csv.</div>}
          </div>
        </div>
      )}

      {tab === 'matchup' && (
        <div style={st('padding:32px 40px 60px;display:flex;flex-direction:column;gap:20px')}>
          {explainerButtons}

          {glossaryPanel}
          {validationPanel}

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
                    <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>Coaching continuity is a small, occasional signal — most matchups will show close to zero here unless one team has a coaching change this season.</div>
                    <div style={st('font:600 13px var(--font-sans);color:var(--ink-faint);margin-top:4px')}>{g.homeFieldNote}</div>
                    <div style={st('font:600 12px var(--font-sans);color:var(--ink-faint)')}>{g.colorLegend}</div>
                    <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint)')}>{g.marginNote}</div>
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
              {teamOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {delta !== null && <span style={st(`font:700 15px var(--font-sans);color:${trendDeltaColor}`)}>{trendDeltaLabel}</span>}
            <button style={st(glossaryButtonStyle)} onClick={toggleGlossary}>What do these mean? {glossaryArrow}</button>
            <button style={st(validationButtonStyle)} onClick={toggleValidation}>How well does this model actually work? {validationArrow}</button>
          </div>

          {glossaryPanel}
          {validationPanel}

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

          {hasPowerData && (
            <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:12px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)')}>Team DNA</div>
              <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:-6px')}>What kind of team this is, not how good they are — each bar is this team's percentile among all {rankRows.length} teams on that dimension.</div>
              <TeamDNA st={st} dimensions={teamDNADimensions} />
            </div>
          )}

          {selectedSeries.length > 0 && (
            <>
              <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                <div style={st('display:grid;grid-template-columns:45% 55%;gap:28px;align-items:stretch')}>
                  <div style={{ minWidth: 0, marginLeft: 14 }}>
                    <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Power Score (higher = better)</div>
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
            </>
          )}

          {hasPowerData && (
            <div style={st('display:flex;gap:20px;flex-wrap:wrap')}>
              <div style={st(`flex:1;min-width:260px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);border:${coachCardBorder}`)}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Coaching Staff</div>
                <div style={st('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
                  <div style={st('font:700 20px var(--font-sans);color:var(--ink)')}>{coachName}</div>
                  {coachIsNew && <span style={st('font:700 10px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;background:var(--brass);color:var(--ink);padding:3px 8px;border-radius:999px')}>New in 2026</span>}
                  {coachIsFirstTime && <span style={st('font:700 10px var(--font-sans);letter-spacing:.05em;text-transform:uppercase;background:var(--surface-page);color:var(--ink-muted);padding:3px 8px;border-radius:999px;border:1px solid var(--hairline)')}>First-time HC</span>}
                </div>
                {coachIsNew && <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>previously: {coachPrev}</div>}
                {coachNoChange && <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:6px')}>No coaching change this season</div>}
              </div>

              <div style={st('flex:1;min-width:260px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Run / Pass Lean</div>
                <div style={st('display:flex;justify-content:space-between;font:600 11px var(--font-sans);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:6px')}>
                  <span>Leans Run &#8592;</span><span>&#8594; Leans Pass</span>
                </div>
                <div style={st('position:relative;height:12px;background:var(--hairline);border-radius:3px')}>
                  <div style={st('position:absolute;top:-2px;bottom:-2px;left:50%;width:1px;background:var(--ink-faint)')} />
                  <div style={st(leanMarkerStyle)} />
                </div>
                <div style={st('font:600 13px var(--font-sans);color:var(--ink-muted);margin-top:10px')}>{fragilityLabel}</div>
              </div>

              <div style={st('flex:1;min-width:260px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding)')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px')}>Preseason Personnel</div>
                <div style={st('display:flex;flex-direction:column;gap:10px')}>
                  {personnelBars.map((p) => (
                    <div key={p.label} style={st('display:flex;align-items:center;gap:10px')}>
                      <span style={st('width:110px;flex-shrink:0;font:600 12px var(--font-sans);color:var(--ink-muted)')}>{p.label}</span>
                      <div style={st('flex:1;height:10px;position:relative;background:var(--hairline);border-radius:3px')}>
                        <div style={st(p.fillStyle)} />
                      </div>
                      <span style={st('width:46px;text-align:right;font:600 12px var(--font-sans);color:var(--ink)')}>{p.valueLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={st('flex:0 1 220px;min-width:200px;background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;justify-content:center')}>
                <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px')}>Home Field Edge</div>
                <div style={st('font:900 30px var(--font-sans);color:var(--ink)')}>{homeEdgeLabel}</div>
                <div style={st('font:400 13px var(--font-sans);color:var(--ink-faint);margin-top:4px')}>Adjustment to this team's predicted margin when playing at home — can be negative for teams with a poor home track record.</div>
              </div>
            </div>
          )}

          {hasPowerData && fullTeamSchedule.length > 0 && (
            <div style={st('background:var(--surface-card);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--card-padding);display:flex;flex-direction:column;gap:4px')}>
              <div style={st('font:700 12px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:2px')}>
                {upcomingTeamSchedule.length ? 'Schedule journey' : 'Full schedule'}
              </div>
              {scheduleSummary && (
                <div style={st('font:400 12px/1.5 var(--font-sans);color:var(--ink-faint);margin-bottom:8px')}>{scheduleSummary}</div>
              )}
              {scheduleJourneyRows.map((g, i) => (
                <div key={`${g.week}-${g.opponent}-${i}`} style={st('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--hairline)')}>
                  <span style={st('width:26px;flex-shrink:0;font:700 11px var(--font-sans);color:var(--ink-faint)')}>W{g.week ?? '—'}</span>
                  <span style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, display: 'inline-block', background: scheduleDifficultyMeta[g.difficulty].color }} title={scheduleDifficultyMeta[g.difficulty].label} />
                  <span style={st('flex:1;font:600 13px var(--font-sans);color:var(--ink)')}>
                    {g.home ? 'vs' : '@'} {g.opponent}
                    {g.neutral_site && <span style={st('margin-left:6px;font:700 10px var(--font-sans);letter-spacing:.04em;color:var(--ink-faint)')}>NEUTRAL</span>}
                    {g.is_conference_game && <span style={st('margin-left:6px;font:700 10px var(--font-sans);letter-spacing:.04em;color:var(--ink-faint)')}>CONF</span>}
                    {g.isSwing && <span style={st('margin-left:6px;font:700 10px var(--font-sans);letter-spacing:.04em;color:var(--brass)')}>SWING</span>}
                  </span>
                  <span style={st('font:700 12px var(--font-sans);color:var(--ink-muted);text-align:right;width:38px;flex-shrink:0')}>{g.win_prob !== null && g.win_prob !== undefined ? `${Math.round(g.win_prob * 100)}%` : '—'}</span>
                  <span style={st('font:600 12px var(--font-sans);color:var(--ink-muted);text-align:right')}>{formatGameDate(g.date)}</span>
                </div>
              ))}
              <div style={st('font:400 11px var(--font-sans);color:var(--ink-faint);margin-top:8px')}>
                {upcomingTeamSchedule.length ? "Auto-filters to games on or after today's date." : "Season hasn't started yet — showing the full schedule."} Dot color and % are this team's own win probability for that game — green 60%+, gold a real toss-up, red 40%-or-worse, grey means not predicted yet. CONF = conference game, SWING = within 5 points of a coin flip.
              </div>
            </div>
          )}

          {selectedSeries.length === 0 && (
            <p style={st('font:400 16px var(--font-sans);color:var(--ink-muted)')}>No history for {activeTeam || 'this team'} yet.</p>
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
