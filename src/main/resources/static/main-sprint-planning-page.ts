// main-sprint-planning-page.ts
// Compile with:
//   npx tsc main-sprint-planning-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Sprint Planning Page — Symph Web Application
 * Handles sprint creation, editing (PLANNED only), member loading,
 * end-date calculation, and the delete sprint modal.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// BFCACHE FIX
window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

// AUTH GUARD
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

const role = sessionStorage.getItem('role');
if (role !== 'ADMIN' && role !== 'PRODUCT_OWNER') {
    window.location.href = 'index-user-page.html';
    throw new Error('Only admins and product owners can access Sprint Planning');
}

// SIDEBAR COLLAPSE
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
    if (!appShell) return;
    const collapsed = !appShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
    writeSetting(SIDEBAR_KEY, collapsed ? "1" : "0");
});
setSidebarCollapsed(readSetting(SIDEBAR_KEY) === "1");

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

interface Sprint {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    memberCount?: number;
}

interface BackendUser {
    id: number;
    name: string;
    email: string;
    role: string;
    team?: { name: string } | null;
}

// CONFIG
const SPRINTS_API = "http://localhost:8080/api/sprints";
const USERS_API = "http://localhost:8080/api/users";

// ELEMENTS
const startSprintPlanningBtn = requireElement<HTMLButtonElement>('startSprintPlanningBtn');
const sprintPlanningOverlay = requireElement<HTMLDivElement>('sprintPlanningOverlay');
const closeSprintPlanningBtn = requireElement<HTMLButtonElement>('closeSprintPlanningBtn');
const sprintPlanningForm = requireElement<HTMLFormElement>('sprintPlanningForm');
const sprintPlanningTitle = requireElement<HTMLElement>('sprintPlanningTitle');
const sprintPlanningSubtitle = document.querySelector<HTMLParagraphElement>('#sprintPlanningOverlay .modal-subtitle');
const sprintSubmitBtn = document.querySelector<HTMLButtonElement>('#sprintPlanningForm button[type="submit"]');
const sprintNameInput = requireElement<HTMLSelectElement>('sprintName');
const sprintStartDateInput = requireElement<HTMLInputElement>('sprintStartDate');
const sprintDurationSelect = requireElement<HTMLSelectElement>('sprintDuration');
const sprintEndDateInput = requireElement<HTMLInputElement>('sprintEndDate');
const membersList = requireElement<HTMLDivElement>('membersList');
const pastSprintsBody = requireElement<HTMLTableSectionElement>('pastSprintsBody');
const toast = requireElement<HTMLDivElement>('toast');

const deleteSprintOverlay = requireElement<HTMLDivElement>('deleteSprintOverlay');
const deleteSprintName = requireElement<HTMLElement>('deleteSprintName');
const cancelDeleteBtn = requireElement<HTMLButtonElement>('cancelDeleteBtn');
const confirmDeleteBtn = requireElement<HTMLButtonElement>('confirmDeleteBtn');

// STATE
let allSprints: Sprint[] = [];
let editingSprintId: number | null = null;   // non-null, we're in edit mode

// MODAL OPEN/CLOSE
function openModal(overlay: HTMLDivElement): void { overlay.classList.add('visible'); }
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    editingSprintId = null;
    await loadMembers([]);
    populateSprintNameOptions();
    populateDurationOptions();

    sprintPlanningTitle.textContent = 'Sprint Planning';
    if (sprintPlanningSubtitle) {
        sprintPlanningSubtitle.textContent = 'Sprints can run up to 3 weeks';
    }
    if (sprintSubmitBtn) sprintSubmitBtn.textContent = 'Create sprint';

    sprintStartDateInput.value = new Date().toISOString().slice(0, 10);
    sprintNameInput.value = '';
    sprintDurationSelect.value = '';
    recalculateEndDate();

    openModal(sprintPlanningOverlay);
});
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));

[sprintPlanningOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// TOAST
let toastTimeoutId: number | undefined;

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    toast.textContent = message;
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// HELPERS
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

    sprintEndDateInput.value = end.toISOString().slice(0, 10);
}

sprintStartDateInput.addEventListener('change', recalculateEndDate);
sprintDurationSelect.addEventListener('change', recalculateEndDate);

// LOAD MEMBERS
// Only employees who HAVE a team are offered as "Members involved".
// `preCheckedIds` controls which are ticked; empty array = all ticked.
async function loadMembers(preCheckedIds: number[]): Promise<void> {
    try {
        const res = await fetch(USERS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = (await res.json()) as BackendUser[];

        const teamMembers = users.filter(
            (u) => u.role === 'EMPLOYEE' && u.team
        );

        membersList.innerHTML = teamMembers.length === 0
            ? `<p class="muted">No team-assigned employees available.</p>`
            : teamMembers.map((u) => {
                const checked =
                    preCheckedIds.length === 0 || preCheckedIds.includes(u.id);
                return `
                <label class="member-row">
                    <input type="checkbox" name="member" value="${u.id}" ${checked ? 'checked' : ''}>
                    <span>${escapeHtml(u.name)} — ${escapeHtml(u.team!.name)}</span>
                </label>`;
            }).join('');
    } catch (err) {
        console.error('Failed to load members:', err);
        membersList.innerHTML = `<p class="muted">Could not load members.</p>`;
    }
}

// POPULATE DROPDOWNS
function populateSprintNameOptions(): void {
    const usedNames = new Set(allSprints.map((s) => s.name));
    const options = ['Sprint 1', 'Sprint 2', 'Sprint 3'];
    const available = options.filter((n) => !usedNames.has(n));

    sprintNameInput.innerHTML =
        `<option value="">Choose a sprint</option>` +
        available.map((n) => `<option value="${n}">${n}</option>`).join('');
}

function populateDurationOptions(): void {
    sprintDurationSelect.innerHTML = `
        <option value="">Choose a duration</option>
        <option value="1">1 week</option>
        <option value="2">2 weeks</option>
        <option value="3">3 weeks</option>
    `;
}

// LOAD SPRINTS
async function loadSprints(): Promise<void> {
    try {
        const res = await fetch(SPRINTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allSprints = (await res.json()) as Sprint[];

        pastSprintsBody.innerHTML = '';

        if (allSprints.length === 0) {
            pastSprintsBody.innerHTML = `<tr><td colspan="5">No sprints yet.</td></tr>`;
            return;
        }

        allSprints
            .sort((a, b) => b.id - a.id)
            .forEach((s) => {
                const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const range = `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;

                const editable = s.status === 'PLANNED';
                const editBtn = editable
                    ? `<button class="edit-sprint-btn" type="button">Edit</button>`
                    : '';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${escapeHtml(s.name)}</td>
                    <td>${range}</td>
                    <td>${s.memberCount ?? 0}</td>
                    <td>${statusLabel(s.status)}</td>
                    <td class="sprint-actions">
                        ${editBtn}
                        <button class="delete-sprint-btn" type="button">Delete</button>
                    </td>
                `;

                row.querySelector('.edit-sprint-btn')?.addEventListener('click', () => {
                    void openEditModal(s);
                });
                row.querySelector('.delete-sprint-btn')?.addEventListener('click', () => {
                    openDeleteModal(s.id, s.name);
                });

                pastSprintsBody.appendChild(row);
            });
    } catch (err) {
        console.error('Failed to load sprints:', err);
    }
}

// EDIT SPRINT
async function openEditModal(sprint: Sprint): Promise<void> {
    editingSprintId = sprint.id;

    // Figure out which employees to tick.
    // Member list isn't stored, so all team members are ticked by default.
    await loadMembers([]);

    populateDurationOptions();

    // Pre-fill name dropdown with a single option for this sprint
    sprintNameInput.innerHTML = `<option value="${sprint.name}">${sprint.name}</option>`;
    sprintNameInput.value = sprint.name;

    sprintStartDateInput.value = sprint.startDate;
    sprintEndDateInput.value = sprint.endDate;

    // Derive duration in weeks from dates
    const start = new Date(sprint.startDate + 'T00:00:00');
    const end = new Date(sprint.endDate + 'T00:00:00');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, Math.min(3, Math.round(diffDays / 7)));
    sprintDurationSelect.value = String(weeks);

    sprintPlanningTitle.textContent = 'Edit Sprint';
    if (sprintPlanningSubtitle) {
        sprintPlanningSubtitle.textContent = 'Update the details for this planned sprint';
    }
    if (sprintSubmitBtn) sprintSubmitBtn.textContent = 'Save changes';

    openModal(sprintPlanningOverlay);
}

// DELETE SPRINT
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

// CREATE/UPDATE SPRINT
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
        showToast('End date could not be calculated.', 'error');
        return;
    }

    const checkedMembers = membersList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const memberCount = checkedMembers.length;

    const payload = {
        name: sprintName,
        startDate: startDate,
        endDate: endDate,
        memberCount,
        status: 'PLANNED',
    };

    const isEdit = editingSprintId !== null;
    const url = isEdit ? `${SPRINTS_API}/${editingSprintId}` : SPRINTS_API;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || (isEdit ? 'Failed to update sprint' : 'Failed to create sprint'));
        }

        closeModal(sprintPlanningOverlay);
        showToast(
            isEdit
                ? 'Sprint updated.'
                : 'Sprint created: Add tasks on the Sprint Board.',
            'success'
        );

        sprintPlanningForm.reset();
        editingSprintId = null;
        sprintPlanningTitle.textContent = 'Sprint Planning';
        if (sprintSubmitBtn) sprintSubmitBtn.textContent = 'Create sprint';

        recalculateEndDate();
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed';
        showToast((isEdit ? 'Update failed: ' : 'Create sprint failed: ') + message, 'error');
    }
});

// INIT
populateSprintNameOptions();
populateDurationOptions();
void loadSprints();