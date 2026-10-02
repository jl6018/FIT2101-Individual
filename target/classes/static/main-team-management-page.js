"use strict";

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

const memberNameInput = requireElement('memberName');
const memberEmailInput = requireElement('memberEmail');
const memberTeamSelect = requireElement('memberTeam');

const ownerEmailInput = requireElement('ownerEmail');

const membersBody = requireElement('membersBody');

const removeMemberName = requireElement('removeMemberName');
const removeMemberTeam = requireElement('removeMemberTeam');
const cancelRemoveBtn = requireElement('cancelRemoveBtn');
const confirmRemoveBtn = requireElement('confirmRemoveBtn');
const toast = requireElement('toast');

let rowPendingRemoval = null;

// ===================== MODAL OPEN/CLOSE =====================
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

// ===================== TOAST =====================
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

// ===================== ADD MEMBER =====================
addMemberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = memberNameInput.value.trim();
    const email = memberEmailInput.value.trim();
    const team = memberTeamSelect.value;
    if (!name || !email) return;

    const row = document.createElement('tr');
    row.dataset['name'] = name;
    row.dataset['team'] = team;
    row.innerHTML = `
        <td>${name}</td>
        <td>Member</td>
        <td>${team}</td>
        <td><button class="remove-btn">Remove</button></td>
    `;
    membersBody.appendChild(row);
    closeModal(addMemberOverlay);
    showToast(`${name} added to ${team}`);
    addMemberForm.reset();
});

// ===================== INVITE PRODUCT OWNER =====================
inviteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = ownerEmailInput.value.trim();
    if (!email) {
        ownerEmailInput.focus();
        return;
    }
    closeModal(inviteOverlay);
    showToast(`Invite sent to ${email}`);
    inviteForm.reset();
});

// ===================== REMOVE MEMBER =====================
membersBody.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('remove-btn')) return;

    const row = target.closest('tr');
    if (!row) return;

    rowPendingRemoval = row;
    removeMemberName.textContent = row.dataset['name'] ?? 'this member';
    removeMemberTeam.textContent = row.dataset['team'] ?? 'their team';
    openModal(removeMemberOverlay);
});

cancelRemoveBtn.addEventListener('click', () => {
    rowPendingRemoval = null;
    closeModal(removeMemberOverlay);
});

confirmRemoveBtn.addEventListener('click', () => {
    if (!rowPendingRemoval) {
        closeModal(removeMemberOverlay);
        return;
    }
    const name = rowPendingRemoval.dataset['name'] ?? 'Member';
    rowPendingRemoval.remove();
    rowPendingRemoval = null;
    closeModal(removeMemberOverlay);
    showToast(`${name} removed`);
});