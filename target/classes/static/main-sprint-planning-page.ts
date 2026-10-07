// main-sprint-planning-page.ts
// Compile with:
//   npx tsc main-sprint-planning-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Sprint Planning Page — Symph Web Application
 * Handles sprint creation, member loading, end-date calculation, the delete
 * sprint modal, and logout for the Sprint Planning page.
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

// ===================== SHOW CURRENT USER =====================
const nameEl = document.getElementById('signedInName');
if (nameEl) {
    const name = sessionStorage.getItem('name');
    const role = sessionStorage.getItem('role');
    if (name) {
        nameEl.textContent = role === 'ADMIN' ? `${name} (Admin)` : name;
    }
}

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param id The ID of the element to retrieve
 * @returns  The element cast to the expected type
 * @throws Error if no element with the given ID exists
 */
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

// ===================== DELETE SPRINT MODAL ELEMENTS =====================
const deleteSprintOverlay = requireElement<HTMLDivElement>('deleteSprintOverlay');
const deleteSprintName = requireElement<HTMLElement>('deleteSprintName');
const cancelDeleteBtn = requireElement<HTMLButtonElement>('cancelDeleteBtn');
const confirmDeleteBtn = requireElement<HTMLButtonElement>('confirmDeleteBtn');

// ===================== MODAL OPEN/CLOSE =====================
/**
 * Shows a modal overlay by adding the "visible" class.
 *
 * @param overlay The overlay element to show
 */
function openModal(overlay: HTMLDivElement): void { overlay.classList.add('visible'); }

/**
 * Hides a modal overlay by removing the "visible" class.
 *
 * @param overlay The overlay element to hide
 */
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    await loadMembers();
    populateSprintNameOptions();
    populateDurationOptions();

    // Pre-fill today's date
    sprintStartDateInput.value = new Date().toISOString().split('T')[0];
    recalculateEndDate();

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

/**
 * Displays a toast notification for 3 seconds.
 *
 * @param message The message to display
 * @param type    Whether the toast is a success or error notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    toast.textContent = message;
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===================== HELPERS =====================
/**
 * Converts a backend sprint status into a display label.
 *
 * @param status The raw status string
 * @returns       The display label
 */
function statusLabel(status: string): string {
    if (status === 'PLANNED') return 'Planned';
    if (status === 'ACTIVE') return 'In progress';
    if (status === 'COMPLETED') return 'Completed';
    return status;
}

/**
 * Recalculates and displays the sprint end date based on the start date
 * and duration.
 */
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

// ===================== LOAD MEMBERS =====================
/**
 * Loads all employees from the backend into the members checklist.
 */
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
                    <span>${u.name} — ${team}</span>
                </label>`;
            }).join('');
    } catch (err) {
        console.error('Failed to load members:', err);
        membersList.innerHTML = `<p class="muted">Could not load members.</p>`;
    }
}

// ===================== POPULATE SPRINT NAME OPTIONS =====================
/**
 * Populates the sprint name dropdown with the available sprint options.
 */
function populateSprintNameOptions(): void {
    sprintNameInput.innerHTML = `
        <option value="">Choose a sprint</option>
        <option value="Sprint 1">Sprint 1</option>
        <option value="Sprint 2">Sprint 2</option>
        <option value="Sprint 3">Sprint 3</option>
    `;
}

// ===================== POPULATE DURATION OPTIONS =====================
/**
 * Populates the duration dropdown with the available week options.
 */
function populateDurationOptions(): void {
    sprintDurationSelect.innerHTML = `
        <option value="">Choose a duration</option>
        <option value="1">1 week</option>
        <option value="2">2 weeks</option>
        <option value="3">3 weeks</option>
    `;
}

// ===================== LOAD SPRINTS =====================
/**
 * Loads all sprints from the backend and renders them in the past sprints table.
 */
async function loadSprints(): Promise<void> {
    try {
        const res = await fetch(SPRINTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sprints: { id: number; name: string; startDate: string; endDate: string; status: string; memberCount?: number }[] = await res.json();

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
                    <td>${s.name}</td>
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

// ===================== DELETE SPRINT (custom modal) =====================
let pendingDeleteId: number | null = null;

/**
 * Opens the delete sprint confirmation modal.
 *
 * @param sprintId   The ID of the sprint to delete
 * @param sprintName The name of the sprint to delete
 */
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

// ===================== CREATE SPRINT =====================
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

        closeModal(sprintPlanningOverlay);
        showToast('Sprint created', 'success');
        sprintPlanningForm.reset();
        populateSprintNameOptions();
        populateDurationOptions();
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