(function () {
  const DATA_URL = "assets/data/arkansas-2026.json";

  function fmtZ(z) {
    if (z === null || z === undefined) return "—";
    const sign = z > 0 ? "+" : "";
    return sign + z.toFixed(2);
  }

  function pct(x) {
    return Math.round(x * 100) + "%";
  }

  function usageBar(fillPct, label, colorClass) {
    const clamped = Math.max(0, Math.min(100, fillPct));
    const fillEl = fillPct === null
      ? `<div class="usage-bar-fill no-data" style="width:100%"></div>`
      : `<div class="usage-bar-fill" style="width:${clamped}%"></div>`;
    return `<div class="usage-bar">${fillEl}</div><div class="usage-label">${label}</div>`;
  }

  function departedRow(p) {
    const bar = p.usage_pct !== null
      ? usageBar(p.usage_pct * 100, `${pct(p.usage_pct)} snap share, ${p.prev_season_label || "last season"}`)
      : usageBar(null, "No snap-share data on record");
    return `
      <div class="player-row">
        <div class="p-top"><span class="p-name">${p.name}</span><span class="p-pos">${p.position}</span></div>
        <div class="p-detail">${p.detail}</div>
        ${bar}
      </div>`;
  }

  function returningRow(p) {
    const bar = p.usage_pct !== null
      ? usageBar(p.usage_pct * 100, `${pct(p.usage_pct)} snap share last season`)
      : usageBar(null, "No snap-share data on record");
    const yr = p.class_year ? `Yr ${p.class_year}` : "";
    return `
      <div class="player-row">
        <div class="p-top"><span class="p-name">${p.name}</span><span class="p-pos">${p.position}</span></div>
        ${yr ? `<div class="p-detail">${yr}</div>` : ""}
        ${bar}
      </div>`;
  }

  function incomingRow(p) {
    let detail, bar;
    if (p.type === "transfer") {
      detail = `Transfer from ${p.origin_team}${p.stars ? " · " + p.stars + "★" : ""}`;
      bar = p.usage_pct_prior !== null
        ? usageBar(p.usage_pct_prior * 100, `${pct(p.usage_pct_prior)} snap share at ${p.origin_team} last season`)
        : usageBar(null, "No prior snap-share match — recruiting rating only");
    } else {
      detail = `HS Signee${p.stars ? " · " + p.stars + "★" : ""}`;
      const ratingPct = p.rating !== null ? p.rating * 100 : null;
      bar = usageBar(ratingPct, ratingPct !== null ? "Recruiting rating (no college snaps yet)" : "No rating on record");
    }
    return `
      <div class="player-row">
        <div class="p-top"><span class="p-name">${p.name}</span><span class="p-pos">${p.position}</span></div>
        <div class="p-detail">${detail}</div>
        ${bar}
      </div>`;
  }

  function renderGroup(g) {
    const departed = g.departed.length
      ? g.departed.map(departedRow).join("")
      : `<div class="empty-note">Nobody departed here.</div>`;
    const returning = g.returning.length
      ? g.returning.map(returningRow).join("")
      : `<div class="empty-note">Nobody returning here.</div>`;
    const incoming = g.incoming.length
      ? g.incoming.map(incomingRow).join("")
      : `<div class="empty-note">No new additions yet.</div>`;

    return `
      <div class="roster-group">
        <div class="roster-group-head">
          <h3>${g.group}</h3>
          <span class="counts">${g.returning.length} returning · ${g.departed.length} departed · ${g.incoming.length} incoming</span>
        </div>
        <div class="roster-group-body">
          <div class="roster-col departed">
            <div class="col-label">Departed</div>
            ${departed}
          </div>
          <div class="roster-col returning">
            <div class="col-label">Returning</div>
            ${returning}
          </div>
          <div class="roster-col incoming">
            <div class="col-label">Incoming</div>
            ${incoming}
          </div>
        </div>
      </div>`;
  }

  function render(data) {
    const h = data.headline || {};
    document.getElementById("stat-returning-prod").textContent = fmtZ(h.returning_production_z);
    document.getElementById("stat-portal-net").textContent = fmtZ(h.portal_net_z);
    document.getElementById("stat-talent").textContent = fmtZ(h.talent_z);
    document.getElementById("stat-reliance").textContent = fmtZ(h.reliance_z);
    document.getElementById("stat-reliance-note").textContent =
      `Fragility type: ${h.fragility_type || "unknown"} — this roster leans hardest on ${
        h.fragility_type === "run-reliant" ? "the run game" :
        h.fragility_type === "pass-reliant" ? "the pass game" : "no single phase"
      } to carry the offense.`;

    const c = data.summary_counts;
    document.getElementById("stat-turnover-count").textContent = `${c.departed} / ${c.returning + c.departed}`;
    document.getElementById("stat-turnover-note").textContent =
      `${c.departed} of last season's ${c.returning + c.departed} roster spots turned over — replaced by ${c.incoming_transfer} portal transfers and ${c.incoming_recruit} incoming signees.`;

    document.getElementById("roster-groups").innerHTML =
      data.position_groups.map(renderGroup).join("");

    document.getElementById("generated-note").textContent =
      `Roster data current as of ${new Date(data.generated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Source: CollegeFootballData.com (/roster, /player/portal, /player/usage, /draft/picks, /recruiting/players).`;
  }

  fetch(DATA_URL)
    .then((r) => r.json())
    .then(render)
    .catch((err) => {
      document.getElementById("roster-groups").innerHTML =
        `<div class="card"><p>Couldn't load roster data (${err}). Run cfb_roster_turnover.py --team Arkansas to regenerate assets/data/arkansas-2026.json.</p></div>`;
    });
})();
