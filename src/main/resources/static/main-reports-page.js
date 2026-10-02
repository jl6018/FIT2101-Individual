// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}
// ===================== END GUARD =====================

// ===================== LOGOUT =====================
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Log out?')) {
        sessionStorage.clear();
        window.location.href = 'index-login-page.html';
    }
});
// ===================== END LOGOUT =====================

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el;
}

let TEAM_MEMBERS = [];
let SESSIONS = [];

async function loadTeamMembers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');
        const users = await res.json();
        TEAM_MEMBERS = users
            .filter((u) => u.role !== 'ADMIN' && u.role !== 'PRODUCT_OWNER')
            .map((u) => ({
                name: u.name,
                team: u.team?.name ?? 'Unassigned',
                initials: u.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(),
            }));
    } catch (err) {
        console.error('Failed to load team members:', err);
        TEAM_MEMBERS = [];
    }
}

async function loadSessions() {
    try {
        const res = await fetch('/api/timelogs');
        if (!res.ok) throw new Error('Failed to load sessions');
        const logs = await res.json();
        SESSIONS = logs.map((log) => ({
            member: log.user?.name ?? 'Unknown',
            hours: log.hours,
            daysAgo: Math.max(0, Math.floor((Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24))),
        }));
    } catch (err) {
        console.error('Failed to load sessions:', err);
        SESSIONS = [];
    }
}

const TASK_HOURS = [
    { label: 'Design', hours: 0 },
    { label: 'Build', hours: 5.5 },
    { label: 'Tag', hours: 0 },
    { label: 'Manager', hours: 4 },
    { label: 'Team-scoped', hours: 5 },
    { label: 'Time', hours: 1.5 },
    { label: 'Burndown', hours: 0 },
];
const BURNDOWN_PROJECTED = [80, 71, 62, 53, 44, 35, 26, 20];
const BURNDOWN_ACTUAL = [80, 73, 65, 60, 62, 55, 48, 45];

const timeRangeRow = requireElement('timeRangeRow');
const contributionTitle = requireElement('contributionTitle');
const contributionBody = requireElement('contributionBody');
const taskHoursChart = requireElement('taskHoursChart');
const burndownChart = requireElement('burndownChart');
const memberOverlay = requireElement('memberOverlay');
const closeMemberModalBtn = requireElement('closeMemberModalBtn');
const memberModalName = requireElement('memberModalName');
const memberModalTeam = requireElement('memberModalTeam');
const memberChartWrap = requireElement('memberChartWrap');
const memberEmptyState = requireElement('memberEmptyState');
const memberModalTotal = requireElement('memberModalTotal');

let selectedWeeks = 2;

function openModal(overlay) {
    overlay.classList.add('visible');
}
function closeModal(overlay) {
    overlay.classList.remove('visible');
}

closeMemberModalBtn.addEventListener('click', () => closeModal(memberOverlay));
memberOverlay.addEventListener('click', (e) => {
    if (e.target === memberOverlay) closeModal(memberOverlay);
});

timeRangeRow.querySelectorAll('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const weeks = Number(btn.dataset['weeks']);
        selectedWeeks = weeks;
        timeRangeRow.querySelectorAll('.range-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderContributionTable();
    });
});

function computeStats(memberName, maxDaysAgo) {
    const sessions = SESSIONS.filter((s) => s.member === memberName && s.daysAgo < maxDaysAgo);
    const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
    const uniqueDays = new Set(sessions.map((s) => s.daysAgo));
    const daysWorked = uniqueDays.size;
    const avgPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
    return { totalHours, daysWorked, avgPerDay };
}

function renderContributionTable() {
    const maxDaysAgo = selectedWeeks * 7;
    contributionTitle.textContent = `Team contribution — last ${maxDaysAgo} days`;
    contributionBody.innerHTML = '';
    TEAM_MEMBERS.forEach((member) => {
        const stats = computeStats(member.name, maxDaysAgo);
        const row = document.createElement('tr');
        row.className = 'member-row-clickable';
        row.dataset['member'] = member.name;
        row.innerHTML = `
      <td>
        <span class="member-cell">
          <span class="member-avatar">${member.initials}</span>
          <span class="member-name-link">${member.name}</span>
        </span>
      </td>
      <td>${stats.totalHours.toFixed(1)}h</td>
      <td>${stats.daysWorked}</td>
      <td>${stats.avgPerDay.toFixed(1)}h/day</td>
    `;
        row.addEventListener('click', () => openMemberModal(member, maxDaysAgo));
        contributionBody.appendChild(row);
    });
}

function openMemberModal(member, maxDaysAgo) {
    memberModalName.textContent = member.name;
    memberModalTeam.textContent = `${member.team} — logged sessions`;
    const sessions = SESSIONS.filter((s) => s.member === member.name && s.daysAgo < maxDaysAgo)
        .sort((a, b) => b.daysAgo - a.daysAgo);
    memberChartWrap.innerHTML = '';

    if (sessions.length === 0) {
        memberChartWrap.style.display = 'none';
        memberEmptyState.style.display = 'block';
        memberModalTotal.textContent = 'Total: 0h across 0 day(s)';
    } else {
        memberChartWrap.style.display = 'flex';
        memberEmptyState.style.display = 'none';
        const maxHours = Math.max(...sessions.map((s) => s.hours));
        sessions.forEach((s) => {
            const dayLabel = s.daysAgo === 0 ? 'Today' : `${s.daysAgo}d ago`;
            const heightPct = maxHours > 0 ? (s.hours / maxHours) * 100 : 0;
            const item = document.createElement('div');
            item.className = 'bar-chart-item';
            item.innerHTML = `
        <span class="bar-value">${s.hours}h</span>
        <div class="bar" style="height: ${heightPct}%;"></div>
        <span class="bar-label">${dayLabel}</span>
      `;
            memberChartWrap.appendChild(item);
        });
        const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
        const uniqueDays = new Set(sessions.map((s) => s.daysAgo)).size;
        memberModalTotal.textContent = `Total: ${totalHours.toFixed(1)}h across ${uniqueDays} day(s)`;
    }
    openModal(memberOverlay);
}

const TASK_BAR_COLORS = ['#8B5FBF', '#8B5FBF', '#F5C518', '#F5C518', '#F06478', '#F06478', '#2ED4C6'];

function renderTaskHoursChart() {
    const maxHours = Math.max(...TASK_HOURS.map((t) => t.hours), 1);
    taskHoursChart.innerHTML = '';
    TASK_HOURS.forEach((task, i) => {
        const heightPct = (task.hours / maxHours) * 100;
        const color = TASK_BAR_COLORS[i % TASK_BAR_COLORS.length];
        const item = document.createElement('div');
        item.className = 'bar-chart-item';
        item.innerHTML = `
      <span class="bar-value">${task.hours}h</span>
      <div class="bar" style="height: ${heightPct}%; background: ${color};"></div>
      <span class="bar-label">${task.label}</span>
    `;
        taskHoursChart.appendChild(item);
    });
}

function renderBurndownChart() {
    const width = 600, height = 260;
    const paddingLeft = 40, paddingBottom = 30, paddingTop = 10;
    const plotWidth = width - paddingLeft - 20;
    const plotHeight = height - paddingBottom - paddingTop;
    const maxValue = Math.max(...BURNDOWN_PROJECTED, ...BURNDOWN_ACTUAL);

    function toPoints(values) {
        return values.map((v, i) => {
            const x = paddingLeft + (i / (values.length - 1)) * plotWidth;
            const y = paddingTop + (1 - v / maxValue) * plotHeight;
            return `${x},${y}`;
        }).join(' ');
    }

    const projectedPoints = toPoints(BURNDOWN_PROJECTED);
    const actualPoints = toPoints(BURNDOWN_ACTUAL);
    const svgNS = 'http://www.w3.org/2000/svg';
    burndownChart.innerHTML = '';
    burndownChart.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const axisY = document.createElementNS(svgNS, 'line');
    axisY.setAttribute('x1', String(paddingLeft));
    axisY.setAttribute('y1', String(paddingTop));
    axisY.setAttribute('x2', String(paddingLeft));
    axisY.setAttribute('y2', String(height - paddingBottom));
    axisY.setAttribute('stroke', '#D1D5DB');
    burndownChart.appendChild(axisY);

    const axisX = document.createElementNS(svgNS, 'line');
    axisX.setAttribute('x1', String(paddingLeft));
    axisX.setAttribute('y1', String(height - paddingBottom));
    axisX.setAttribute('x2', String(width - 20));
    axisX.setAttribute('y2', String(height - paddingBottom));
    axisX.setAttribute('stroke', '#D1D5DB');
    burndownChart.appendChild(axisX);

    const projectedLine = document.createElementNS(svgNS, 'polyline');
    projectedLine.setAttribute('points', projectedPoints);
    projectedLine.setAttribute('fill', 'none');
    projectedLine.setAttribute('stroke', '#111111');
    projectedLine.setAttribute('stroke-width', '2');
    projectedLine.setAttribute('stroke-dasharray', '6,4');
    burndownChart.appendChild(projectedLine);

    const actualLine = document.createElementNS(svgNS, 'polyline');
    actualLine.setAttribute('points', actualPoints);
    actualLine.setAttribute('fill', 'none');
    actualLine.setAttribute('stroke', '#4F7FFF');
    actualLine.setAttribute('stroke-width', '2');
    burndownChart.appendChild(actualLine);
}

async function init() {
    await loadTeamMembers();
    await loadSessions();
    renderContributionTable();
    renderTaskHoursChart();
    renderBurndownChart();
}

init();