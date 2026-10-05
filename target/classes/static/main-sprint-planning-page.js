"use strict";
// main-sprint-planning-page.js
// Compiled from main-sprint-planning-page.ts — do not hand-edit.

// ===================== BFCACHE FIX =====================
window.addEventListener('pageshow', (event) => {
    if (event.persisted && sessionStorage.getItem('loggedIn') !== 'true') {
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

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    return el;
}

// ===================== LOGOUT MODAL =====================
const logoutBtn = requireElement('logoutBtn');
const logoutOverlay = requireElement('logoutOverlay');
const cancelLogoutBtn = requireElement('cancelLogoutBtn');
const confirmLogoutBtn = requireElement('confirmLogoutBtn');

logoutBtn.addEventListener('click', () => logoutOverlay.classList.add('visible'));
cancelLogoutBtn.addEventListener('click', () => logoutOverlay.classList.remove('visible'));
confirmLogoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index-login-page.html';
});
logoutOverlay.addEventListener('click', (e) => {
    if (e.target === logoutOverlay) logoutOverlay.classList.remove('visible');
});

// ===================== CONFIG =====================
const SPRINTS_API = "http://localhost:8080/api/sprints";
const USERS_API = "http://localhost:8080/api/users";

// ===================== ELEMENTS =====================
const startSprintPlanningBtn = requireElement('startSprintPlanningBtn');
const sprintPlanningOverlay = requireElement('sprintPlanningOverlay');
const closeSprintPlanningBtn = requireElement('closeSprintPlanningBtn');
const sprintPlanningForm = requireElement('sprintPlanningForm');
const sprintNameInput = requireElement('sprintName');
const sprintStartDateInput = requireElement('sprintStartDate');
const sprintDurationSelect = requireElement('sprintDuration');
const sprintEndDateInput = requireElement('sprintEndDate');
const membersList = requireElement('membersList');
const pastSprintsBody = requireElement('pastSprintsBody');
const toast = requireElement('toast');

// ===================== DELETE SPRINT MODAL ELEMENTS =====================
const deleteSprintOverlay = requireElement('deleteSprintOverlay');
const deleteSprintName = requireElement('deleteSprintName');
const cancelDeleteBtn = requireElement('cancelDeleteBtn');
const confirmDeleteBtn = requireElement('confirmDeleteBtn');

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay) { overlay.classList.add('visible'); }
function closeModal(overlay) { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    await loadMembers();
    populateSprintNameOptions();
    populateDurationOptions();

    sprintStartDateInput.value = new Date().toISOString().split('T')[0];
    recalculateEndDate();

    openModal(sprintPlanningOverlay);
});
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));

[sprintPlanningOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// ===================== TOAST =====================
let toastTimeoutId;

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===================== HELPERS =====================
function statusLabel(status) {
    if (status === 'PLANNED') return 'Planned';
    if (status === 'ACTIVE') return 'In progress';
    if (status === 'COMPLETED') return 'Completed';
    return status;
}

function recalculateEndDate() {
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
async function loadMembers() {
    try {
        const res = await fetch(USERS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();

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
function populateSprintNameOptions() {
    sprintNameInput.innerHTML = `
        <option value="">Choose a sprint</option>
        <option value="Sprint 1">Sprint 1</option>
        <option value="Sprint 2">Sprint 2</option>
        <option value="Sprint 3">Sprint 3</option>
    `;
}

// ===================== POPULATE DURATION OPTIONS =====================
function populateDurationOptions() {
    sprintDurationSelect.innerHTML = `
        <option value="">Choose a duration</option>
        <option value="1">1 week</option>
        <option value="2">2 weeks</option>
        <option value="3">3 weeks</option>
    `;
}

// ===================== LOAD SPRINTS =====================
async function loadSprints() {
    try {
        const res = await fetch(SPRINTS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sprints = await res.json();

        pastSprintsBody.innerHTML = '';

        if (sprints.length === 0) {
            pastSprintsBody.innerHTML = `<tr><td colspan="5">No sprints yet.</td></tr>`;
            return;
        }

        sprints
            .sort((a, b) => b.id - a.id)
            .forEach((s) => {
                const opts = { day: 'numeric', month: 'short' };
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
let pendingDeleteId = null;

function openDeleteModal(sprintId, sprintName) {
    pendingDeleteId = sprintId;
    deleteSprintName.textContent = sprintName;
    openModal(deleteSprintOverlay);
}

cancelDeleteBtn.addEventListener('click', () => {
    pendingDeleteId = null;
    closeModal(deleteSprintOverlay);
});

deleteSprintOverlay.addEventListener('click', (e) => {
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
sprintPlanningForm.addEventListener('submit', async (e) => {
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

    const checkedMembers = membersList.querySelectorAll('input[type="checkbox"]:checked');
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