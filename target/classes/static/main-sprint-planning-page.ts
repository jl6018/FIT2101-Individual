// main-sprint-planning-page.ts
// Compile with:
//   npx tsc main-sprint-planning-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Sprint Planning Page — Symph Web Application
 * Handles sprint creation, member loading, end-date calculation, the delete
 * sprint modal, and building tasks from the planning form (US22).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

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

// ===================== US22: SPRINT PLANNING GUARD =====================
const role = sessionStorage.getItem('role');
if (role !== 'ADMIN' && role !== 'PRODUCT_OWNER') {
    window.location.href = 'index-user-page.html';
    throw new Error('Only admins and product owners can access Sprint Planning');
}

// ===================== SIDEBAR COLLAPSE =====================
const SIDEBAR_KEY = "symph.sidebarCollapsed";
const appShell = document.getElementById("appShell");
const sidebarToggle = document.getElementById("sidebarToggle");

function readSetting(key: string): string {
    try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
}
function writeSetting(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}
function setSidebarCollapsed(collapsed: boolean): void {
    if (!appShell || !sidebarToggle) return;
    appShell.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu");
    sidebarToggle.title = collapsed ? "Expand menu" : "Collapse menu";
}
sidebarToggle?.addEventListener("click", () => {
    const collapsed = !appShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
    writeSetting(SIDEBAR_KEY, collapsed ? "1" : "0");
});
setSidebarCollapsed(readSetting(SIDEBAR_KEY) === "1");

// ===================== SHOW CURRENT USER =====================
const nameEl = document.getElementById('signedInName');
if (nameEl) {
    const name = sessionStorage.getItem('name');
    const userRole = sessionStorage.getItem('role');
    if (name) {
        const suffix =
            userRole === 'ADMIN' ? ' (Admin)' :
            userRole === 'PRODUCT_OWNER' ? ' (Product Owner)' : '';
        nameEl.textContent = `${name}${suffix}`;
    }
}

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    return el as T;
}

function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface TaskRow {
    name: string;
    description: string;
    dueDate: string;
}

interface Sprint {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    memberCount?: number;
}

// ===================== CONFIG =====================
const SPRINTS_API = "http://localhost:8080/api/sprints";
const TASKS_API = "http://localhost:8080/api/tasks";
const USERS_API = "http://localhost:8080/api/users";

// ===================== ELEMENTS =====================
const startSprintPlanningBtn = requireElement<HTMLButtonElement>('startSprintPlanningBtn');
const sprintPlanningOverlay = requireElement<HTMLDivElement>('sprintPlanningOverlay');
const closeSprintPlanningBtn = requireElement<HTMLButtonElement>('closeSprintPlanningBtn');
const sprintPlanningForm = requireElement<HTMLFormElement>('sprintPlanningForm');
const sprintNameInput = requireElement<HTMLSelectElement>('sprintName');
const sprintStartDateInput = requireElement<HTMLInputElement>('sprintStartDate');
const sprintDurationSelect = requireElement<HTMLSelectElement>('sprintDuration');
const sprintEndDateInput = requireElement<HTMLInputElement>('sprintEndDate');
const membersList = requireElement<HTMLDivElement>('membersList');
const pastSprintsBody = requireElement<HTMLTableSectionElement>('pastSprintsBody');
const toast = requireElement<HTMLDivElement>('toast');
const taskListEl = requireElement<HTMLDivElement>('taskList');
const addTaskRowBtn = requireElement<HTMLButtonElement>('addTaskRowBtn');

const deleteSprintOverlay = requireElement<HTMLDivElement>('deleteSprintOverlay');
const deleteSprintName = requireElement<HTMLElement>('deleteSprintName');
const cancelDeleteBtn = requireElement<HTMLButtonElement>('cancelDeleteBtn');
const confirmDeleteBtn = requireElement<HTMLButtonElement>('confirmDeleteBtn');

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay: HTMLDivElement): void { overlay.classList.add('visible'); }
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    await loadMembers();
    populateSprintNameOptions();
    populateDurationOptions();

    sprintStartDateInput.value = new Date().toISOString().split('T')[0];
    recalculateEndDate();

    taskListEl.innerHTML = '';
    addTaskRow();

    openModal(sprintPlanningOverlay);
});
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));

[sprintPlanningOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// ===================== TOAST =====================
let toastTimeoutId: number | undefined;

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    toast.textContent = message;
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===================== HELPERS =====================
function statusLabel(status: string): string {
    if (status === 'PLANNED') return 'Planned';
    if (status === 'ACTIVE') return 'In progress';
    if (status === 'COMPLETED') return 'Completed';
    return status;
}

function recalculateEndDate(): void {
    const startValue = sprintStartDateInput.value;
    const weeks = Number(sprintDurationSelect.value);

    if (!startValue || !weeks) {
        sprintEndDateInput.value = '';
        return;
    }

    const start = new Date(startValue + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + weeks * 7);

    sprintEndDateInput.value = end.toISOString().split('T')[0];
}

sprintStartDateInput.addEventListener('change', recalculateEndDate);
sprintDurationSelect.addEventListener('change', recalculateEndDate);

// ===================== TASK LIST BUILDER (US22) =====================
function addTaskRow(): void {
    const row = document.createElement('div');
    row.className = 'task-row';

    row.innerHTML = `
        <div class="task-row-top">
            <input type="text" class="task-row-name" placeholder="Task name" maxlength="200" />
            <input type="date" class="task-row-date" />
            <button type="button" class="task-row-remove" aria-label="Remove task">✕</button>
        </div>
        <textarea class="task-row-desc" placeholder="Description (optional)" maxlength="2000"></textarea>
    `;

    row.querySelector('.task-row-remove')?.addEventListener('click', () => row.remove());

    taskListEl.appendChild(row);
}

addTaskRowBtn.addEventListener('click', addTaskRow);

function readTaskRows(): TaskRow[] {
    const rows = taskListEl.querySelectorAll<HTMLDivElement>('.task-row');
    const tasks: TaskRow[] = [];
    rows.forEach((row) => {
        const name = (row.querySelector('.task-row-name') as HTMLInputElement).value.trim();
        const description = (row.querySelector('.task-row-desc') as HTMLTextAreaElement).value.trim();
        const dueDate = (row.querySelector('.task-row-date') as HTMLInputElement).value;
        if (name) {
            tasks.push({ name, description, dueDate });
        }
    });
    return tasks;
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
                const team = (u.team && u.team.name) ? u.team.name : 'No team';
                return `
                <label class="member-row">
                    <input type="checkbox" name="member" value="${u.id}" checked>
                    <span>${escapeHtml(u.name)} — ${escapeHtml(team)}</span>
                </label>`;
            }).join('');
    } catch (err) {
        console.error('Failed to load members:', err);
        membersList.innerHTML = `<p class="muted">Could not load members.</p>`;
    }
}

// ===================== POPULATE DROPDOWNS =====================
function populateSprintNameOptions(): void {
    sprintNameInput.innerHTML = `
        <option value="">Choose a sprint</option>
        <option value="Sprint 1">Sprint 1</option>
        <option value="Sprint 2">Sprint 2</option>
        <option value="Sprint 3">Sprint 3</option>
    `;
}

function populateDurationOptions(): void {
    sprintDurationSelect.innerHTML = `
        <option value="">Choose a duration</option>
        <option value="1">1 week</option>
        <option value="2">2 weeks</option>
        <option value="3">3 weeks</option>
    `;
}

// ===================== LOAD SPRINTS =====================
async function loadSprints(): Promise<void> {
    try {
        const res = await fetch(SPRINTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sprints: Sprint[] = await res.json();

        pastSprintsBody.innerHTML = '';

        if (sprints.length === 0) {
            pastSprintsBody.innerHTML = `<tr><td colspan="5">No sprints yet.</td></tr>`;
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
                    <td>${escapeHtml(s.name)}</td>
                    <td>${range}</td>
                    <td>${s.memberCount ?? 0}</td>
                    <td>${statusLabel(s.status)}</td>
                    <td><button class="delete-sprint-btn" type="button">Delete</button></td>
                `;

                row.querySelector('.delete-sprint-btn')?.addEventListener('click', () => {
                    openDeleteModal(s.id, s.name);
                });

                pastSprintsBody.appendChild(row);
            });
    } catch (err) {
        console.error('Failed to load sprints:', err);
    }
}

// ===================== DELETE SPRINT =====================
let pendingDeleteId: number | null = null;

function openDeleteModal(sprintId: number, sprintName: string): void {
    pendingDeleteId = sprintId;
    deleteSprintName.textContent = sprintName;
    openModal(deleteSprintOverlay);
}

cancelDeleteBtn.addEventListener('click', () => {
    pendingDeleteId = null;
    closeModal(deleteSprintOverlay);
});

deleteSprintOverlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === deleteSprintOverlay) {
        pendingDeleteId = null;
        closeModal(deleteSprintOverlay);
    }
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (pendingDeleteId === null) {
        closeModal(deleteSprintOverlay);
        return;
    }
    const id = pendingDeleteId;
    const name = deleteSprintName.textContent ?? 'Sprint';
    pendingDeleteId = null;
    closeModal(deleteSprintOverlay);

    try {
        const res = await fetch(`${SPRINTS_API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast(`Deleted ${name}`, 'success');
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        showToast('Delete failed: ' + message, 'error');
    }
});

// ===================== CREATE SPRINT + TASKS =====================
sprintPlanningForm.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    const sprintName = sprintNameInput.value.trim();
    if (!sprintName) {
        sprintNameInput.focus();
        showToast('Please choose a sprint.', 'error');
        return;
    }

    const startDate = sprintStartDateInput.value;
    if (!startDate) {
        sprintStartDateInput.focus();
        showToast('Please choose a start date.', 'error');
        return;
    }

    const weeks = Number(sprintDurationSelect.value);
    if (!weeks || weeks < 1 || weeks > 3) {
        sprintDurationSelect.focus();
        showToast('Please choose a duration.', 'error');
        return;
    }

    const endDate = sprintEndDateInput.value;
    if (!endDate) {
        showToast('Could not calculate end date.', 'error');
        return;
    }

    const checkedMembers = membersList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const memberCount = checkedMembers.length;

    try {
        const res = await fetch(SPRINTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: sprintName,
                startDate: startDate,
                endDate: endDate,
                memberCount,
                status: 'PLANNED',
            }),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to create sprint');
        }

        const createdSprint: Sprint = await res.json();

        const taskRows = readTaskRows();
        const taskResults = await Promise.all(taskRows.map((t) =>
            fetch(TASKS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: t.name,
                    description: t.description,
                    status: 'PRODUCT_BACKLOG',
                    dueDate: t.dueDate || null,
                    position: 0,
                    progress: 0,
                    sprint: { id: createdSprint.id },
                }),
            })
        ));

        const failed = taskResults.filter((r) => !r.ok).length;

        closeModal(sprintPlanningOverlay);
        if (failed > 0) {
            showToast(`Sprint created — ${failed} task(s) failed to save`, 'error');
        } else if (taskRows.length > 0) {
            showToast(`Sprint created with ${taskRows.length} task(s)`, 'success');
        } else {
            showToast('Sprint created', 'success');
        }

        sprintPlanningForm.reset();
        populateSprintNameOptions();
        populateDurationOptions();
        taskListEl.innerHTML = '';
        recalculateEndDate();
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sprint';
        showToast('Create sprint failed: ' + message, 'error');
    }
});

// ===================== INIT =====================
populateSprintNameOptions();
populateDurationOptions();
void loadSprints();