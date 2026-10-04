// main-sprint-planning-page.ts
// Compile with:
//   tsc main-sprint-planning-page.ts --module esnext --target esnext --strict --ignoreConfig

// ===================== BFCACHE FIX (from B) =====================
window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

// ===================== AUTH GUARD (from B) =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

// ===================== SHOW CURRENT USER (from B) =====================
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
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el as T;
}

// ===================== LOGOUT MODAL (from B) =====================
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
function openModal(overlay: HTMLDivElement): void {
    overlay.classList.add('visible');
}
function closeModal(overlay: HTMLDivElement): void {
    overlay.classList.remove('visible');
}

startSprintPlanningBtn.addEventListener('click', () => openModal(sprintPlanningOverlay));
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
    toastTimeoutId = window.setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

// ===================== CREATE SPRINT =====================
function formatDateRange(startDate: Date, weeks: number): string {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString('en-GB', options);
    const endStr = endDate.toLocaleDateString('en-GB', { ...options, year: 'numeric' });

    return `${startStr} - ${endStr}`;
}

sprintPlanningForm.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();

    const sprintName = sprintNameInput.value.trim();
    if (!sprintName) {
        sprintNameInput.focus();
        return;
    }

    const weeks = Number(sprintDurationSelect.value);
    const checkedMembers = membersList.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]:checked'
    );
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

    // TODO: POST /api/sprints once the backend endpoint exists

    closeModal(sprintPlanningOverlay);
    showToast('Sprint created');

    sprintPlanningForm.reset();
    taskDescriptionInput.value = '';
    taskDateInput.value = '';
});

// ===================== INVITE PRODUCT OWNER =====================
inviteForm.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();

    const email = ownerEmailInput.value.trim();
    if (!email) {
        ownerEmailInput.focus();
        return;
    }

    // TODO: POST /api/invite-product-owner once the backend endpoint exists

    closeModal(inviteOverlay);
    showToast(`Invite sent to ${email}`);

    inviteForm.reset();
});