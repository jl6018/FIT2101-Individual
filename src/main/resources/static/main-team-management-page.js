window.addEventListener('pageshow', (event) => {
    if (event.persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

"use strict";

if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Missing element: ${id}`);
    }
    return el;
}

// ===================== LOGOUT (MODAL) =====================

const logoutBtn = requireElement('logoutBtn');
const logoutOverlay = requireElement('logoutOverlay');
const cancelLogoutBtn = requireElement('cancelLogoutBtn');
const confirmLogoutBtn = requireElement('confirmLogoutBtn');

logoutBtn.addEventListener('click', () => {
    logoutOverlay.classList.add('visible');
});

cancelLogoutBtn.addEventListener('click', () => {
    logoutOverlay.classList.remove('visible');
});

confirmLogoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index-login-page.html';
});

logoutOverlay.addEventListener('click', (e) => {
    if (e.target === logoutOverlay) {
        logoutOverlay.classList.remove('visible');
    }
});

// ===================== ELEMENTS =====================

const addMemberBtn = requireElement('addMemberBtn');
const inviteProductOwnerBtn = requireElement('inviteProductOwnerBtn');
const addMemberOverlay = requireElement('addMemberOverlay');
const inviteOverlay = requireElement('inviteOverlay');
const removeMemberOverlay = requireElement('removeMemberOverlay');
const closeAddMemberBtn = requireElement('closeAddMemberBtn');
const closeInviteBtn = requireElement('closeInviteBtn');
const addMemberForm = requireElement('addMemberForm');
const inviteForm = requireElement('inviteForm');
const memberUserSelect = requireElement('memberUser');
const memberTeamSelect = requireElement('memberTeam');
const ownerEmailInput = requireElement('ownerEmail');
const membersBody = requireElement('membersBody');
const removeMemberName = requireElement('removeMemberName');
const removeMemberTeam = requireElement('removeMemberTeam');
const cancelRemoveBtn = requireElement('cancelRemoveBtn');
const confirmRemoveBtn = requireElement('confirmRemoveBtn');
const toast = requireElement('toast');

let rowPendingRemoval = null;
let registeredUsers = [];

function openModal(overlay) {
    overlay.classList.add('visible');
}

function closeModal(overlay) {
    overlay.classList.remove('visible');
}

addMemberBtn.addEventListener('click', () => openModal(addMemberOverlay));
closeAddMemberBtn.addEventListener('click', () => closeModal(addMemberOverlay));
inviteProductOwnerBtn.addEventListener('click', () => openModal(inviteOverlay));
closeInviteBtn.addEventListener('click', () => closeModal(inviteOverlay));

[addMemberOverlay, inviteOverlay, removeMemberOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

let toastTimeoutId;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) {
        window.clearTimeout(toastTimeoutId);
    }
    toastTimeoutId = window.setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

// ===================== LOAD USERS =====================

async function loadMembers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');

        const allUsers = await res.json();
        registeredUsers = allUsers.filter((user) => user.role === 'EMPLOYEE');

        memberUserSelect.innerHTML = '<option value="">Select a user...</option>';
        registeredUsers.forEach((user) => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.email}) — ${user.role}`;
            memberUserSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load members:', err);
    }
}

// ===================== LOAD TEAM MEMBERSHIPS =====================

async function loadTeamMemberships() {
    try {
        const res = await fetch('/api/teams');
        if (!res.ok) return;

        const teams = await res.json();
        membersBody.innerHTML = '';

        teams.forEach((team) => {
            (team.members || []).forEach((user) => {
                const row = document.createElement('tr');
                row.dataset.id = user.id;
                row.dataset.name = user.name;
                row.dataset.team = team.name;
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.role}</td>
                    <td>${team.name}</td>
                    <td><button class="remove-btn">Remove</button></td>
                `;
                membersBody.appendChild(row);
            });
        });
    } catch (err) {
        console.error('Failed to load team memberships:', err);
    }
}

// ===================== ADD MEMBER =====================

addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = memberUserSelect.value;
    const team = memberTeamSelect.value;

    if (!userId) {
        alert('Please select a user.');
        return;
    }

    const user = registeredUsers.find((u) => u.id == userId);
    if (!user) return;

    try {
        // ✅ Save to backend FIRST
        const res = await fetch(`/api/teams/by-name/${encodeURIComponent(team)}/members/${userId}`, {
            method: 'POST',
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to add member');
        }

        // Then update HTML
        const existingRow = membersBody.querySelector(`tr[data-id="${userId}"]`);
        if (existingRow) {
            existingRow.dataset.team = team;
            existingRow.cells[2].textContent = team;
        } else {
            const row = document.createElement('tr');
            row.dataset.id = user.id;
            row.dataset.name = user.name;
            row.dataset.team = team;
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${team}</td>
                <td><button class="remove-btn">Remove</button></td>
            `;
            membersBody.appendChild(row);
        }

        closeModal(addMemberOverlay);
        showToast(`${user.name} added to ${team}`);
        addMemberForm.reset();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add member';
        alert('Add member failed: ' + message);
    }
});

// ===================== INVITE PRODUCT OWNER =====================

inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = ownerEmailInput.value.trim();
    if (!email) {
        alert('Please enter an email address.');
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
            if (text.toLowerCase().includes('already')) {
                throw new Error('Email already invited.');
            }
            if (text.toLowerCase().includes('invalid')) {
                throw new Error('Invalid email address.');
            }
            if (text.toLowerCase().includes('required')) {
                throw new Error('Email is required.');
            }
            throw new Error(text || 'Failed to send invite.');
        }

        closeModal(inviteOverlay);
        showToast(`Invite sent to ${email}`);
        inviteForm.reset();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invite';
        alert(message);
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
        // ✅ Save to backend FIRST
        if (userId && teamName) {
            const teamsRes = await fetch('/api/teams');
            const teams = await teamsRes.json();
            const team = teams.find((t) => t.name === teamName);

            if (team) {
                const delRes = await fetch(`/api/teams/${team.id}/members/${userId}`, {
                    method: 'DELETE',
                });

                if (!delRes.ok) {
                    const msg = await delRes.text();
                    throw new Error(msg || 'Failed to remove member');
                }
            }
        }

        rowPendingRemoval.remove();
        rowPendingRemoval = null;
        closeModal(removeMemberOverlay);
        showToast(`${name} removed from team`);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        alert('Remove failed: ' + message);
    }
});

// ===================== INIT =====================

loadMembers();
loadTeamMemberships();