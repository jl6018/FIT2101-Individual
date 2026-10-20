// main-team-management-page.ts
// Compile with:
//   npx tsc main-team-management-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Team Management Page — Symph Web Application
 * Handles adding and removing team members, loading users and team
 * memberships from the backend.
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

// SHOW CURRENT USER
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
    if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    return el as T;
}

// ELEMENTS
const addMemberBtn = requireElement<HTMLButtonElement>('addMemberBtn');
const addMemberOverlay = requireElement<HTMLDivElement>('addMemberOverlay');
const removeMemberOverlay = requireElement<HTMLDivElement>('removeMemberOverlay');
const closeAddMemberBtn = requireElement<HTMLButtonElement>('closeAddMemberBtn');
const addMemberForm = requireElement<HTMLFormElement>('addMemberForm');
const memberUserSelect = requireElement<HTMLSelectElement>('memberUser');
const memberJobTitleSelect = requireElement<HTMLSelectElement>('memberJobTitle');
const memberTeamSelect = requireElement<HTMLSelectElement>('memberTeam');
const membersBody = requireElement<HTMLTableSectionElement>('membersBody');
const removeMemberName = requireElement<HTMLElement>('removeMemberName');
const removeMemberTeam = requireElement<HTMLElement>('removeMemberTeam');
const cancelRemoveBtn = requireElement<HTMLButtonElement>('cancelRemoveBtn');
const confirmRemoveBtn = requireElement<HTMLButtonElement>('confirmRemoveBtn');
const toast = requireElement<HTMLDivElement>('toast');

let rowPendingRemoval: HTMLTableRowElement | null = null;
let registeredUsers: { id: number; name: string; email: string; role: string }[] = [];

// MODAL OPEN/CLOSE
function openModal(overlay: HTMLDivElement): void { overlay.classList.add('visible'); }
function closeModal(overlay: HTMLDivElement): void { overlay.classList.remove('visible'); }

addMemberBtn.addEventListener('click', () => openModal(addMemberOverlay));
closeAddMemberBtn.addEventListener('click', () => closeModal(addMemberOverlay));

[addMemberOverlay, removeMemberOverlay].forEach((overlay) => {
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

// LOAD USERS
async function loadMembers(): Promise<void> {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');

        const allUsers = await res.json();
        registeredUsers = allUsers.filter((user: any) => user.role === 'EMPLOYEE');

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

// LOAD TABLE (ONLY ASSIGNED)
async function loadTeamMemberships(): Promise<void> {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) return;

        const users = await res.json();
        membersBody.innerHTML = '';

        users
            .filter((u: any) => u.role === 'EMPLOYEE' && u.team != null)
            .forEach((u: any) => {
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

// ADD MEMBER
addMemberForm.addEventListener('submit', async (e: SubmitEvent) => {
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

// REMOVE MEMBER
membersBody.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('remove-btn')) return;

    const row = target.closest('tr') as HTMLTableRowElement | null;
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
            const team = teams.find((t: any) => t.name === teamName);

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

// INIT
void loadMembers();
void loadTeamMemberships();