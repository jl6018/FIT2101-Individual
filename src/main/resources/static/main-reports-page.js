/**
 * Reports Page — Symph Web Application
 * Displays the per-member time contribution table over a selectable range
 * (US26 / US27), and a member-history modal with the specific dates they
 * worked (US28). All data comes from /api/timelogs endpoints.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

// ===================== BFCACHE FIX =====================
window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("loggedIn") !== "true") {
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

// ===================== HELPERS =====================
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

function formatHours(h) {
    return `${Number(h).toFixed(1)}h`;
}

function toIsoDate(d) {
    return d.toISOString().split("T")[0];
}

// ===================== ELEMENTS =====================
const timeRangeRow = requireElement("timeRangeRow");
const contributionTitle = requireElement("contributionTitle");
const contributionBody = requireElement("contributionBody");
const memberOverlay = requireElement("memberOverlay");
const closeMemberModalBtn = requireElement("closeMemberModalBtn");
const memberModalName = requireElement("memberModalName");
const memberModalTeam = requireElement("memberModalTeam");
const memberChartWrap = requireElement("memberChartWrap");
const memberEmptyState = requireElement("memberEmptyState");
const memberModalTotal = requireElement("memberModalTotal");

// ===================== LOGOUT MODAL =====================
const logoutBtn = requireElement("logoutBtn");
const logoutOverlay = requireElement("logoutOverlay");
const cancelLogoutBtn = requireElement("cancelLogoutBtn");
const confirmLogoutBtn = requireElement("confirmLogoutBtn");

logoutBtn.addEventListener("click", () => logoutOverlay.classList.add("visible"));
cancelLogoutBtn.addEventListener("click", () => logoutOverlay.classList.remove("visible"));
confirmLogoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index-login-page.html";
});
logoutOverlay.addEventListener("click", (e) => {
    if (e.target === logoutOverlay) logoutOverlay.classList.remove("visible");
});

// ===================== STATE =====================
let selectedWeeks = 1;
let currentSummary = [];   // the last fetched array of summary rows

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay) { overlay.classList.add("visible"); }
function closeModal(overlay) { overlay.classList.remove("visible"); }

closeMemberModalBtn.addEventListener("click", () => closeModal(memberOverlay));
memberOverlay.addEventListener("click", (e) => {
    if (e.target === memberOverlay) closeModal(memberOverlay);
});

// ===================== TIME RANGE =====================
timeRangeRow.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        selectedWeeks = Number(btn.dataset["weeks"]) || 1;
        timeRangeRow.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        void loadSummary();
    });
});

// ===================== LOAD SUMMARY =====================
/**
 * Fetches per-member totals from the backend for the selected time range
 * and re-renders the contribution table.
 */
async function loadSummary() {
    const days = selectedWeeks * 7;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));

    contributionTitle.textContent = `Team contribution — last ${days} days`;
    contributionBody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;

    try {
        const url = `${TIMELOGS_API}/summary?from=${toIsoDate(from)}&to=${toIsoDate(to)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentSummary = await res.json();
        renderContributionTable();
    } catch (err) {
        console.error("Failed to load summary:", err);
        contributionBody.innerHTML =
            `<tr><td colspan="4" class="muted">Could not load summary.</td></tr>`;
    }
}

// ===================== CONTRIBUTION TABLE =====================
/**
 * Deterministic HSL colour for a member avatar, based on their name.
 */
function avatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Renders the contribution table from currentSummary.
 */
function renderContributionTable() {
    contributionBody.innerHTML = "";

    if (!currentSummary || currentSummary.length === 0) {
        contributionBody.innerHTML =
            `<tr><td colspan="4" class="muted">No members found.</td></tr>`;
        return;
    }

    currentSummary.forEach((row) => {
        const initials = row.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p.charAt(0).toUpperCase())
            .join("");

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
async function openMemberModal(row) {
    memberModalName.textContent = row.name;
    memberModalTeam.textContent = `${row.team} — logged sessions`;
    memberChartWrap.innerHTML = "";
    memberEmptyState.style.display = "none";
    memberModalTotal.textContent = "";

    openModal(memberOverlay);

    const days = selectedWeeks * 7;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));

    try {
        const url = `${TIMELOGS_API}/user/${row.userId}/range?from=${toIsoDate(from)}&to=${toIsoDate(to)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const logs = await res.json();
        renderMemberChart(logs);
    } catch (err) {
        console.error("Failed to load member history:", err);
        memberEmptyState.textContent = "Could not load this member's history.";
        memberEmptyState.style.display = "block";
    }
}

/**
 * Draws a simple bar chart of hours per date for a member.
 */
function renderMemberChart(logs) {
    if (!logs || logs.length === 0) {
        memberChartWrap.style.display = "none";
        memberEmptyState.style.display = "block";
        memberModalTotal.textContent = "Total: 0h across 0 day(s)";
        return;
    }

    // Group by date and sum
    const byDate = {};
    logs.forEach((log) => {
        const key = log.date;
        byDate[key] = (byDate[key] || 0) + Number(log.hours || 0);
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

// ===================== ESCAPE HTML =====================
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ===================== INIT =====================
void loadSummary();