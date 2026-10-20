"use strict";
// main-reports-page.ts
// Compile with:
//   npx tsc main-reports-page.ts --module esnext --target esnext --strict --ignoreConfig
/**
 * Reports Page — Symph Web Application
 * Per-member time contribution (US26/27), member-history modal (US28),
 * line chart of hours per task (US29), and sprint burndown (US30).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
// BFCACHE FIX
window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index-login-page.html";
    }
});
// AUTH GUARD
if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index-login-page.html";
    throw new Error("Not logged in");
}
// COLLAPSE SIDEBAR
const SIDEBAR_KEY = "symph.sidebarCollapsed";
const appShell = document.getElementById("appShell");
const sidebarToggle = document.getElementById("sidebarToggle");
function readSetting(key) {
    try {
        return window.localStorage.getItem(key) ?? "";
    }
    catch {
        return "";
    }
}
function writeSetting(key, value) {
    try {
        window.localStorage.setItem(key, value);
    }
    catch { /* ignore */ }
}
function setSidebarCollapsed(collapsed) {
    if (!appShell || !sidebarToggle)
        return;
    appShell.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu");
    sidebarToggle.title = collapsed ? "Expand menu" : "Collapse menu";
}
sidebarToggle?.addEventListener("click", () => {
    if (!appShell)
        return;
    const collapsed = !appShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
    writeSetting(SIDEBAR_KEY, collapsed ? "1" : "0");
});
setSidebarCollapsed(readSetting(SIDEBAR_KEY) === "1");
// SHOW CURRENT USER
const nameEl = document.getElementById("signedInName");
if (nameEl) {
    const name = sessionStorage.getItem("name");
    const role = sessionStorage.getItem("role");
    if (name)
        nameEl.textContent = role === "ADMIN" ? `${name} (Admin)` : name;
}
// CONFIGURATIONS
const TIMELOGS_API = "http://localhost:8080/api/timelogs";
const SPRINTS_API = "http://localhost:8080/api/sprints";
const SPRINT_KEY = "symph.currentSprint";
const SPRINT_TAB_NAMES = { "1": "Sprint 1", "2": "Sprint 2", "3": "Sprint 3" };
// HELPERS
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element: ${id}`);
    return el;
}
function formatHours(h) { return `${Number(h).toFixed(1)}h`; }
function toIsoDate(d) { return d.toISOString().slice(0, 10); }
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function chartWidth(svgEl, fallback = 720) {
    const wrap = svgEl.parentElement;
    if (!wrap)
        return fallback;
    return Math.max(fallback, wrap.clientWidth - 24);
}
// ELEMENTS
const timeRangeRow = requireElement("timeRangeRow");
const contributionTitle = requireElement("contributionTitle");
const contributionBody = requireElement("contributionBody");
const memberOverlay = requireElement("memberOverlay");
const closeMemberModalBtn = requireElement("closeMemberModalBtn");
const memberModalName = requireElement("memberModalName");
const memberModalTeam = requireElement("memberModalTeam");
const memberChartWrap = requireElement("memberChartWrap");
const memberEmptyState = requireElement("memberEmptyState");
const memberLogsBody = requireElement("memberLogsBody");
const memberModalTotal = requireElement("memberModalTotal");
const taskLineChart = requireElement("taskLineChart");
const taskChartEmpty = requireElement("taskChartEmpty");
const burndownChart = requireElement("burndownChart");
const burndownEmpty = requireElement("burndownEmpty");
// STATE
let selectedWeeks = 1;
let currentSummary = [];
// MODAL OPEN/CLOSE
function openModal(o) { o.classList.add("visible"); }
function closeModal(o) { o.classList.remove("visible"); }
closeMemberModalBtn.addEventListener("click", () => closeModal(memberOverlay));
memberOverlay.addEventListener("click", (e) => {
    if (e.target === memberOverlay)
        closeModal(memberOverlay);
});
// TIME RANGE
timeRangeRow.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        selectedWeeks = Number(btn.dataset["weeks"]) || 1;
        timeRangeRow.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        void reloadAll();
    });
});
function rangeIso() {
    const days = selectedWeeks * 7;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    return { from: toIsoDate(from), to: toIsoDate(to), days };
}
// LOADERS
async function loadSummary() {
    const { from, to, days } = rangeIso();
    contributionTitle.textContent = `Team contribution — last ${days} days`;
    contributionBody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;
    try {
        const res = await fetch(`${TIMELOGS_API}/summary?from=${from}&to=${to}`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        currentSummary = (await res.json());
        renderContributionTable();
    }
    catch (err) {
        console.error("Failed to load summary:", err);
        contributionBody.innerHTML =
            `<tr><td colspan="4" class="muted">Could not load summary.</td></tr>`;
    }
}
async function loadTaskChart() {
    const { from, to } = rangeIso();
    taskLineChart.innerHTML = "";
    taskChartEmpty.style.display = "none";
    try {
        const res = await fetch(`${TIMELOGS_API}/by-task?from=${from}&to=${to}`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        renderTaskLineChart((await res.json()));
    }
    catch (err) {
        console.error("Failed to load task chart:", err);
        taskChartEmpty.textContent = "Could not load task chart.";
        taskChartEmpty.style.display = "block";
    }
}
async function loadBurndown() {
    burndownChart.innerHTML = "";
    burndownEmpty.style.display = "none";
    const tabId = window.localStorage.getItem(SPRINT_KEY) || "1";
    const sprintName = SPRINT_TAB_NAMES[tabId];
    if (!sprintName) {
        burndownEmpty.textContent = "No sprint selected on the Sprint Board.";
        burndownEmpty.style.display = "block";
        return;
    }
    try {
        const sRes = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(sprintName)}`);
        if (!sRes.ok)
            throw new Error(`HTTP ${sRes.status}`);
        const sText = await sRes.text();
        if (!sText) {
            burndownEmpty.textContent = `No sprint named "${sprintName}" exists yet.`;
            burndownEmpty.style.display = "block";
            return;
        }
        const sprint = JSON.parse(sText);
        const bRes = await fetch(`${TIMELOGS_API}/burndown/${sprint.id}`);
        if (!bRes.ok)
            throw new Error(`HTTP ${bRes.status}`);
        renderBurndown((await bRes.json()), sprint);
    }
    catch (err) {
        console.error("Failed to load burndown:", err);
        burndownEmpty.textContent = "Could not load burndown data.";
        burndownEmpty.style.display = "block";
    }
}
async function reloadAll() {
    await loadSummary();
    await loadTaskChart();
    await loadBurndown();
}
// ===================== CONTRIBUTION TABLE =====================
function avatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}
function renderContributionTable() {
    contributionBody.innerHTML = "";
    if (!currentSummary || currentSummary.length === 0) {
        contributionBody.innerHTML = `<tr><td colspan="4" class="muted">No members found.</td></tr>`;
        return;
    }
    currentSummary.forEach((row) => {
        const initials = row.name.split(/\s+/).filter(Boolean).slice(0, 2)
            .map((p) => p.charAt(0).toUpperCase()).join("");
        const tr = document.createElement("tr");
        tr.className = "member-row-clickable";
        tr.innerHTML = `
            <td>
                <span class="member-cell">
                    <span class="member-avatar" style="background:${avatarColor(row.name)};">${initials}</span>
                    <span class="member-name-link">${escapeHtml(row.name)}</span>
                </span>
            </td>
            <td>${formatHours(row.totalHours)}</td>
            <td>${row.daysWorked}</td>
            <td>${formatHours(row.avgPerDay)}/day</td>`;
        tr.addEventListener("click", () => openMemberModal(row));
        contributionBody.appendChild(tr);
    });
}
// MEMBER HISTORY (US28)
async function openMemberModal(row) {
    memberModalName.textContent = row.name;
    memberModalTeam.textContent = `${row.team} — logged sessions`;
    memberChartWrap.innerHTML = "";
    memberEmptyState.style.display = "none";
    memberLogsBody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;
    memberModalTotal.textContent = "";
    openModal(memberOverlay);
    const { from, to } = rangeIso();
    try {
        const res = await fetch(`${TIMELOGS_API}/user/${row.userId}/range?from=${from}&to=${to}`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        renderMemberChart((await res.json()));
    }
    catch (err) {
        console.error("Failed to load member history:", err);
        memberEmptyState.textContent = "Could not load this member's history.";
        memberEmptyState.style.display = "block";
        memberLogsBody.innerHTML =
            `<tr><td colspan="4" class="muted">Could not load logs.</td></tr>`;
    }
}
function renderMemberChart(logs) {
    if (!logs || logs.length === 0) {
        memberChartWrap.style.display = "none";
        memberEmptyState.style.display = "block";
        memberLogsBody.innerHTML =
            `<tr><td colspan="4" class="muted">No entries.</td></tr>`;
        memberModalTotal.textContent = "Total: 0h across 0 day(s)";
        return;
    }
    const byDate = {};
    logs.forEach((log) => {
        byDate[log.date] = (byDate[log.date] || 0) + Number(log.hours || 0);
    });
    const entries = Object.entries(byDate)
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => a.date.localeCompare(b.date));
    const maxHours = Math.max(...entries.map((e) => e.hours), 1);
    memberChartWrap.style.display = "flex";
    memberChartWrap.innerHTML = "";
    entries.forEach(({ date, hours }) => {
        const item = document.createElement("div");
        item.className = "bar-chart-item";
        item.innerHTML = `
            <span class="bar-value">${formatHours(hours)}</span>
            <div class="bar" style="height:${(hours / maxHours) * 100}%;"></div>
            <span class="bar-label">${date.slice(5)}</span>`;
        memberChartWrap.appendChild(item);
    });
    const sorted = [...logs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    memberLogsBody.innerHTML = sorted.map((l) => {
        const date = l.date ?? "—";
        const task = l.task?.name ?? "—";
        const hours = Number(l.hours || 0);
        const desc = l.description ? escapeHtml(l.description) : "—";
        return `
            <tr>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(task)}</td>
                <td>${hours.toFixed(1)}h</td>
                <td>${desc}</td>
            </tr>`;
    }).join("");
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    memberModalTotal.textContent = `Total: ${totalHours.toFixed(1)}h across ${entries.length} day(s)`;
}
// SVG HELPERS
const SVG_NS = "http://www.w3.org/2000/svg";
function addAxis(svg, x1, y1, x2, y2) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", "#D1D5DB");
    svg.appendChild(line);
}
function addGridLine(svg, x1, y1, x2, y2) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", "#EEF0FB");
    svg.appendChild(line);
}
function addYLabel(svg, x, y, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", String(y));
    t.setAttribute("text-anchor", "end");
    t.setAttribute("font-size", "11");
    t.setAttribute("fill", "#6B7280");
    t.textContent = text;
    svg.appendChild(t);
}
/* Chart title is centered at the top of the SVG */
function addChartTitle(svg, x, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", "24");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "16");
    t.setAttribute("font-weight", "700");
    t.setAttribute("fill", "#111111");
    t.textContent = text;
    svg.appendChild(t);
}
/* Y-axis title — rotated vertically, positioned lower so it isn't clipped */
function addYTitle(svg, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", "-240");
    t.setAttribute("y", "16");
    t.setAttribute("transform", "rotate(-90)");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "11");
    t.setAttribute("font-weight", "600");
    t.setAttribute("fill", "#4B5563");
    t.textContent = text;
    svg.appendChild(t);
}
/* X-axis title is centered below the axis labels */
function addAxisTitle(svg, x, y, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", String(y));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "11");
    t.setAttribute("font-weight", "600");
    t.setAttribute("fill", "#4B5563");
    t.textContent = text;
    svg.appendChild(t);
}
function addDot(svg, cx, cy, stroke = "#6672c8", r = 5) {
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", String(cx));
    dot.setAttribute("cy", String(cy));
    dot.setAttribute("r", String(r));
    dot.setAttribute("fill", "#ffffff");
    dot.setAttribute("stroke", stroke);
    dot.setAttribute("stroke-width", "2");
    svg.appendChild(dot);
}
function addValueLabel(svg, x, y, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", String(y));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "12");
    t.setAttribute("font-weight", "700");
    t.setAttribute("fill", "#1a1a1a");
    t.textContent = text;
    svg.appendChild(t);
}
function addRotatedXLabel(svg, x, y, text) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", String(y));
    t.setAttribute("text-anchor", "end");
    t.setAttribute("font-size", "11");
    t.setAttribute("fill", "#4B5563");
    t.setAttribute("transform", `rotate(-35 ${x} ${y})`);
    t.textContent = text;
    svg.appendChild(t);
}
// HOURS PER TASK: LINE CHART (US29)
function renderTaskLineChart(rows) {
    taskLineChart.innerHTML = "";
    if (!rows || rows.length === 0) {
        taskChartEmpty.style.display = "block";
        return;
    }
    taskChartEmpty.style.display = "none";
    const width = chartWidth(taskLineChart);
    const height = 480;
    const paddingLeft = 80, paddingRight = 30, paddingTop = 56, paddingBottom = 100;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const niceMax = Math.ceil(Math.max(...rows.map((r) => r.totalHours), 1));
    taskLineChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    addAxis(taskLineChart, paddingLeft, paddingTop, paddingLeft, height - paddingBottom);
    addAxis(taskLineChart, paddingLeft, height - paddingBottom, width - paddingRight, height - paddingBottom);
    for (let i = 0; i <= 4; i++) {
        const value = (niceMax / 4) * i;
        const y = paddingTop + plotHeight - (value / niceMax) * plotHeight;
        addGridLine(taskLineChart, paddingLeft, y, width - paddingRight, y);
        addYLabel(taskLineChart, paddingLeft - 8, y + 4, `${value.toFixed(0)}h`);
    }
    const points = rows.map((row, i) => {
        const x = rows.length === 1
            ? paddingLeft + plotWidth / 2
            : paddingLeft + (i / (rows.length - 1)) * plotWidth;
        const y = paddingTop + plotHeight - (row.totalHours / niceMax) * plotHeight;
        return { x, y, row };
    });
    const poly = document.createElementNS(SVG_NS, "polyline");
    poly.setAttribute("points", points.map((p) => `${p.x},${p.y}`).join(" "));
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "#6672c8");
    poly.setAttribute("stroke-width", "2.5");
    taskLineChart.appendChild(poly);
    points.forEach(({ x, y, row }) => {
        addDot(taskLineChart, x, y);
        addValueLabel(taskLineChart, x, y - 10, `${row.totalHours.toFixed(1)}h`);
        addRotatedXLabel(taskLineChart, x, height - paddingBottom + 14, row.taskName.length > 16 ? row.taskName.slice(0, 15) + "…" : row.taskName);
    });
    /* Chart title */
    const days = selectedWeeks * 7;
    addChartTitle(taskLineChart, paddingLeft + plotWidth / 2, `Total hours logged per task — last ${days} days`);
    /* Axis titles */
    addYTitle(taskLineChart, "Hours");
    addAxisTitle(taskLineChart, paddingLeft + plotWidth / 2, height - 8, "Task");
}
// SPRINT BURNDOWN (US30)
function renderBurndown(points, sprint) {
    burndownChart.innerHTML = "";
    if (!points || points.length === 0) {
        burndownEmpty.style.display = "block";
        return;
    }
    burndownEmpty.style.display = "none";
    const width = chartWidth(burndownChart);
    const height = 480;
    const paddingLeft = 80, paddingRight = 30, paddingTop = 56, paddingBottom = 60;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const maxValue = Math.max(...points.map((p) => Math.max(p.projectedRemaining, p.actualRemaining)), 1);
    const niceMax = Math.ceil(maxValue);
    burndownChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    addAxis(burndownChart, paddingLeft, paddingTop, paddingLeft, height - paddingBottom);
    addAxis(burndownChart, paddingLeft, height - paddingBottom, width - paddingRight, height - paddingBottom);
    for (let i = 0; i <= 4; i++) {
        const value = (niceMax / 4) * i;
        const y = paddingTop + plotHeight - (value / niceMax) * plotHeight;
        addGridLine(burndownChart, paddingLeft, y, width - paddingRight, y);
        addYLabel(burndownChart, paddingLeft - 8, y + 4, `${value.toFixed(0)}h`);
    }
    const lastIndex = points.length - 1;
    const xFor = (i) => lastIndex === 0
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (i / lastIndex) * plotWidth;
    const yFor = (v) => paddingTop + plotHeight - (v / niceMax) * plotHeight;
    const projectedLine = document.createElementNS(SVG_NS, "polyline");
    projectedLine.setAttribute("points", points.map((p, i) => `${xFor(i)},${yFor(p.projectedRemaining)}`).join(" "));
    projectedLine.setAttribute("fill", "none");
    projectedLine.setAttribute("stroke", "#111111");
    projectedLine.setAttribute("stroke-width", "2");
    projectedLine.setAttribute("stroke-dasharray", "6,4");
    burndownChart.appendChild(projectedLine);
    const actualLine = document.createElementNS(SVG_NS, "polyline");
    actualLine.setAttribute("points", points.map((p, i) => `${xFor(i)},${yFor(p.actualRemaining)}`).join(" "));
    actualLine.setAttribute("fill", "none");
    actualLine.setAttribute("stroke", "#4F7FFF");
    actualLine.setAttribute("stroke-width", "2.5");
    burndownChart.appendChild(actualLine);
    points.forEach((p, i) => {
        const x = xFor(i);
        addDot(burndownChart, x, yFor(p.projectedRemaining), "#111111", 3);
        addDot(burndownChart, x, yFor(p.actualRemaining), "#4F7FFF", 3);
        if (i === 0 || i === lastIndex || i % 2 === 0) {
            const lbl = document.createElementNS(SVG_NS, "text");
            lbl.setAttribute("x", String(x));
            lbl.setAttribute("y", String(height - paddingBottom + 16));
            lbl.setAttribute("text-anchor", "middle");
            lbl.setAttribute("font-size", "10");
            lbl.setAttribute("fill", "#6B7280");
            lbl.textContent = p.date.slice(5);
            burndownChart.appendChild(lbl);
        }
    });
    /* Chart title with sprint name + date range */
    const title = sprint
        ? `Sprint burndown — ${sprint.name}` +
            (sprint.startDate && sprint.endDate
                ? ` (${sprint.startDate} → ${sprint.endDate})`
                : "")
        : "Sprint burndown";
    addChartTitle(burndownChart, paddingLeft + plotWidth / 2, title);
    /* Axis titles */
    addYTitle(burndownChart, "Remaining hours");
    addAxisTitle(burndownChart, paddingLeft + plotWidth / 2, height - 8, "Date");
}
// INIT
void reloadAll();
// Refresh when the tab regains focus
window.addEventListener("focus", () => { void reloadAll(); });
