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
    if (!el) {
        throw new Error(`Missing element: ${id}`);
    }
    return el;
}

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

function openModal(overlay) { overlay.classList.add('visible'); }
function closeModal(overlay) { overlay.classList.remove('visible'); }

startSprintPlanningBtn.addEventListener('click', () => openModal(sprintPlanningOverlay));
closeSprintPlanningBtn.addEventListener('click', () => closeModal(sprintPlanningOverlay));
inviteProductOwnerBtn.addEventListener('click', () => openModal(inviteOverlay));
closeInviteBtn.addEventListener('click', () => closeModal(inviteOverlay));

[sprintPlanningOverlay, inviteOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

let toastTimeoutId;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function formatDateRange(startDate, weeks) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);
    const options = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString('en-GB', options);
    const endStr = endDate.toLocaleDateString('en-GB', { ...options, year: 'numeric' });
    return `${startStr} - ${endStr}`;
}

sprintPlanningForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const sprintName = sprintNameInput.value.trim();
    if (!sprintName) { sprintNameInput.focus(); return; }

    const weeks = Number(sprintDurationSelect.value);
    const checkedMembers = membersList.querySelectorAll('input[type="checkbox"]:checked');
    const memberCount = checkedMembers.length;
    const dateRange = formatDateRange(new Date(), weeks);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${sprintName}</td>
        <td>${dateRange}</td>
        <td>${memberCount}</td>
        <td>In progress</td>
    `;
    pastSprintsBody.prepend(row);

    closeModal(sprintPlanningOverlay);
    showToast('Sprint created');
    sprintPlanningForm.reset();
    taskDescriptionInput.value = '';
    taskDateInput.value = '';
});

inviteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = ownerEmailInput.value.trim();
    if (!email) { ownerEmailInput.focus(); return; }
    closeModal(inviteOverlay);
    showToast(`Invite sent to ${email}`);
    inviteForm.reset();
});