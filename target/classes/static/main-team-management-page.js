/**
 * Team Management Page — Symph Web Application
 * Compiled from main-team-management-page.ts — do not hand-edit.
 * Handles adding and removing team members, loading users and team
 * memberships from the backend, and the logout flow.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

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

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param {string} id      The ID of the element to retrieve
 * @returns {HTMLElement}  The matching DOM element
 * @throws {Error}         if no element with the given ID exists
 */
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

// ===================== ELEMENTS =====================
const addMemberBtn = requireElement('addMemberBtn');
const addMemberOverlay = requireElement('addMemberOverlay');
const removeMemberOverlay = requireElement('removeMemberOverlay');
const closeAddMemberBtn = requireElement('closeAddMemberBtn');
const addMemberForm = requireElement('addMemberForm');
const memberUserSelect = requireElement('memberUser');
const memberJobTitleSelect = requireElement('memberJobTitle');
const memberTeamSelect = requireElement('memberTeam');
const membersBody = requireElement('membersBody');
const removeMemberName = requireElement('removeMemberName');
const removeMemberTeam = requireElement('removeMemberTeam');
const cancelRemoveBtn = requireElement('cancelRemoveBtn');
const confirmRemoveBtn = requireElement('confirmRemoveBtn');
const toast = requireElement('toast');

let rowPendingRemoval = null;
let registeredUsers = [];

// ===================== MODAL OPEN/CLOSE =====================
/**
 * Shows a modal overlay by adding the "visible" class.
 *
 * @param {HTMLElement} overlay The overlay element to show
 */
function openModal(overlay) { overlay.classList.add('visible'); }

/**
 * Hides a modal overlay by removing the "visible" class.
 *
 * @param {HTMLElement} overlay The overlay element to hide
 */
function closeModal(overlay) { overlay.classList.remove('visible'); }

addMemberBtn.addEventListener('click', () => openModal(addMemberOverlay));
closeAddMemberBtn.addEventListener('click', () => closeModal(addMemberOverlay));

[addMemberOverlay, removeMemberOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// ===================== TOAST =====================
let toastTimeoutId;

/**
 * Displays a toast notification for 3 seconds.
 *
 * @param {string} message           The message to display
 * @param {string} [type='success']  Whether the toast is a success or error notification
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===================== LOAD USERS =====================
/**
 * Loads all registered employees and populates the member selection dropdown.
 */
async function loadMembers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');

        const allUsers = await res.json();
        registeredUsers = allUsers.filter((user) => user.role === 'EMPLOYEE');

        memberUserSelect.innerHTML = '<option value="">Select a user...</option>';
        registeredUsers.forEach((user) => {
            const option = document.createElement('option');
            option.value = String(user.id);
            option.textContent = `${user.name} (${user.email}) — ${user.role}`;
            memberUserSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load members:', err);
    }
}

// ===================== LOAD TABLE =====================
/**
 * Loads all users with a team assignment and renders them in the members table.
 */
async function loadTeamMemberships() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) return;

        const users = await res.json();
        membersBody.innerHTML = '';

        users
            .filter((u) => u.role === 'EMPLOYEE' && u.team != null)
            .forEach((u) => {
                const teamName = u.team.name;
                const jobTitle = u.jobTitle ?? '—';

                const row = document.createElement('tr');
                row.dataset.id = String(u.id);
                row.dataset.name = u.name;
                row.dataset.role = u.role;
                row.dataset.jobTitle = jobTitle;
                row.dataset.team = teamName;

                row.innerHTML = `
                    <td>${u.name}</td>
                    <td>${u.role}</td>
                    <td>${jobTitle}</td>
                    <td>${teamName}</td>
                    <td><button class="remove-btn">Remove</button></td>
                `;
                membersBody.appendChild(row);
            });
    } catch (err) {
        console.error('Failed to load team memberships:', err);
    }
}

// ===================== ADD MEMBER =====================
addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = memberUserSelect.value;
    const jobTitle = memberJobTitleSelect.value;
    const team = memberTeamSelect.value;

    if (!userId) { showToast('Please select a user.', 'error'); return; }
    if (!team) { showToast('Please select a team.', 'error'); return; }

    const user = registeredUsers.find((u) => String(u.id) === userId);
    if (!user) return;

    try {
        const res = await fetch(`/api/teams/by-name/${encodeURIComponent(team)}/members/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobTitle: jobTitle || null }),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to add member');
        }

        closeModal(addMemberOverlay);
        showToast(`${user.name} added to ${team}`, 'success');
        addMemberForm.reset();
        await loadTeamMemberships();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add member';
        showToast('Add member failed: ' + message, 'error');
    }
});

// ===================== REMOVE MEMBER =====================
membersBody.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('remove-btn')) return;

    const row = target.closest('tr');
    if (!row) return;

    rowPendingRemoval = row;
    removeMemberName.textContent = row.dataset.name ?? 'this member';
    removeMemberTeam.textContent = row.dataset.team ?? 'their team';
    openModal(removeMemberOverlay);
});

cancelRemoveBtn.addEventListener('click', () => {
    rowPendingRemoval = null;
    closeModal(removeMemberOverlay);
});

confirmRemoveBtn.addEventListener('click', async () => {
    if (!rowPendingRemoval) {
        closeModal(removeMemberOverlay);
        return;
    }

    const name = rowPendingRemoval.dataset.name ?? 'Member';
    const userId = rowPendingRemoval.dataset.id;
    const teamName = rowPendingRemoval.dataset.team;

    try {
        if (userId && teamName) {
            const teamsRes = await fetch('/api/teams');
            const teams = await teamsRes.json();
            const team = teams.find((t) => t.name === teamName);

            if (!team) throw new Error('Team not found');

            const delRes = await fetch(`/api/teams/${team.id}/members/${userId}`, {
                method: 'DELETE',
            });
            if (!delRes.ok) throw new Error(await delRes.text());
        }

        rowPendingRemoval.remove();
        rowPendingRemoval = null;
        closeModal(removeMemberOverlay);
        showToast(`${name} removed from team`, 'success');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        showToast('Remove failed: ' + message, 'error');
    }
});

// ===================== INIT =====================
void loadMembers();
void loadTeamMemberships();