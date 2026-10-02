// main-reports-page.ts
// Compile with:
//   tsc main-reports-page.ts --module esnext --target esnext --strict --ignoreConfig

function requireElement<T extends Element>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el as unknown as T;
}

// ===================== DATA TYPES =====================

interface TeamMember {
    name: string;
    team: string;
    initials: string;
}

interface LoggedSession {
    member: string;
    hours: number;
    daysAgo: number;
}

interface ApiTimeLog {
    id: number;
    hours: number;
    date: string;
    description?: string;
    user?: { name?: string };
    task?: { name?: string };
}

interface ApiUser {
    id: number;
    name: string;
    email: string;
    role: string;
    team?: { name: string };
}

// ===================== STATE =====================

let TEAM_MEMBERS: TeamMember[] = [];
let SESSIONS: LoggedSession[] = [];

// ===================== BACKEND LOADERS =====================

async function loadTeamMembers(): Promise<void> {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');

        const users: ApiUser[] = await res.json();

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

async function loadSessions(): Promise<void> {
    try {
        const res = await fetch('/api/timelogs');
        if (!res.ok) throw new Error('Failed to load sessions');

        const logs: ApiTimeLog[] = await res.json();

        SESSIONS = logs.map((log) => ({
            member: log.user?.name ?? 'Unknown',
            hours: log.hours,
            daysAgo: Math.max(
                0,
                Math.floor(
                    (Date.now() - new Date(log.date).getTime()) /
                        (1000 * 60 * 60 * 24)
                )
            ),
        }));
    } catch (err) {
        console.error('Failed to load sessions:', err);
        SESSIONS = [];
    }
}

// ===================== STATIC DATA (task hours + burndown) =====================

const TASK_HOURS: { label: string; hours: number }[] = [
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

// ===================== ELEMENTS =====================

const timeRangeRow = requireElement<HTMLDivElement>('timeRangeRow');
const contributionTitle = requireElement<HTMLHeadingElement>('contributionTitle');
const contributionBody = requireElement<HTMLTableSectionElement>('contributionBody');
const taskHoursChart = requireElement<HTMLDivElement>('taskHoursChart');
const burndownChart = requireElement<SVGSVGElement>('burndownChart');

const memberOverlay = requireElement<HTMLDivElement>('memberOverlay');
const closeMemberModalBtn = requireElement<HTMLButtonElement>('closeMemberModalBtn');
const memberModalName = requireElement<HTMLHeadingElement>('memberModalName');
const memberModalTeam = requireElement<HTMLParagraphElement>('memberModalTeam');
const memberChartWrap = requireElement<HTMLDivElement>('memberChartWrap');
const memberEmptyState = requireElement<HTMLParagraphElement>('memberEmptyState');
const memberModalTotal = requireElement<HTMLParagraphElement>('memberModalTotal');

const switchAccountBtn = requireElement<HTMLButtonElement>('switchAccountBtn');
const switchAccountOverlay = requireElement<HTMLDivElement>('switchAccountOverlay');
const closeSwitchAccountBtn = requireElement<HTMLButtonElement>('closeSwitchAccountBtn');
const accountList = requireElement<HTMLUListElement>('accountList');

let selectedWeeks = 2;

// ===================== MODAL OPEN/CLOSE =====================

function openModal(overlay: HTMLDivElement): void {
    overlay.classList.add('visible');
}

function closeModal(overlay: HTMLDivElement): void {
    overlay.classList.remove('visible');
}

closeMemberModalBtn.addEventListener('click', () => closeModal(memberOverlay));
memberOverlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === memberOverlay) {
        closeModal(memberOverlay);
    }
});

switchAccountBtn.addEventListener('click', () => openModal(switchAccountOverlay));
closeSwitchAccountBtn.addEventListener('click', () => closeModal(switchAccountOverlay));
switchAccountOverlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === switchAccountOverlay) {
        closeModal(switchAccountOverlay);
    }
});

accountList.querySelectorAll<HTMLLIElement>('.account-row').forEach((row) => {
    row.addEventListener('click', () => {
        const name = row.dataset['name'] ?? 'Unknown';
        closeModal(switchAccountOverlay);
        alert(`Switched to ${name}`);
    });
});

// ===================== TIME RANGE =====================

timeRangeRow.querySelectorAll<HTMLButtonElement>('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const weeks = Number(btn.dataset['weeks']);
        selectedWeeks = weeks;

        timeRangeRow.querySelectorAll<HTMLButtonElement>('.range-btn').forEach((b) => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        renderContributionTable();
    });
});

// ===================== CONTRIBUTION TABLE =====================

interface MemberStats {
    totalHours: number;
    daysWorked: number;
    avgPerDay: number;
}

function computeStats(memberName: string, maxDaysAgo: number): MemberStats {
    const sessions = SESSIONS.filter(
        (s) => s.member === memberName && s.daysAgo < maxDaysAgo
    );

    const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
    const uniqueDays = new Set(sessions.map((s) => s.daysAgo));
    const daysWorked = uniqueDays.size;
    const avgPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

    return { totalHours, daysWorked, avgPerDay };
}

function renderContributionTable(): void {
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

function openMemberModal(member: TeamMember, maxDaysAgo: number): void {
    memberModalName.textContent = member.name;
    memberModalTeam.textContent = `${member.team} — logged sessions`;

    const sessions = SESSIONS.filter(
        (s) => s.member === member.name && s.daysAgo < maxDaysAgo
    ).sort((a, b) => b.daysAgo - a.daysAgo);

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

// ===================== HOURS PER TASK CHART =====================

const TASK_BAR_COLORS = ['#8B5FBF', '#8B5FBF', '#F5C518', '#F5C518', '#F06478', '#F06478', '#2ED4C6'];

function renderTaskHoursChart(): void {
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

// ===================== BURNDOWN CHART (SVG) =====================

function renderBurndownChart(): void {
    const width = 600;
    const height = 260;
    const paddingLeft = 40;
    const paddingBottom = 30;
    const paddingTop = 10;
    const plotWidth = width - paddingLeft - 20;
    const plotHeight = height - paddingBottom - paddingTop;

    const maxValue = Math.max(...BURNDOWN_PROJECTED, ...BURNDOWN_ACTUAL);

    function toPoints(values: number[]): string {
        return values
            .map((v, i) => {
                const x = paddingLeft + (i / (values.length - 1)) * plotWidth;
                const y = paddingTop + (1 - v / maxValue) * plotHeight;
                return `${x},${y}`;
            })
            .join(' ');
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

    const yLabel = document.createElementNS(svgNS, 'text');
    yLabel.setAttribute('x', '4');
    yLabel.setAttribute('y', '12');
    yLabel.setAttribute('font-size', '11');
    yLabel.setAttribute('fill', '#6B7280');
    yLabel.textContent = 'Story pts';
    burndownChart.appendChild(yLabel);

    const xLabel = document.createElementNS(svgNS, 'text');
    xLabel.setAttribute('x', String(width - 45));
    xLabel.setAttribute('y', String(height - 8));
    xLabel.setAttribute('font-size', '11');
    xLabel.setAttribute('fill', '#6B7280');
    xLabel.textContent = 'Days';
    burndownChart.appendChild(xLabel);

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

// ===================== INIT =====================

async function init(): Promise<void> {
    await loadTeamMembers();
    await loadSessions();

    renderContributionTable();
    renderTaskHoursChart();
    renderBurndownChart();
}

init();