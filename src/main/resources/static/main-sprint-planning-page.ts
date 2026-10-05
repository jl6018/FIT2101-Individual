// main-sprint-planning-page.ts
// Compile with:
//   tsc main-sprint-planning-page.ts --module esnext --target esnext --strict --ignoreConfig

// ===================== BFCACHE FIX =====================
window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

// ===================== SHOW CURRENT USER =====================
const nameEl = document.getElementById('signedInName');
if (nameEl) {
    const name = sessionStorage.getItem('name');
    const role = sessionStorage.getItem('role');
    if (name) {
        nameEl.textContent = role === 'ADMIN' ? `${name} (Admin)` : name;
    }
}

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    return el as T;
}

// ===================== LOGOUT MODAL =====================
const logoutBtn = requireElement<HTMLButtonElement>('logoutBtn');
const logoutOverlay = requireElement<HTMLDivElement>('logoutOverlay');
const cancelLogoutBtn = requireElement<HTMLButtonElement>('cancelLogoutBtn');
const confirmLogoutBtn = requireElement<HTMLButtonElement>('confirmLogoutBtn');

logoutBtn.addEventListener('click', () => logoutOverlay.classList.add('visible'));
cancelLogoutBtn.addEventListener('click', () => logoutOverlay.classList.remove('visible'));
confirmLogoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index-login-page.html';
});
logoutOverlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === logoutOverlay) logoutOverlay.classList.remove('visible');
});

// ===================== CONFIG =====================
const SPRINTS_API = "http://localhost:8080/api/sprints";
const USERS_API = "http://localhost:8080/api/users";

// ===================== ELEMENTS =====================
const startSprintPlanningBtn = requireElement<HTMLButtonElement>('startSprintPlanningBtn');
const inviteProductOwnerBtn = requireElement<HTMLButtonElement>('inviteProductOwnerBtn');

const sprintPlanningOverlay = requireElement<HTMLDivElement>('sprintPlanningOverlay');
const inviteOverlay = requireElement<HTMLDivElement>('inviteOverlay');

const closeSprintPlanningBtn = requireElement<HTMLButtonElement>('closeSprintPlanningBtn');
const closeInviteBtn = requireElement<HTMLButtonElement>('closeInviteBtn');

const sprintPlanningForm = requireElement<HTMLFormElement>('sprintPlanningForm');
const inviteForm = requireElement<HTMLFormElement>('inviteForm');

const sprintNameInput = requireElement<HTMLInputElement>('sprintName');
const sprintDurationSelect = requireElement<HTMLSelectElement>('sprintDuration');
const taskDescriptionInput = requireElement<HTMLInputElement>('taskDescription');
const taskDateInput = requireElement<HTMLInputElement>('taskDate');
const membersList = requireElement<HTMLDivElement>('membersList');

const ownerEmailInput = requireElement<HTMLInputElement>('ownerEmail');
const pastSprintsBody = requireElement<HTMLTableSectionElement>('pastSprintsBody');
const toast = requireElement<HTMLDivElement>('toast');

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay: HTMLDivElement): void { overlay.classList.add('visible'); }
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    await loadMembers();
    openModal(sprintPlanningOverlay);
});
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));
inviteProductOwnerBtn.addEventListener('click', () => openModal(inviteOverlay));
closeInviteBtn.addEventListener('click', () => closeModal(inviteOverlay));

[sprintPlanningOverlay, inviteOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// ===================== TOAST =====================
let toastTimeoutId: number | undefined;
function showToast(message: string): void {
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===================== HELPERS =====================
function formatDateRange(startDate: Date, weeks: number): { start: string; end: string; label: string } {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startLabel = startDate.toLocaleDateString('en-GB', opts);
    const endLabel = endDate.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        label: `${startLabel} - ${endLabel}`,
    };
}

function statusLabel(status: string): string {
    if (status === 'PLANNED') return 'Planned';
    if (status === 'ACTIVE') return 'In progress';
    if (status === 'COMPLETED') return 'Completed';
    return status;
}

// ===================== LOAD MEMBERS =====================
async function loadMembers(): Promise<void> {
    try {
        const res = await fetch(USERS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users: { id: number; name: string; role: string; team?: { name: string } | null }[] = await res.json();

        const employees = users.filter((u) => u.role === 'EMPLOYEE');

        membersList.innerHTML = employees.length === 0
            ? `<p class="muted">No employees registered yet.</p>`
            : employees.map((u) => {
                const team = u.team?.name ?? 'No team';
                return `
                <label class="member-row">
                    <input type="checkbox" name="member" value="${u.id}" checked>
                    <span>${u.name} — ${team}</span>
                </label>`;
            }).join('');
    } catch (err) {
        console.error('Failed to load members:', err);
        membersList.innerHTML = `<p class="muted">Could not load members.</p>`;
    }
}

// ===================== LOAD SPRINTS =====================
async function loadSprints(): Promise<void> {
    try {
        const res = await fetch(SPRINTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sprints: {
            id: number; name: string; startDate: string; endDate: string;
            memberCount: number; status: string;
        }[] = await res.json();

        pastSprintsBody.innerHTML = '';

        if (sprints.length === 0) {
            pastSprintsBody.innerHTML = `<tr><td colspan="4">No sprints yet.</td></tr>`;
            return;
        }

        sprints
            .sort((a, b) => b.id - a.id)
            .forEach((s) => {
                const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const range = `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${s.name}</td>
                    <td>${range}</td>
                    <td>${s.memberCount ?? 0}</td>
                    <td>${statusLabel(s.status)}</td>
                `;
                pastSprintsBody.appendChild(row);
            });
    } catch (err) {
        console.error('Failed to load sprints:', err);
    }
}

// ===================== CREATE SPRINT =====================
sprintPlanningForm.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    const sprintName = sprintNameInput.value.trim();
    if (!sprintName) { sprintNameInput.focus(); return; }

    const weeks = Number(sprintDurationSelect.value);
    const checkedMembers = membersList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const memberCount = checkedMembers.length;

    const dates = formatDateRange(new Date(), weeks);

    try {
        const res = await fetch(SPRINTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: sprintName,
                startDate: dates.start,
                endDate: dates.end,
                memberCount,
                status: 'PLANNED',
            }),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to create sprint');
        }

        closeModal(sprintPlanningOverlay);
        showToast('Sprint created');
        sprintPlanningForm.reset();
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sprint';
        alert('Create sprint failed: ' + message);
    }
});

// ===================== INVITE PRODUCT OWNER =====================
inviteForm.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    const email = ownerEmailInput.value.trim();
    if (!email) { ownerEmailInput.focus(); return; }

    try {
        const res = await fetch('/api/invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed to send invite');
        }

        closeModal(inviteOverlay);
        showToast(`Invite sent to ${email}`);
        inviteForm.reset();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invite';
        alert(message);
    }
});

// ===================== INIT =====================
loadSprints();