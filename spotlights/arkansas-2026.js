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
    // "graduated" is inferred (senior eligibility + absent from portal/draft
    // data), not a confirmed signal the way a portal entry or draft pick is
    // - flag it visibly here rather than only in the page-level caveat text.
    const presumed = p.status === "graduated";
    const badge = presumed ? `<span class="unconfirmed-badge">Unconfirmed</span>` : "";
    return `
      <div class="player-row${presumed ? " presumed" : ""}">
        <div class="p-top"><span class="p-name">${p.name}${badge}</span><span class="p-pos">${p.position}</span></div>
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
    vbW: 900, vbH: 640, padY: 30, nodeGap: 8,
    leftX: 120, leftW: 30,
    midX: 430, midW: 24,
    rightX: 750, rightW: 30,
    minNodePx: 6, // floor so a 3-4-player group is still visible/hoverable, not a hairline
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
        const h = Math.max(it.value * scale, it.value > 0 ? SK.minNodePx : 0);
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
      // "Graduated" is a presumed/inferred bucket (senior eligibility, absent
      // from portal/draft data), not a confirmed status the way Transferred
      // or Drafted are - gets its own hatched fill (see renderSankey) so the
      // diagram doesn't visually claim more certainty than the data has.
      { key: "graduated", label: "Presumed Departed", value: graduated, color: RED, presumed: true },
      { key: "drafted", label: "Drafted", value: drafted, color: RED },
      { key: "portal_in", label: "Portal Additions", value: portalIn, color: BRASS },
      { key: "signees", label: "HS Signees", value: signees, color: BRASS },
    ], SK.midX, SK.midW);
    const mid = Object.fromEntries(midNodes.map((n) => [n.key, n]));
    const left = leftNodes[0], right = rightNodes[0];

    const links = [];
    function link(a, b, value, color, tip, presumed) {
      if (value <= 0) return;
      const y0 = a.outCursor, y1 = b.inCursor;
      const w = value * scale;
      a.outCursor += w;
      b.inCursor += w;
      links.push({ x0: a.x + a.w, y0: y0 + w / 2, x1: b.x, y1: y1 + w / 2, w, color, tip, presumed: !!presumed, sourceKey: a.key, targetKey: b.key });
    }

    link(left, mid.stayed, stayed, GREEN, `${stayed} stayed on the roster`);
    link(left, mid.transferred, transferred, RED, `${transferred} transferred out (portal)`);
    link(left, mid.graduated, graduated, RED, `${graduated} presumed departed (graduated - senior eligibility, unconfirmed)`, true);
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

  // Mode B: "Where people went" - same 2025 Roster -> mid -> 2026 Roster
  // skeleton as buildSankey, but the departed/incoming mid-buckets are real
  // destination/origin SCHOOL NAMES instead of status categories. Built
  // entirely from data already in the JSON - destination school is embedded
  // in departed players' `detail` text ("Transferred to X"), origin school
  // is already its own field on incoming transfers (`origin_team`). No new
  // API pull needed. Stayed/Presumed Departed/Drafted/HS Signees stay
  // aggregate buckets (a destination school doesn't apply to any of them -
  // draft goes to the NFL, not a school; a signee's "origin" is a high
  // school, not a comparable college program).
  const TOP_N_SCHOOLS = 5;

  function topSchools(items, n) {
    const counts = {};
    items.forEach((s) => { if (s) counts[s] = (counts[s] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, n);
    const restCount = sorted.slice(n).reduce((s, [, c]) => s + c, 0);
    return { top, restCount };
  }

  function buildSankeyByDestination(positionGroups) {
    const bandH = SK.vbH - SK.padY * 2;
    const allDeparted = positionGroups.flatMap((g) => g.departed);
    const allIncoming = positionGroups.flatMap((g) => g.incoming);

    const stayed = positionGroups.reduce((s, g) => s + g.returning.length, 0);
    const graduated = allDeparted.filter((p) => p.status === "graduated").length;
    const drafted = allDeparted.filter((p) => p.status === "draft").length;
    // "Entered portal" (no committed destination yet) is a real, distinct
    // status from "Transferred to X" - only extract a school name when one
    // was actually confirmed, so an uncommitted entry never gets silently
    // mislabeled as a fake school. Uncommitted players still count toward
    // the roster total, just in their own bucket below (mirrors how
    // "Presumed Departed" already gets its own honest, separately-labeled
    // bucket instead of being hidden inside "Transferred").
    const portalOutPlayers = allDeparted.filter((p) => p.status === "portal");
    const transferOutDestinations = [];
    let uncommittedOut = 0;
    portalOutPlayers.forEach((p) => {
      const m = /^Transferred to (.+)$/.exec(p.detail || "");
      if (m) transferOutDestinations.push(m[1].trim());
      else uncommittedOut += 1;
    });
    const portalInOrigins = allIncoming
      .filter((p) => p.type === "transfer")
      .map((p) => p.origin_team)
      .filter((t) => t); // origin_team should always be set for a transfer, but guard anyway
    const signees = allIncoming.filter((p) => p.type !== "transfer").length;

    const { top: outTop, restCount: outRest } = topSchools(transferOutDestinations, TOP_N_SCHOOLS);
    const { top: inTop, restCount: inRest } = topSchools(portalInOrigins, TOP_N_SCHOOLS);

    const roster2025 = stayed + portalOutPlayers.length + drafted + graduated;
    const roster2026 = stayed + portalInOrigins.length + signees;
    const midTotal = roster2025 + portalInOrigins.length + signees;
    const scale = bandH / Math.max(roster2025, roster2026, midTotal, 1);

    function stack(items, x, w) {
      const totalH = items.reduce((s, it) => s + it.value * scale, 0) + SK.nodeGap * (items.length - 1);
      let y = SK.padY + (bandH - totalH) / 2;
      return items.map((it) => {
        const h = Math.max(it.value * scale, it.value > 0 ? SK.minNodePx : 0);
        const node = { ...it, x, w, y, h, inCursor: y, outCursor: y };
        y += h + SK.nodeGap;
        return node;
      });
    }

    const leftNodes = stack([{ key: "roster2025", label: "2025 Roster", value: roster2025, color: "var(--ink-faint)" }], SK.leftX, SK.leftW);
    const rightNodes = stack([{ key: "roster2026", label: "2026 Roster", value: roster2026, color: "var(--ink-faint)" }], SK.rightX, SK.rightW);

    const midItems = [
      { key: "stayed", label: "Stayed", value: stayed, color: GREEN },
      ...outTop.map(([school, n], i) => ({ key: `out_${i}`, label: school, value: n, color: RED, isSchool: true })),
      ...(outRest > 0 ? [{ key: "out_other", label: `Other Schools (${outRest})`, value: outRest, color: RED }] : []),
      ...(uncommittedOut > 0 ? [{ key: "out_uncommitted", label: "Portal, Uncommitted", value: uncommittedOut, color: RED }] : []),
      { key: "graduated", label: "Presumed Departed", value: graduated, color: RED, presumed: true },
      { key: "drafted", label: "NFL Draft", value: drafted, color: RED },
      ...inTop.map(([school, n], i) => ({ key: `in_${i}`, label: school, value: n, color: BRASS, isSchool: true })),
      ...(inRest > 0 ? [{ key: "in_other", label: `Other Schools (${inRest})`, value: inRest, color: BRASS }] : []),
      { key: "signees", label: "HS Signees", value: signees, color: BRASS },
    ];
    const midNodes = stack(midItems, SK.midX, SK.midW);
    const mid = Object.fromEntries(midNodes.map((n) => [n.key, n]));
    const left = leftNodes[0], right = rightNodes[0];

    const links = [];
    function link(a, b, value, color, tip, presumed) {
      if (value <= 0) return;
      const y0 = a.outCursor, y1 = b.inCursor;
      const w = value * scale;
      a.outCursor += w;
      b.inCursor += w;
      links.push({ x0: a.x + a.w, y0: y0 + w / 2, x1: b.x, y1: y1 + w / 2, w, color, tip, presumed: !!presumed, sourceKey: a.key, targetKey: b.key });
    }

    link(left, mid.stayed, stayed, GREEN, `${stayed} stayed on the roster`);
    outTop.forEach(([school, n], i) => link(left, mid[`out_${i}`], n, RED, `${n} transferred to ${school}`));
    if (outRest > 0) link(left, mid.out_other, outRest, RED, `${outRest} transferred to ${outRest === 1 ? "a school" : "other schools"} outside the top ${TOP_N_SCHOOLS} destinations`);
    if (uncommittedOut > 0) link(left, mid.out_uncommitted, uncommittedOut, RED, `${uncommittedOut} entered the portal, destination not yet committed`);
    link(left, mid.graduated, graduated, RED, `${graduated} presumed departed (graduated - senior eligibility, unconfirmed)`, true);
    link(left, mid.drafted, drafted, RED, `${drafted} drafted to the NFL`);
    link(mid.stayed, right, stayed, GREEN, `${stayed} returning in 2026`);
    inTop.forEach(([school, n], i) => link(mid[`in_${i}`], right, n, BRASS, `${n} transferred in from ${school}`));
    if (inRest > 0) link(mid.in_other, right, inRest, BRASS, `${inRest} transferred in from ${inRest === 1 ? "a school" : "schools"} outside the top ${TOP_N_SCHOOLS} sources`);
    link(mid.signees, right, signees, BRASS, `${signees} HS signees`);

    return { leftNodes, midNodes, rightNodes, links };
  }

  // Mode C: "By Position" - the one Anna actually wanted first. Left/right
  // columns become the 7 position groups themselves (not a single "2025/2026
  // Roster" aggregate) so you can see which groups turned over the most and
  // which stayed intact, at a glance. Each group's RETURNING count draws a
  // direct same-group link straight across (the "what stuck around" story);
  // DEPARTED and INCOMING route through two small shared hub nodes in the
  // middle rather than 7 more columns of nodes, which is the difference
  // between a readable diagram and an unreadable one at this node count.
  function buildSankeyByPosition(positionGroups) {
    const bandH = SK.vbH - SK.padY * 2;
    const groups = positionGroups.map((g) => ({
      key: g.group,
      departed: g.departed.length,
      returning: g.returning.length,
      incoming: g.incoming.length,
    }));

    const totalReturning = groups.reduce((s, g) => s + g.returning, 0);
    const totalDeparted = groups.reduce((s, g) => s + g.departed, 0);
    const totalIncoming = groups.reduce((s, g) => s + g.incoming, 0);
    const leftTotal = groups.reduce((s, g) => s + g.returning + g.departed, 0);
    const rightTotal = groups.reduce((s, g) => s + g.returning + g.incoming, 0);
    // 3 lanes now (Stayed / Departed / Incoming), not 2 - Stayed used to be a
    // direct left->right link bypassing the middle column entirely, which
    // read as "2 lanes plus one line cutting through them." Anna's call:
    // all three should be their own parallel lane, same visual treatment.
    const midTotal = totalReturning + totalDeparted + totalIncoming;
    const scale = bandH / Math.max(leftTotal, rightTotal, midTotal, 1);

    function stack(items, x, w) {
      const totalH = items.reduce((s, it) => s + it.value * scale, 0) + SK.nodeGap * (items.length - 1);
      let y = SK.padY + (bandH - totalH) / 2;
      return items.map((it) => {
        const h = Math.max(it.value * scale, it.value > 0 ? SK.minNodePx : 0);
        const node = { ...it, x, w, y, h, inCursor: y, outCursor: y };
        y += h + SK.nodeGap;
        return node;
      });
    }

    const leftNodes = stack(groups.map((g) => ({
      key: `L_${g.key}`, label: g.key, value: g.returning + g.departed, color: "var(--ink-faint)",
    })), SK.leftX, SK.leftW);
    const rightNodes = stack(groups.map((g) => ({
      key: `R_${g.key}`, label: g.key, value: g.returning + g.incoming, color: "var(--ink-faint)",
    })), SK.rightX, SK.rightW);
    const midNodes = stack([
      { key: "stayed_hub", label: "Stayed", value: totalReturning, color: GREEN },
      { key: "departed_hub", label: "Departed", value: totalDeparted, color: RED },
      { key: "incoming_hub", label: "Incoming", value: totalIncoming, color: BRASS },
    ], SK.midX, SK.midW);

    const leftByKey = Object.fromEntries(leftNodes.map((n) => [n.key, n]));
    const rightByKey = Object.fromEntries(rightNodes.map((n) => [n.key, n]));
    const mid = Object.fromEntries(midNodes.map((n) => [n.key, n]));

    const links = [];
    function link(a, b, value, color, tip) {
      if (value <= 0) return;
      const y0 = a.outCursor, y1 = b.inCursor;
      const w = value * scale;
      a.outCursor += w;
      b.inCursor += w;
      links.push({ x0: a.x + a.w, y0: y0 + w / 2, x1: b.x, y1: y1 + w / 2, w, color, tip, presumed: false, sourceKey: a.key, targetKey: b.key });
    }

    groups.forEach((g) => {
      const L = leftByKey[`L_${g.key}`], R = rightByKey[`R_${g.key}`];
      link(L, mid.stayed_hub, g.returning, GREEN, `${g.returning} ${g.key} stayed on the roster`);
      link(mid.stayed_hub, R, g.returning, GREEN, `${g.returning} ${g.key} stayed on the roster`);
      link(L, mid.departed_hub, g.departed, RED, `${g.departed} ${g.key} departed`);
      link(mid.incoming_hub, R, g.incoming, BRASS, `${g.incoming} incoming ${g.key}`);
    });

    return { leftNodes, midNodes, rightNodes, links };
  }

  function renderSankey(data, mode) {
    const wrap = document.getElementById("sankey-wrap");
    if (!wrap || !data.position_groups.length) return;
    const sk = mode === "destination" ? buildSankeyByDestination(data.position_groups)
      : mode === "position" ? buildSankeyByPosition(data.position_groups)
      : buildSankey(data.position_groups);
    const allNodes = [...sk.leftNodes, ...sk.midNodes, ...sk.rightNodes];

    const linkPaths = sk.links.map((l, i) => `
      <path class="sankey-link-hit" d="${sankeyLinkPath(l)}" fill="none" stroke="transparent" stroke-width="${Math.max(l.w, 10)}" data-tip="${l.tip}" data-source="${l.sourceKey}" data-target="${l.targetKey}"></path>
      <path class="sankey-link" d="${sankeyLinkPath(l)}" fill="none" stroke="${l.presumed ? "url(#presumedHatch)" : l.color}" stroke-width="${l.w}" pointer-events="none" data-source="${l.sourceKey}" data-target="${l.targetKey}"></path>`).join("");

    const nodeRects = allNodes.map((n) => {
      const isSideNode = n.color === "var(--ink-faint)";
      const fill = n.presumed ? "url(#presumedHatch)" : (isSideNode ? "var(--ink)" : n.color);
      const tipSuffix = n.presumed ? " (presumed, unconfirmed)" : "";
      return `<rect class="sankey-node" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="2" fill="${fill}" ${n.presumed ? `stroke="${RED}" stroke-width="1"` : ""} data-tip="${n.label}: ${n.value} player${n.value === 1 ? "" : "s"}${tipSuffix}" data-key="${n.key}"></rect>`;
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

    const headLabel = mode === "destination" ? "WHERE THEY WENT / CAME FROM"
      : mode === "position" ? "STAYED / DEPARTED / INCOMING"
      : "WHAT HAPPENED";
    const colHeads = `
      <text class="sankey-col-head" x="${SK.midX + SK.midW / 2}" y="14" text-anchor="middle">${headLabel}</text>`;

    wrap.innerHTML = `
      <svg viewBox="0 0 ${SK.vbW} ${SK.vbH}" width="100%" height="${SK.vbH}" style="display:block">
        <defs>
          <pattern id="presumedHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="${RED}" fill-opacity="0.35"></rect>
            <line x1="0" y1="0" x2="0" y2="6" stroke="${RED}" stroke-width="3"></line>
          </pattern>
        </defs>
        ${colHeads}
        <g class="sankey-links">${linkPaths}</g>
        <g class="sankey-nodes">${nodeRects}</g>
        <g class="sankey-labels">${leftLabels}${rightLabels}${midLabels}</g>
      </svg>
      <div class="sankey-tip" id="sankey-tip"></div>`;

    const tip = document.getElementById("sankey-tip");
    const allLinkEls = [...wrap.querySelectorAll(".sankey-link, .sankey-link-hit")];
    const allNodeEls = [...wrap.querySelectorAll(".sankey-node")];

    // Hover isolation: point at a node or a flow and everything NOT
    // connected to it fades out, so a single position/school/status's
    // path through the diagram is traceable even when a lot of curves
    // overlap by default (unavoidable with this many groups sharing two
    // hub nodes - isolating on demand is the fix, not fighting the tangle).
    function clearIsolation() {
      allLinkEls.forEach((el) => el.classList.remove("sankey-dim"));
      allNodeEls.forEach((el) => el.classList.remove("sankey-dim"));
    }
    function isolate(keys) {
      allLinkEls.forEach((el) => {
        const match = keys.has(el.getAttribute("data-source")) || keys.has(el.getAttribute("data-target"));
        el.classList.toggle("sankey-dim", !match);
      });
      allNodeEls.forEach((el) => {
        el.classList.toggle("sankey-dim", !keys.has(el.getAttribute("data-key")));
      });
    }

    wrap.addEventListener("mousemove", (e) => {
      const target = e.target.closest(".sankey-node, .sankey-link-hit");
      if (!target) { tip.style.display = "none"; clearIsolation(); return; }
      const wrapRect = wrap.getBoundingClientRect();
      tip.textContent = target.getAttribute("data-tip");
      tip.style.display = "block";
      tip.style.left = `${e.clientX - wrapRect.left + 14}px`;
      tip.style.top = `${e.clientY - wrapRect.top + 14}px`;

      if (target.classList.contains("sankey-node")) {
        isolate(new Set([target.getAttribute("data-key")]));
      } else {
        isolate(new Set([target.getAttribute("data-source"), target.getAttribute("data-target")]));
      }
    });
    wrap.addEventListener("mouseleave", () => { tip.style.display = "none"; clearIsolation(); });
  }

  // Three observations (WEAVER_ANALYTICS_LAB_VISION.md's own Arkansas example
  // calls for this step between the Sankey and the stat grid) - computed from
  // the same real numbers as the rest of the page, not copied verbatim from
  // the vision doc's illustrative text, so this stays accurate if the roster
  // data is regenerated later in the cycle.
  function buildObservations(data) {
    const h = data.headline || {};
    const c = data.summary_counts;
    const totalPrev = c.returning + c.departed;
    const turnoverPct = Math.round((c.departed / totalPrev) * 100);
    const secGroup = data.position_groups.find((g) => g.group === "Secondary");
    const talentBeatsReturning = (h.talent_z || 0) > (h.returning_production_z || 0);

    const obs = [];
    obs.push(`${turnoverPct}% of last year's roster turned over — ${c.departed} of ${totalPrev} spots, replaced by ${c.incoming_transfer} transfers and ${c.incoming_recruit} incoming signees.`);
    if (secGroup) {
      const secTotal = secGroup.departed.length + secGroup.returning.length;
      const secPct = secTotal ? Math.round((secGroup.departed.length / secTotal) * 100) : null;
      if (secPct !== null) {
        obs.push(`The secondary was hit hardest of any position group: ${secPct}% of the room is gone, leaving just ${secGroup.returning.length} defensive back${secGroup.returning.length === 1 ? "" : "s"} back from last season.`);
      }
    }
    obs.push(`Incoming talent (${fmtZ(h.talent_z)} z) ${talentBeatsReturning ? "outpaces" : "trails"} returning production (${fmtZ(h.returning_production_z)} z) — on paper, ${talentBeatsReturning ? "what's walking in the door rates stronger than what walked out" : "the roster lost more on-field value than it's replaced so far"}.`);
    return obs;
  }

  // Five Questions (called for at the bottom of the page, same section the
  // vision doc's Arkansas example specs) - the framing is hand-authored
  // (which storylines actually matter is a judgment call, same as the NFL/CFB
  // Team Profile narrative sections), but names/counts are pulled live from
  // the roster data so the questions don't go stale if it's regenerated.
  function buildFiveQuestions(data) {
    const h = data.headline || {};
    const byGroup = Object.fromEntries(data.position_groups.map((g) => [g.group, g]));
    const qb = byGroup["QB"], sec = byGroup["Secondary"], dl = byGroup["DL"], ol = byGroup["OL"];
    const qs = [];

    if (qb) {
      const names = qb.returning.map((p) => p.name).join(" or ");
      qs.push(`Can ${names || "a returning QB"}, or one of the incoming transfers, actually win and hold the starting job now that last year's starter is in the NFL?`);
    }
    if (sec) {
      const secTotal = sec.departed.length + sec.returning.length;
      qs.push(`Do ${sec.incoming.length} new defensive backs — mostly transfers — gel fast enough to replace a secondary that lost ${sec.departed.length} of ${secTotal} players?`);
    }
    if (dl) {
      const dlTotal = dl.departed.length + dl.returning.length;
      qs.push(`Can a defensive line that returns only ${dl.returning.length} of ${dlTotal} players find a real pass rush with its transfer reinforcements?`);
    }
    if (ol) {
      const olTotal = ol.departed.length + ol.returning.length;
      qs.push(`Does an offensive line that kept ${ol.returning.length} of ${olTotal} spots provide enough continuity to protect whoever wins the QB job?`);
    }
    qs.push(`Is a run-reliant offense (Reliance ${fmtZ(h.reliance_z)}) the right identity while learning a new starting QB, or does that reliance become a liability if the run game stalls?`);
    return qs;
  }

  let currentData = null;
  let sankeyMode = "position"; // default view - this is the one Anna actually wanted first

  function setSankeyMode(mode) {
    sankeyMode = mode;
    if (currentData) renderSankey(currentData, sankeyMode);
    const statusBtn = document.getElementById("sankey-mode-status");
    const destBtn = document.getElementById("sankey-mode-destination");
    const posBtn = document.getElementById("sankey-mode-position");
    if (statusBtn && destBtn && posBtn) {
      statusBtn.classList.toggle("active", mode === "status");
      destBtn.classList.toggle("active", mode === "destination");
      posBtn.classList.toggle("active", mode === "position");
    }
  }

  function render(data) {
    currentData = data;
    renderSankey(data, sankeyMode);
    const statusBtn = document.getElementById("sankey-mode-status");
    const destBtn = document.getElementById("sankey-mode-destination");
    const posBtn = document.getElementById("sankey-mode-position");
    if (statusBtn && destBtn && posBtn && !statusBtn.dataset.wired) {
      statusBtn.dataset.wired = "1";
      statusBtn.addEventListener("click", () => setSankeyMode("status"));
      destBtn.addEventListener("click", () => setSankeyMode("destination"));
      posBtn.addEventListener("click", () => setSankeyMode("position"));
    }
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

    document.getElementById("observation-list").innerHTML =
      buildObservations(data).map((o) => `<li>${o}</li>`).join("");

    document.getElementById("five-questions-list").innerHTML =
      buildFiveQuestions(data).map((q) => `<li>${q}</li>`).join("");

    document.getElementById("roster-groups").innerHTML =
      data.position_groups.map(renderGroup).join("");

    document.getElementById("generated-note").textContent =
      `Roster data current as of ${new Date(data.generated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Source: CollegeFootballData.com (/roster, /player/portal, /player/usage, /draft/picks, /recruiting/players).`;
  }

  fetch(DATA_URL)
    .then((r) => r.json())
    .then(render)
    .catch((err) => {
      const errMsg = `<div class="card"><p>Couldn't load roster data (${err}). Run cfb_roster_turnover.py --team Arkansas to regenerate assets/data/arkansas-2026.json.</p></div>`;
      document.getElementById("sankey-wrap").innerHTML = errMsg;
      document.getElementById("observation-list").outerHTML = errMsg;
      document.getElementById("five-questions-list").outerHTML = errMsg;
      document.getElementById("roster-groups").innerHTML = errMsg;
    });
})();
