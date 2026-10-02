// main-team-management-page.ts
// Compile with:
//   tsc main-team-management-page.ts --module esnext --target esnext --strict --ignoreConfig
// (matches the same override used for the login and sprint planning pages,
// since the browser loads this as an ES module via <script type="module">)

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el as T;
}

// ===================== ELEMENTS =====================

const addMemberBtn = requireElement<HTMLButtonElement>('addMemberBtn');
const inviteProductOwnerBtn = requireElement<HTMLButtonElement>('inviteProductOwnerBtn');
const switchAccountBtn = requireElement<HTMLButtonElement>('switchAccountBtn');
const switchAccountOverlay = requireElement<HTMLDivElement>('switchAccountOverlay');

const addMemberOverlay = requireElement<HTMLDivElement>('addMemberOverlay');
const inviteOverlay = requireElement<HTMLDivElement>('inviteOverlay');
const removeMemberOverlay = requireElement<HTMLDivElement>('removeMemberOverlay');

const closeAddMemberBtn = requireElement<HTMLButtonElement>('closeAddMemberBtn');
const closeInviteBtn = requireElement<HTMLButtonElement>('closeInviteBtn');
const closeSwitchAccountBtn = requireElement<HTMLButtonElement>('closeSwitchAccountBtn');


const addMemberForm = requireElement<HTMLFormElement>('addMemberForm');
const inviteForm = requireElement<HTMLFormElement>('inviteForm');

const memberNameInput = requireElement<HTMLInputElement>('memberName');
const memberEmailInput = requireElement<HTMLInputElement>('memberEmail');
const memberTeamSelect = requireElement<HTMLSelectElement>('memberTeam');

const ownerEmailInput = requireElement<HTMLInputElement>('ownerEmail');

const membersBody = requireElement<HTMLTableSectionElement>('membersBody');

const removeMemberName = requireElement<HTMLSpanElement>('removeMemberName');
const removeMemberTeam = requireElement<HTMLSpanElement>('removeMemberTeam');
const cancelRemoveBtn = requireElement<HTMLButtonElement>('cancelRemoveBtn');
const confirmRemoveBtn = requireElement<HTMLButtonElement>('confirmRemoveBtn');
const accountList = requireElement<HTMLUListElement>('accountList');
const toast = requireElement<HTMLDivElement>('toast');

// Track which row is currently pending removal
let rowPendingRemoval: HTMLTableRowElement | null = null;

// ===================== MODAL OPEN/CLOSE =====================

function openModal(overlay: HTMLDivElement): void {
    overlay.classList.add('visible');
}

function closeModal(overlay: HTMLDivElement): void {
    overlay.classList.remove('visible');
}

addMemberBtn.addEventListener('click', () => openModal(addMemberOverlay));
closeAddMemberBtn.addEventListener('click', () => closeModal(addMemberOverlay));

inviteProductOwnerBtn.addEventListener('click', () => openModal(inviteOverlay));
closeInviteBtn.addEventListener('click', () => closeModal(inviteOverlay));

switchAccountBtn.addEventListener('click', () => {
    // Placeholder — wire this up once you have a shared switch-account
    // component/page consistent with the one on Sprint Planning.
    showToast('Switch account — coming soon on this page');
});
switchAccountBtn.addEventListener('click', () => openModal(switchAccountOverlay));
closeSwitchAccountBtn.addEventListener('click', () => closeModal(switchAccountOverlay));


// Close a modal by clicking its dark backdrop (outside the white card)
[addMemberOverlay, inviteOverlay, removeMemberOverlay, switchAccountOverlay].forEach((overlay) => {
    overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

// ===================== SWITCH ACCOUNT =====================

accountList.querySelectorAll<HTMLLIElement>('.account-row').forEach((row) => {
    row.addEventListener('click', () => {
        const name = row.dataset['name'] ?? 'Unknown';
        // Placeholder: wire this to your real auth/account-switch logic once
        // the backend supports multiple accounts per login.
        closeModal(switchAccountOverlay);
        showToast(`Switched to ${name}`);
    });
});

// ===================== TOAST =====================

let toastTimeoutId: number | undefined;

function showToast(message: string): void {
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

addMemberForm.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();

    const name = memberNameInput.value.trim();
    const email = memberEmailInput.value.trim();
    const team = memberTeamSelect.value;

    if (!name || !email) {
        return;
    }

    // TODO: replace with a real POST to your backend once the endpoint
    // exists, e.g.:
    // await fetch('/api/team-members', { method: 'POST', body: JSON.stringify({ name, email, team }) })

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

inviteForm.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();

    const email = ownerEmailInput.value.trim();
    if (!email) {
        ownerEmailInput.focus();
        return;
    }

    // TODO: replace with a real POST to your backend, e.g.:
    // await fetch('/api/invite-product-owner', { method: 'POST', body: JSON.stringify({ email }) })

    closeModal(inviteOverlay);
    showToast(`Invite sent to ${email}`);

    inviteForm.reset();
});

// ===================== REMOVE MEMBER =====================
// Event delegation: one listener on the table body catches clicks on any
// "Remove" button, including ones added later via Add Member.

membersBody.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('remove-btn')) {
        return;
    }

    const row = target.closest('tr');
    if (!row) {
        return;
    }

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

    // TODO: replace with a real DELETE request to your backend, e.g.:
    // await fetch(`/api/team-members/${memberId}`, { method: 'DELETE' })

    rowPendingRemoval.remove();
    rowPendingRemoval = null;

    closeModal(removeMemberOverlay);
    showToast(`${name} removed`);
});