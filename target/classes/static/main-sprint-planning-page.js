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
const inviteProductOwnerBtn = requireElement('inviteProductOwnerBtn');
const sprintPlanningOverlay = requireElement('sprintPlanningOverlay');
const inviteOverlay = requireElement('inviteOverlay');
const closeSprintPlanningBtn = requireElement('closeSprintPlanningBtn');
const closeInviteBtn = requireElement('closeInviteBtn');
const sprintPlanningForm = requireElement('sprintPlanningForm');
const inviteForm = requireElement('inviteForm');
const sprintNameInput = requireElement('sprintName');
const sprintDurationSelect = requireElement('sprintDuration');
const taskDescriptionInput = requireElement('taskDescription');
const taskDateInput = requireElement('taskDate');
const membersList = requireElement('membersList');
const ownerEmailInput = requireElement('ownerEmail');
const pastSprintsBody = requireElement('pastSprintsBody');
const toast = requireElement('toast');

// ===================== MODAL OPEN/CLOSE =====================
function openModal(overlay) { overlay.classList.add('visible'); }
function closeModal(overlay) { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', async () => {
    await loadMembers();
    populateSprintNameOptions();
    openModal(sprintPlanningOverlay);
});
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));
inviteProductOwnerBtn.addEventListener('click', () => openModal(inviteOverlay));
closeInviteBtn.addEventListener('click', () => closeModal(inviteOverlay));

[sprintPlanningOverlay, inviteOverlay].forEach((overlay) => {
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
function formatDateRange(startDate, weeks) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);
    const options = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString('en-GB', options);
    const endStr = endDate.toLocaleDateString('en-GB', { ...options, year: 'numeric' });
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        label: `${startStr} - ${endStr}`,
    };
}

function statusLabel(status) {
    if (status === 'PLANNED') return 'Planned';
    if (status === 'ACTIVE') return 'In progress';
    if (status === 'COMPLETED') return 'Completed';
    return status;
}

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
                    void deleteSprintById(s.id, s.name);
                });

                pastSprintsBody.appendChild(row);
            });
    } catch (err) {
        console.error('Failed to load sprints:', err);
    }
}

// ===================== DELETE SPRINT =====================
async function deleteSprintById(sprintId, sprintName) {
    if (!confirm(`Delete "${sprintName}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${SPRINTS_API}/${sprintId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast(`Deleted ${sprintName}`, 'success');
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        showToast('Delete failed: ' + message, 'error');
    }
}

// ===================== CREATE SPRINT =====================
sprintPlanningForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sprintName = sprintNameInput.value.trim();
    if (!sprintName) {
        sprintNameInput.focus();
        showToast('Please choose a sprint.', 'error');
        return;
    }

    const weeks = Number(sprintDurationSelect.value);
    if (!weeks || weeks < 1 || weeks > 3) {
        sprintDurationSelect.focus();
        showToast('Please choose a duration.', 'error');
        return;
    }

    const checkedMembers = membersList.querySelectorAll('input[type="checkbox"]:checked');
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
        showToast('Sprint created', 'success');
        sprintPlanningForm.reset();
        populateSprintNameOptions();
        populateDurationOptions();
        await loadSprints();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sprint';
        showToast('Create sprint failed: ' + message, 'error');
    }
});

// ===================== INVITE PRODUCT OWNER =====================
inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = ownerEmailInput.value.trim();
    if (!email) {
        ownerEmailInput.focus();
        showToast('Please enter an email address.', 'error');
        return;
    }

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
        showToast(`Invite sent to ${email}`, 'success');
        inviteForm.reset();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invite';
        showToast(message, 'error');
    }
});

// ===================== INIT =====================
populateSprintNameOptions();
populateDurationOptions();
loadSprints();