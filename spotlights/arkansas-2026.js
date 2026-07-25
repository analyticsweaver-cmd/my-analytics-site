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

  // Hero Sankey: 7 position groups (2025) -> 4 status nodes -> 7 position
  // groups (2026), every flow weighted by player count (not usage_pct — that
  // field is only populated for ~15% of players, so weighting by it would
  // mostly be an arbitrary filler value wearing a precise-looking chart).
  // One shared px-per-player scale across all three columns (not one scale
  // per column) so bar length stays comparable across the whole diagram —
  // the middle column legitimately runs bigger than left/right since it
  // stacks both the outgoing (departed+returning) and incoming
  // (transfer+signee) totals in one place.
  const SK = {
    vbW: 900, vbH: 560, padY: 30, nodeGap: 6,
    leftX: 120, leftW: 30,
    midX: 430, midW: 24,
    rightX: 750, rightW: 30,
  };
  const RED = "var(--red)", GREEN = "var(--green)", BRASS = "var(--brass)";

  function buildSankey(positionGroups) {
    const bandH = SK.vbH - SK.padY * 2;
    const groups = positionGroups.map((g) => {
      const departed = g.departed.length;
      const returning = g.returning.length;
      const transfer = g.incoming.filter((p) => p.type === "transfer").length;
      const signee = g.incoming.length - transfer;
      return { key: g.group, departed, returning, transfer, signee, incoming: transfer + signee };
    });

    // Roster-wide totals, split by what actually happened to each departed
    // player (portal / draft / graduation) rather than by position — matches
    // WEAVER_ANALYTICS_LAB_VISION.md's own Sankey example (2025 Roster ->
    // Stayed/Transferred/Drafted/Graduated -> 2026 Roster). The incoming side
    // (Portal Additions, HS Signees) isn't in that doc's shorthand example,
    // but is kept — dropping it would mean "2026 Roster" undercounts by the
    // 50 incoming players, and "who's walking in the door" is core to the
    // mission statement in both governing docs.
    const allDeparted = positionGroups.flatMap((g) => g.departed);
    const stayed = groups.reduce((s, g) => s + g.returning, 0);
    const transferred = allDeparted.filter((p) => p.status === "portal").length;
    const drafted = allDeparted.filter((p) => p.status === "draft").length;
    const graduated = allDeparted.filter((p) => p.status === "graduated").length;
    const portalIn = groups.reduce((s, g) => s + g.transfer, 0);
    const signees = groups.reduce((s, g) => s + g.signee, 0);
    const roster2025 = stayed + transferred + drafted + graduated;
    const roster2026 = stayed + portalIn + signees;
    const midTotal = roster2025 + portalIn + signees;
    const scale = bandH / Math.max(roster2025, roster2026, midTotal);

    function stack(items, x, w) {
      const totalH = items.reduce((s, it) => s + it.value * scale, 0) + SK.nodeGap * (items.length - 1);
      let y = SK.padY + (bandH - totalH) / 2;
      return items.map((it) => {
        const h = Math.max(it.value * scale, it.value > 0 ? 1 : 0);
        const node = { ...it, x, w, y, h, inCursor: y, outCursor: y };
        y += h + SK.nodeGap;
        return node;
      });
    }

    const leftNodes = stack([{ key: "roster2025", label: "2025 Roster", value: roster2025, color: "var(--ink-faint)" }], SK.leftX, SK.leftW);
    const rightNodes = stack([{ key: "roster2026", label: "2026 Roster", value: roster2026, color: "var(--ink-faint)" }], SK.rightX, SK.rightW);
    const midNodes = stack([
      { key: "stayed", label: "Stayed", value: stayed, color: GREEN },
      { key: "transferred", label: "Transferred", value: transferred, color: RED },
      { key: "graduated", label: "Graduated", value: graduated, color: RED },
      { key: "drafted", label: "Drafted", value: drafted, color: RED },
      { key: "portal_in", label: "Portal Additions", value: portalIn, color: BRASS },
      { key: "signees", label: "HS Signees", value: signees, color: BRASS },
    ], SK.midX, SK.midW);
    const mid = Object.fromEntries(midNodes.map((n) => [n.key, n]));
    const left = leftNodes[0], right = rightNodes[0];

    const links = [];
    function link(a, b, value, color, tip) {
      if (value <= 0) return;
      const y0 = a.outCursor, y1 = b.inCursor;
      const w = value * scale;
      a.outCursor += w;
      b.inCursor += w;
      links.push({ x0: a.x + a.w, y0: y0 + w / 2, x1: b.x, y1: y1 + w / 2, w, color, tip });
    }

    link(left, mid.stayed, stayed, GREEN, `${stayed} stayed on the roster`);
    link(left, mid.transferred, transferred, RED, `${transferred} transferred out (portal)`);
    link(left, mid.graduated, graduated, RED, `${graduated} graduated`);
    link(left, mid.drafted, drafted, RED, `${drafted} drafted to the NFL`);
    link(mid.stayed, right, stayed, GREEN, `${stayed} returning in 2026`);
    link(mid.portal_in, right, portalIn, BRASS, `${portalIn} transfer portal additions`);
    link(mid.signees, right, signees, BRASS, `${signees} HS signees`);

    return { leftNodes, midNodes, rightNodes, links };
  }

  function sankeyLinkPath(l) {
    const cx = (l.x0 + l.x1) / 2;
    return `M${l.x0},${l.y0} C${cx},${l.y0} ${cx},${l.y1} ${l.x1},${l.y1}`;
  }

  function renderSankey(data) {
    const wrap = document.getElementById("sankey-wrap");
    if (!wrap || !data.position_groups.length) return;
    const sk = buildSankey(data.position_groups);
    const allNodes = [...sk.leftNodes, ...sk.midNodes, ...sk.rightNodes];

    const linkPaths = sk.links.map((l, i) => `
      <path class="sankey-link-hit" d="${sankeyLinkPath(l)}" fill="none" stroke="transparent" stroke-width="${Math.max(l.w, 10)}" data-tip="${l.tip}"></path>
      <path class="sankey-link" d="${sankeyLinkPath(l)}" fill="none" stroke="${l.color}" stroke-width="${l.w}" pointer-events="none"></path>`).join("");

    const nodeRects = allNodes.map((n) => {
      const isSideNode = n.color === "var(--ink-faint)";
      return `<rect class="sankey-node" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="2" fill="${isSideNode ? "var(--ink)" : n.color}" data-tip="${n.label}: ${n.value} player${n.value === 1 ? "" : "s"}"></rect>`;
    }).join("");

    const leftLabels = sk.leftNodes.map((n) => `
      <text class="sankey-label mid-name" x="${SK.leftX - 10}" y="${n.y + n.h / 2 - 6}" text-anchor="end">${n.label}</text>
      <text class="sankey-label mid-count" x="${SK.leftX - 10}" y="${n.y + n.h / 2 + 12}" text-anchor="end">${n.value}</text>`).join("");
    const rightLabels = sk.rightNodes.map((n) => `
      <text class="sankey-label mid-name" x="${SK.rightX + SK.rightW + 10}" y="${n.y + n.h / 2 - 6}" text-anchor="start">${n.label}</text>
      <text class="sankey-label mid-count" x="${SK.rightX + SK.rightW + 10}" y="${n.y + n.h / 2 + 12}" text-anchor="start">${n.value}</text>`).join("");
    const midLabels = sk.midNodes.map((n) => `
      <text class="sankey-label mid-name" x="${SK.midX + SK.midW + 10}" y="${n.y + n.h / 2 - 6}" text-anchor="start">${n.label}</text>
      <text class="sankey-label mid-count" x="${SK.midX + SK.midW + 10}" y="${n.y + n.h / 2 + 12}" text-anchor="start">${n.value}</text>`).join("");

    const colHeads = `
      <text class="sankey-col-head" x="${SK.midX + SK.midW / 2}" y="14" text-anchor="middle">WHAT HAPPENED</text>`;

    wrap.innerHTML = `
      <svg viewBox="0 0 ${SK.vbW} ${SK.vbH}" width="100%" height="${SK.vbH}" style="display:block">
        ${colHeads}
        <g class="sankey-links">${linkPaths}</g>
        <g class="sankey-nodes">${nodeRects}</g>
        <g class="sankey-labels">${leftLabels}${rightLabels}${midLabels}</g>
      </svg>
      <div class="sankey-tip" id="sankey-tip"></div>`;

    const tip = document.getElementById("sankey-tip");
    wrap.addEventListener("mousemove", (e) => {
      const target = e.target.closest(".sankey-node, .sankey-link-hit");
      if (!target) { tip.style.display = "none"; return; }
      const wrapRect = wrap.getBoundingClientRect();
      tip.textContent = target.getAttribute("data-tip");
      tip.style.display = "block";
      tip.style.left = `${e.clientX - wrapRect.left + 14}px`;
      tip.style.top = `${e.clientY - wrapRect.top + 14}px`;
    });
    wrap.addEventListener("mouseleave", () => { tip.style.display = "none"; });
  }

  function render(data) {
    renderSankey(data);
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
