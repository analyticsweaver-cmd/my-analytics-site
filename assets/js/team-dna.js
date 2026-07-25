/*
Shared Team DNA component
========================================================================
Companion component for TEAM_PROFILE_DESIGN_SYSTEM.md's "Team DNA" section
(signature site visual — identity, not grades: "what kind of football team
is this?", not "how good are they?"). Built once here and loaded by BOTH
nfl-model/app.jsx and cfb-model/app.jsx (via a <script> tag before each
page's own app.jsx) instead of being reinvented per page — the audit that
led to this file found three different, unrelated "identity bar" charts
already on the site (NFL's Score Breakdown, CFB's Preseason Personnel,
CFB's Run/Pass Lean marker), none of which matched this spec. This file
is the first genuinely shared, reused component across the two dashboards.

Deliberately dumb/presentational: it renders unidirectional intensity bars
(0-100%) from whatever { label, pct, note } dimensions it's handed. Each
app computes its own percentiles locally (percentileRank() below) from
its own already-loaded data — the two models' underlying metrics are
different (NFL: Baseline/Need-Fill/Scheme/Stability; CFB: talent/returning
production/portal/coaching), so percentile computation stays app-specific
while the visual component itself is shared.

No new pipeline/data work required to use this - every dimension both
pages currently feed it comes from data the pipelines already compute.
*/

// Percentile rank of `target` within `values` (0-100). Ties get the
// average rank of the tied group (standard "mid-rank" percentile), so a
// value tied for best among 32 teams doesn't misleadingly show 100%
// when others share it.
function percentileRank(values, target) {
  const clean = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v))).map(Number);
  if (clean.length === 0 || target === null || target === undefined || Number.isNaN(Number(target))) return null;
  const t = Number(target);
  let below = 0, equal = 0;
  clean.forEach((v) => {
    if (v < t) below += 1;
    else if (v === t) equal += 1;
  });
  return Math.round(((below + equal / 2) / clean.length) * 100);
}

// dimensions: [{ label, pct (0-100, already computed), note (optional) }]
function TeamDNA({ st, dimensions, footnote }) {
  const rows = (dimensions || []).filter((d) => d.pct !== null && d.pct !== undefined);
  if (rows.length === 0) return null;
  return (
    <div style={st('display:flex;flex-direction:column;gap:10px')}>
      {rows.map((d) => (
        <div key={d.label} style={st('display:flex;align-items:center;gap:14px')}>
          <span style={st('width:160px;flex-shrink:0;font:600 13px var(--font-sans);color:var(--ink-muted)')}>{d.label}</span>
          <div style={st('flex:1;background:var(--hairline);border-radius:999px;height:10px;overflow:hidden')}>
            <div style={{ width: `${Math.max(2, Math.min(100, d.pct))}%`, height: '100%', borderRadius: 999, background: 'var(--brass)' }} />
          </div>
          <span style={st('width:70px;flex-shrink:0;text-align:right;font:600 12px var(--font-sans);color:var(--ink-faint)')}>
            {d.note || `${d.pct}th pct.`}
          </span>
        </div>
      ))}
      {footnote && (
        <div style={st('font:400 12px var(--font-sans);color:var(--ink-faint);margin-top:2px')}>{footnote}</div>
      )}
    </div>
  );
}
