// main-reports-page.ts
// Compile with:
//   npx tsc main-reports-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Reports Page — Symph Web Application
 * Displays per-member time contribution (US26/27), member-history modal
 * (US28), and a line chart of hours per task (US29). All data comes from
 * /api/timelogs endpoints.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ===================== BFCACHE FIX =====================
window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index-login-page.html";
    }
});

// ===================== AUTH GUARD =====================
if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index-login-page.html";
    throw new Error("Not logged in");
}

// ===================== SHOW CURRENT USER =====================
const nameEl = document.getElementById("signedInName");
if (nameEl) {
    const name = sessionStorage.getItem("name");
    const role = sessionStorage.getItem("role");
    if (name) {
        nameEl.textContent = role === "ADMIN" ? `${name} (Admin)` : name;
    }
}

// ===================== CONFIG =====================
const TIMELOGS_API = "http://localhost:8080/api/timelogs";

// ===================== TYPES =====================
interface SummaryRow {
    userId: number;
    name: string;
    team: string;
    totalHours: number;
    daysWorked: number;
    avgPerDay: number;
}

interface LogEntry {
    id: number;
    date: string;
    startTime?: string | null;
    hours: number;
    description?: string | null;
}

interface TaskHoursRow {
    taskId: number;
    taskName: string;
    totalHours: number;
}

// ===================== HELPERS =====================
function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

function formatHours(h: number): string {
    return `${Number(h).toFixed(1)}h`;
}

function toIsoDate(d: Date): string {
    return d.toISOString().split("T")[0];
}

function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ===================== ELEMENTS =====================
const timeRangeRow = requireElement<HTMLDivElement>("timeRangeRow");
const contributionTitle = requireElement<HTMLHeadingElement>("contributionTitle");
const contributionBody = requireElement<HTMLTableSectionElement>("contributionBody");
const memberOverlay = requireElement<HTMLDivElement>("memberOverlay");
const closeMemberModalBtn = requireElement<HTMLButtonElement>("closeMemberModalBtn");
const memberModalName = requireElement<HTMLHeadingElement>("memberModalName");
const memberModalTeam = requireElement<HTMLParagraphElement>("memberModalTeam");
const memberChartWrap = requireElement<HTMLDivElement>("memberChartWrap");
const memberEmptyState = requireElement<HTMLParagraphElement>("memberEmptyState");
const memberModalTotal = requireElement<HTMLParagraphElement>("memberModalTotal");
const taskLineChart = requireElement<SVGSVGElement>("taskLineChart");
const taskChartEmpty = requireElement<HTMLParagraphElement>("taskChartEmpty");

// ===================== LOGOUT MODAL =====================
const logoutBtn = requireElement<HTMLButtonElement>("logoutBtn");
const logoutOverlay = requireElement<HTMLDivElement>("logoutOverlay");
const cancelLogoutBtn = requireElement<HTMLButtonElement>("cancelLogoutBtn");
const confirmLogoutBtn = requireElement<HTMLButtonElement>("confirmLogoutBtn");

logoutBtn.addEventListener("click", () => logoutOverlay.classList.add("visible"));
cancelLogoutBtn.addEventListener("click", () => logoutOverlay.classList.remove("visible"));
confirmLogoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index-login-page.html";
});
logoutOverlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === logoutOverlay) logoutOverlay.classList.remove("visible");
});

// ===================== STATE =====================
let selectedWeeks = 1;
let currentSummary: SummaryRow[] = [];

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay: HTMLDivElement): void { overlay.classList.add("visible"); }
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove("visible"); }

closeMemberModalBtn.addEventListener("click", () => closeModal(memberOverlay));
memberOverlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === memberOverlay) closeModal(memberOverlay);
});

// ===================== TIME RANGE =====================
timeRangeRow.querySelectorAll<HTMLButtonElement>(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        selectedWeeks = Number(btn.dataset["weeks"]) || 1;
        timeRangeRow.querySelectorAll<HTMLButtonElement>(".range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        void reloadAll();
    });
});

// ===================== RANGE HELPERS =====================
function rangeIso(): { from: string; to: string; days: number } {
    const days = selectedWeeks * 7;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    return { from: toIsoDate(from), to: toIsoDate(to), days };
}

// ===================== LOAD: SUMMARY + TASK CHART =====================
async function loadSummary(): Promise<void> {
    const { from, to, days } = rangeIso();
    contributionTitle.textContent = `Team contribution — last ${days} days`;
    contributionBody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;

    try {
        const res = await fetch(`${TIMELOGS_API}/summary?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentSummary = (await res.json()) as SummaryRow[];
        renderContributionTable();
    } catch (err) {
        console.error("Failed to load summary:", err);
        contributionBody.innerHTML =
            `<tr><td colspan="4" class="muted">Could not load summary.</td></tr>`;
    }
}

async function loadTaskChart(): Promise<void> {
    const { from, to } = rangeIso();
    taskLineChart.innerHTML = "";
    taskChartEmpty.style.display = "none";

    try {
        const res = await fetch(`${TIMELOGS_API}/by-task?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = (await res.json()) as TaskHoursRow[];
        renderTaskLineChart(rows);
    } catch (err) {
        console.error("Failed to load task chart:", err);
        taskChartEmpty.textContent = "Could not load task chart.";
        taskChartEmpty.style.display = "block";
    }
}

async function reloadAll(): Promise<void> {
    await loadSummary();
    await loadTaskChart();
}

// ===================== CONTRIBUTION TABLE =====================
function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}

function renderContributionTable(): void {
    contributionBody.innerHTML = "";

    if (!currentSummary || currentSummary.length === 0) {
        contributionBody.innerHTML =
            `<tr><td colspan="4" class="muted">No members found.</td></tr>`;
        return;
    }

    currentSummary.forEach((row) => {
        const initials = row.name
            .split(/\s+/).filter(Boolean).slice(0, 2)
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

// ===================== MEMBER HISTORY (US28) =====================
async function openMemberModal(row: SummaryRow): Promise<void> {
    memberModalName.textContent = row.name;
    memberModalTeam.textContent = `${row.team} — logged sessions`;
    memberChartWrap.innerHTML = "";
    memberEmptyState.style.display = "none";
    memberModalTotal.textContent = "";

    openModal(memberOverlay);

    const { from, to } = rangeIso();
    try {
        const res = await fetch(`${TIMELOGS_API}/user/${row.userId}/range?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const logs = (await res.json()) as LogEntry[];
        renderMemberChart(logs);
    } catch (err) {
        console.error("Failed to load member history:", err);
        memberEmptyState.textContent = "Could not load this member's history.";
        memberEmptyState.style.display = "block";
    }
}

function renderMemberChart(logs: LogEntry[]): void {
    if (!logs || logs.length === 0) {
        memberChartWrap.style.display = "none";
        memberEmptyState.style.display = "block";
        memberModalTotal.textContent = "Total: 0h across 0 day(s)";
        return;
    }

    const byDate: Record<string, number> = {};
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
        const heightPct = (hours / maxHours) * 100;
        const item = document.createElement("div");
        item.className = "bar-chart-item";
        item.innerHTML = `
            <span class="bar-value">${formatHours(hours)}</span>
            <div class="bar" style="height:${heightPct}%;"></div>
            <span class="bar-label">${date.slice(5)}</span>`;
        memberChartWrap.appendChild(item);
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    memberModalTotal.textContent = `Total: ${totalHours.toFixed(1)}h across ${entries.length} day(s)`;
}

// ===================== HOURS PER TASK — LINE CHART (US29) =====================
function renderTaskLineChart(rows: TaskHoursRow[]): void {
    taskLineChart.innerHTML = "";

    if (!rows || rows.length === 0) {
        taskChartEmpty.style.display = "block";
        return;
    }

    taskChartEmpty.style.display = "none";

    const width = 720;
    const height = 320;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 80;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const maxValue = Math.max(...rows.map((r) => r.totalHours), 1);
    const niceMax = Math.ceil(maxValue);

    const svgNS = "http://www.w3.org/2000/svg";
    taskLineChart.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Y axis
    const yAxis = document.createElementNS(svgNS, "line");
    yAxis.setAttribute("x1", String(paddingLeft));
    yAxis.setAttribute("y1", String(paddingTop));
    yAxis.setAttribute("x2", String(paddingLeft));
    yAxis.setAttribute("y2", String(height - paddingBottom));
    yAxis.setAttribute("stroke", "#D1D5DB");
    taskLineChart.appendChild(yAxis);

    // X axis
    const xAxis = document.createElementNS(svgNS, "line");
    xAxis.setAttribute("x1", String(paddingLeft));
    xAxis.setAttribute("y1", String(height - paddingBottom));
    xAxis.setAttribute("x2", String(width - paddingRight));
    xAxis.setAttribute("y2", String(height - paddingBottom));
    xAxis.setAttribute("stroke", "#D1D5DB");
    taskLineChart.appendChild(xAxis);

    // Y-axis ticks
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
        const value = (niceMax / tickCount) * i;
        const y = paddingTop + plotHeight - (value / niceMax) * plotHeight;

        const gridLine = document.createElementNS(svgNS, "line");
        gridLine.setAttribute("x1", String(paddingLeft));
        gridLine.setAttribute("y1", String(y));
        gridLine.setAttribute("x2", String(width - paddingRight));
        gridLine.setAttribute("y2", String(y));
        gridLine.setAttribute("stroke", "#EEF0FB");
        taskLineChart.appendChild(gridLine);

        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", String(paddingLeft - 8));
        label.setAttribute("y", String(y + 4));
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "11");
        label.setAttribute("fill", "#6B7280");
        label.textContent = `${value.toFixed(0)}h`;
        taskLineChart.appendChild(label);
    }

    // Points
    const points = rows.map((row, i) => {
        const x = rows.length === 1
            ? paddingLeft + plotWidth / 2
            : paddingLeft + (i / (rows.length - 1)) * plotWidth;
        const y = paddingTop + plotHeight - (row.totalHours / niceMax) * plotHeight;
        return { x, y, row };
    });

    // Polyline
    const polyline = document.createElementNS(svgNS, "polyline");
    polyline.setAttribute("points", points.map((p) => `${p.x},${p.y}`).join(" "));
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#6672c8");
    polyline.setAttribute("stroke-width", "2.5");
    polyline.setAttribute("stroke-linejoin", "round");
    polyline.setAttribute("stroke-linecap", "round");
    taskLineChart.appendChild(polyline);

    // Dots + value labels + x-axis names
    points.forEach(({ x, y, row }) => {
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
        dot.setAttribute("r", "5");
        dot.setAttribute("fill", "#ffffff");
        dot.setAttribute("stroke", "#6672c8");
        dot.setAttribute("stroke-width", "2.5");
        taskLineChart.appendChild(dot);

        const valueLabel = document.createElementNS(svgNS, "text");
        valueLabel.setAttribute("x", String(x));
        valueLabel.setAttribute("y", String(y - 10));
        valueLabel.setAttribute("text-anchor", "middle");
        valueLabel.setAttribute("font-size", "12");
        valueLabel.setAttribute("font-weight", "700");
        valueLabel.setAttribute("fill", "#1a1a1a");
        valueLabel.textContent = `${row.totalHours.toFixed(1)}h`;
        taskLineChart.appendChild(valueLabel);

        const nameLabel = document.createElementNS(svgNS, "text");
        nameLabel.setAttribute("x", String(x));
        nameLabel.setAttribute("y", String(height - paddingBottom + 14));
        nameLabel.setAttribute("text-anchor", "end");
        nameLabel.setAttribute("font-size", "11");
        nameLabel.setAttribute("fill", "#4B5563");
        nameLabel.setAttribute("transform", `rotate(-35 ${x} ${height - paddingBottom + 14})`);
        nameLabel.textContent = row.taskName.length > 16
            ? row.taskName.slice(0, 15) + "…"
            : row.taskName;
        taskLineChart.appendChild(nameLabel);
    });

    // Y-axis title
    const yTitle = document.createElementNS(svgNS, "text");
    yTitle.setAttribute("x", "14");
    yTitle.setAttribute("y", "18");
    yTitle.setAttribute("font-size", "11");
    yTitle.setAttribute("fill", "#6B7280");
    yTitle.textContent = "Hours";
    taskLineChart.appendChild(yTitle);
}

// ===================== INIT =====================
void reloadAll();