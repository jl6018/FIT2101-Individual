// main-admin-page.ts
// Compile with:
//   npx tsc main-admin-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Admin Board Page — Symph Web Application
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ADMIN / PRODUCT OWNER GUARD
window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index-login-page.html";
    }
});

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index-login-page.html";
    throw new Error("Not logged in");
}

const USER_ROLE = sessionStorage.getItem("role");
if (USER_ROLE !== "ADMIN" && USER_ROLE !== "PRODUCT_OWNER") {
    window.location.href = "index-user-page.html";
    throw new Error("Admin or Product Owner access only");
}

(() => {
    // HELPERS
    function avatarColor(name: string): string {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
    }

    // SHOW CURRENT USER
    const avatarEl = document.getElementById("userAvatar");
    const profileMenuName = document.getElementById("profileMenuName");
    const profileMenuSub = document.getElementById("profileMenuSub");
    const roleBadgeEl = document.getElementById("roleBadge");

    const storedName = sessionStorage.getItem("name") || "";
    const storedRole = sessionStorage.getItem("role") || "";

    if (profileMenuName) profileMenuName.textContent = storedName || "Admin";
    if (profileMenuSub) {
        profileMenuSub.textContent =
            storedRole === "PRODUCT_OWNER" ? "Product Owner" :
            storedRole === "ADMIN"         ? "Admin" :
            "—";
    }

    if (avatarEl) {
        const label = storedName
            .split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase()).join("");
        avatarEl.textContent = label || (storedName ? storedName.charAt(0).toUpperCase() : "?");
        if (storedName) avatarEl.title = storedName;
        avatarEl.style.backgroundColor = avatarColor(storedName || "?");
        avatarEl.style.color = "#ffffff";
    }

    if (roleBadgeEl) {
        roleBadgeEl.textContent =
            storedRole === "PRODUCT_OWNER" ? "Product Owner" :
            storedRole === "ADMIN"         ? "Admin" :
            "Admin";
    }

    // MENUS
    const profileMenuBtn = document.getElementById("profileMenuBtn") as HTMLButtonElement | null;
    const profileMenu = document.getElementById("profileMenu") as HTMLDivElement | null;
    const headerMenuBtn = document.getElementById("headerMenuBtn") as HTMLButtonElement | null;
    const headerMenu = document.getElementById("headerMenu") as HTMLDivElement | null;
    const tagFilterBtn = document.getElementById("tagFilterBtn") as HTMLButtonElement | null;
    const tagFilterMenu = document.getElementById("tagFilterMenu") as HTMLDivElement | null;
    const teamFilterBtn = document.getElementById("teamFilterBtn") as HTMLButtonElement | null;
    const teamFilterMenu = document.getElementById("teamFilterMenu") as HTMLDivElement | null;
    const notifMenu = document.getElementById("notifMenu") as HTMLDivElement | null;
    const notifBellBtn = document.getElementById("notifBellBtn") as HTMLButtonElement | null;

    function setProfileMenuOpen(open: boolean): void {
        if (!profileMenu || !profileMenuBtn) return;
        profileMenu.classList.toggle("visible", open);
        profileMenuBtn.setAttribute("aria-expanded", String(open));
    }
    function setHeaderMenuOpen(open: boolean): void {
        if (!headerMenu || !headerMenuBtn) return;
        headerMenu.classList.toggle("visible", open);
        headerMenuBtn.setAttribute("aria-expanded", String(open));
    }
    function setTagFilterOpen(open: boolean): void {
        if (!tagFilterMenu || !tagFilterBtn) return;
        tagFilterMenu.classList.toggle("visible", open);
        tagFilterBtn.setAttribute("aria-expanded", String(open));
    }
    function setTeamFilterOpen(open: boolean): void {
        if (!teamFilterMenu || !teamFilterBtn) return;
        teamFilterMenu.classList.toggle("visible", open);
        teamFilterBtn.setAttribute("aria-expanded", String(open));
    }
    function closeAllMenus(): void {
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
        setTeamFilterOpen(false);
        if (notifMenu && notifBellBtn) {
            notifMenu.classList.remove("visible");
            notifBellBtn.setAttribute("aria-expanded", "false");
        }
    }

    profileMenuBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const willOpen = !profileMenu!.classList.contains("visible");
        closeAllMenus();
        setProfileMenuOpen(willOpen);
    });

    headerMenuBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const willOpen = !headerMenu!.classList.contains("visible");
        closeAllMenus();
        setHeaderMenuOpen(willOpen);
    });

    // ===================== LOGOUT =====================
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutOverlay = document.getElementById("logoutOverlay");
    const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

    logoutBtn?.addEventListener("click", () => {
        closeAllMenus();
        logoutOverlay?.classList.add("visible");
    });
    cancelLogoutBtn?.addEventListener("click", () => logoutOverlay?.classList.remove("visible"));
    confirmLogoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index-login-page.html";
    });
    logoutOverlay?.addEventListener("click", (e) => {
        if (e.target === logoutOverlay) logoutOverlay.classList.remove("visible");
    });

    document.addEventListener("click", (event: MouseEvent) => {
        const t = event.target as Node;
        if (profileMenu?.classList.contains("visible")
            && !profileMenu.contains(t) && !profileMenuBtn?.contains(t)) {
            setProfileMenuOpen(false);
        }
        if (headerMenu?.classList.contains("visible")
            && !headerMenu.contains(t) && !headerMenuBtn?.contains(t)) {
            setHeaderMenuOpen(false);
        }
        if (tagFilterMenu?.classList.contains("visible")
            && !tagFilterMenu.contains(t) && !tagFilterBtn?.contains(t)) {
            setTagFilterOpen(false);
        }
        if (teamFilterMenu?.classList.contains("visible")
            && !teamFilterMenu.contains(t) && !teamFilterBtn?.contains(t)) {
            setTeamFilterOpen(false);
        }
        if (notifMenu?.classList.contains("visible")
            && !notifMenu.contains(t) && !notifBellBtn?.contains(t)) {
            notifMenu.classList.remove("visible");
            notifBellBtn?.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") closeAllMenus();
    });

    // TYPES
    type ColumnId = "PRODUCT_BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";
    type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "";
    type Assignee =
        | { kind: "team"; teamId: string }
        | { kind: "teams"; teamIds: string[] }
        | { kind: "employees"; employeeIds: string[] };
    type Tag = { id: number; name: string };
    type Task = {
        id: string;
        sprintId: string;
        column: ColumnId;
        title: string;
        description: string;
        assignee: Assignee | null;
        dueDate: string;
        estimateHours: number;
        priority: Priority;
        position: number;
        tags: Tag[];
        progress: number;
    };
    type Team = { id: string; name: string };
    type Employee = { id: string; name: string; team: string };
    type BackendTask = {
        id: number;
        name: string;
        description?: string | null;
        status?: ColumnId | null;
        assignedTeams?: string | null;
        assignedEmployeeIds?: string | null;
        dueDate?: string | null;
        estimateHours?: number | null;
        priority?: Priority | null;
        position?: number | null;
        tags?: { id: number; name: string }[] | null;
        progress?: number | null;
        sprint?: { id: number } | null;
    };
    type BackendUser = {
        id: number;
        name: string;
        email: string;
        role: string;
        team?: { name: string } | null;
    };
    type Sprint = {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        status: "PLANNED" | "ACTIVE" | "COMPLETED";
        memberCount?: number;
    };
    type TimeLogRow = {
        id: number;
        date: string | null;
        hours: number;
        description?: string | null;
        task?: { id: number; name: string } | null;
        user?: { id: number; name: string; role: string } | null;
    };
    type CommentDto = {
        id: number;
        body: string;
        createdAt: string;
        authorId: number;
        authorName: string;
        authorRole: string;
        taskId?: number;
        taskName?: string;
    };
    type RecentComment = {
        id: number;
        body: string;
        createdAt: string;
        authorId: number;
        authorName: string;
        authorRole: string;
        taskId: number;
        taskName: string;
    };
    type Invite = {
        id: number;
        email: string;
    };

    // CONFIGURATIONS
    const API_BASE = "http://localhost:8080/api/tasks";
    const USERS_API = "http://localhost:8080/api/users";
    const SPRINTS_API = "http://localhost:8080/api/sprints";
    const TAGS_API = "http://localhost:8080/api/tags";
    const TIMELOGS_API = "http://localhost:8080/api/timelogs";
    const RECENT_COMMENTS_API = "http://localhost:8080/api/tasks/comments/recent?limit=20";
    const INVITES_API = "http://localhost:8080/api/invites";

    const TAG_FILTER_ALL = "all";

    const SPRINT_TAB_NAMES: Record<string, string> = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };

    // REFERENCE DATA
    const TEAMS: Team[] = [
        { id: "Team Alpha", name: "Team Alpha" },
        { id: "Team Beta", name: "Team Beta" },
        { id: "Team Gamma", name: "Team Gamma" },
    ];

    let EMPLOYEES: Employee[] = [];

    async function loadEmployeesFromBackend(): Promise<void> {
        try {
            const res = await fetch(USERS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users: BackendUser[] = await res.json();
            EMPLOYEES = users
                .filter((u) => u.role === "EMPLOYEE")
                .map((u) => ({
                    id: String(u.id),
                    name: u.name,
                    team: u.team?.name ?? "",
                }));
        } catch (err) {
            console.error("Failed to load employees:", err);
            EMPLOYEES = [];
        }
    }

    const COLUMNS: { id: ColumnId; name: string }[] = [
        { id: "PRODUCT_BACKLOG", name: "Product Backlog" },
        { id: "TO_DO", name: "To Do" },
        { id: "IN_PROGRESS", name: "In Progress" },
        { id: "IN_REVIEW", name: "In Review" },
        { id: "COMPLETED", name: "Completed" },
    ];

    function blankTask(sprintId: string, column: ColumnId): Task {
        return {
            id: "", sprintId, column, title: "", description: "",
            assignee: null, dueDate: "", estimateHours: 0, priority: "",
            position: 0, tags: [], progress: 0,
        };
    }

    // HELPERS
    function requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
        return el as T;
    }
    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function initials(name: string): string {
        return name.split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase()).join("");
    }
    function teamName(teamId: string): string {
        return TEAMS.find((team) => team.id === teamId)?.name ?? "";
    }
    function findEmployee(employeeId: string): Employee | undefined {
        return EMPLOYEES.find((employee) => employee.id === employeeId);
    }
    function assignedEmployees(assignee: Assignee | null): Employee[] {
        if (assignee?.kind !== "employees") return [];
        return assignee.employeeIds
            .map(findEmployee)
            .filter((employee): employee is Employee => employee !== undefined);
    }
    function teamsOfTask(task: Task): string[] {
        if (!task.assignee) return [];
        if (task.assignee.kind === "team") return [task.assignee.teamId];
        if (task.assignee.kind === "teams") return task.assignee.teamIds;
        return assignedEmployees(task.assignee).map((e) => e.team).filter(Boolean);
    }
    function assigneeLabel(assignee: Assignee | null): string {
        if (!assignee) return "Unassigned";
        if (assignee.kind === "team") return teamName(assignee.teamId) || "Team";
        if (assignee.kind === "teams") return assignee.teamIds.join(", ");
        const names = assignedEmployees(assignee).map((e) => e.name);
        return names.length > 0 ? names.join(", ") : "Unassigned";
    }
    function formatEstimate(hours: number): string { return `${hours}h`; }

    function formatDateBadge(isoDate: string): string {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function formatDateShort(iso: string | null | undefined): string {
        if (!iso) return "—";
        const d = new Date(`${iso}T00:00:00`);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    function readSetting(key: string): string {
        try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
    }
    function writeSetting(key: string, value: string): void {
        try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    }

    const SPRINT_KEY = "symph.currentSprint";
    function readSprintSetting(): string { return readSetting(SPRINT_KEY) || "1"; }
    function writeSprintSetting(sprintId: string): void { writeSetting(SPRINT_KEY, sprintId); }

    // STATE
    let tasks: Task[] = [];
    let currentSprintId = readSprintSetting();
    let currentSprintBackendId: string | null = null;
    let currentTeamId = "all";
    let currentTagName: string = TAG_FILTER_ALL;
    let sortByTag = false;
    let searchTerm = "";

    const board = requireElement<HTMLElement>("board");

    function assigneeToBackendPayload(assignee: Assignee | null): {
        assignedTeams: string | null;
        assignedEmployeeIds: string | null;
    } {
        if (!assignee) return { assignedTeams: null, assignedEmployeeIds: null };
        if (assignee.kind === "team") return { assignedTeams: assignee.teamId, assignedEmployeeIds: null };
        if (assignee.kind === "teams") return { assignedTeams: assignee.teamIds.join(","), assignedEmployeeIds: null };
        return { assignedTeams: null, assignedEmployeeIds: assignee.employeeIds.join(",") };
    }
    function parseAssignee(t: BackendTask): Assignee | null {
        if (t.assignedEmployeeIds) {
            const ids = String(t.assignedEmployeeIds).split(",").map((s) => s.trim()).filter(Boolean);
            if (ids.length > 0) return { kind: "employees", employeeIds: ids };
        }
        if (t.assignedTeams) {
            const names = String(t.assignedTeams).split(",").map((s) => s.trim()).filter(Boolean);
            const only = names[0];
            if (names.length === 1 && only) return { kind: "team", teamId: only };
            if (names.length > 1) return { kind: "teams", teamIds: names };
        }
        return null;
    }

    // SPRINT RESOLUTION
    async function resolveSprintBackendId(tabId: string): Promise<string | null> {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text) return null;
            const sprint = JSON.parse(text) as Sprint;
            return sprint?.id != null ? String(sprint.id) : null;
        } catch (err) {
            console.error("Failed to resolve sprint backend id:", err);
            return null;
        }
    }

    // CUSTOM MODALS
    function showOverlay(id: string): void {
        const el = document.getElementById(id);
        if (el) el.classList.add("visible");
    }
    function hideOverlay(id: string): void {
        const el = document.getElementById(id);
        if (el) el.classList.remove("visible");
    }

    function showNoSprintModal(): void { showOverlay("noSprintOverlay"); }
    document.getElementById("closeNoSprintBtn")?.addEventListener("click", () => hideOverlay("noSprintOverlay"));
    document.getElementById("noSprintOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("noSprintOverlay")) hideOverlay("noSprintOverlay");
    });

    let confirmResolver: ((value: boolean) => void) | null = null;
    function showConfirmModal(opts: {
        title: string; message: string; confirmText?: string; danger?: boolean;
    }): Promise<boolean> {
        return new Promise((resolve) => {
            confirmResolver = resolve;
            const titleEl = document.getElementById("confirmTitle");
            const msgEl = document.getElementById("confirmMessage");
            const okBtn = document.getElementById("confirmOkBtn") as HTMLButtonElement | null;
            if (titleEl) titleEl.textContent = opts.title;
            if (msgEl) msgEl.textContent = opts.message;
            if (okBtn) {
                okBtn.textContent = opts.confirmText ?? "OK";
                okBtn.classList.toggle("btn-danger", opts.danger === true);
                okBtn.classList.toggle("btn-primary", opts.danger !== true);
            }
            showOverlay("confirmOverlay");
        });
    }
    function closeConfirmModal(result: boolean): void {
        hideOverlay("confirmOverlay");
        if (confirmResolver) { confirmResolver(result); confirmResolver = null; }
    }
    document.getElementById("confirmOkBtn")?.addEventListener("click", () => closeConfirmModal(true));
    document.getElementById("confirmCancelBtn")?.addEventListener("click", () => closeConfirmModal(false));
    document.getElementById("confirmOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("confirmOverlay")) closeConfirmModal(false);
    });

    function showAlertModal(title: string, message: string): void {
        const titleEl = document.getElementById("alertTitle");
        const msgEl = document.getElementById("alertMessage");
        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        showOverlay("alertOverlay");
    }
    document.getElementById("closeAlertBtn")?.addEventListener("click", () => hideOverlay("alertOverlay"));
    document.getElementById("alertOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("alertOverlay")) hideOverlay("alertOverlay");
    });

    const shareBtn = document.getElementById("shareBtn");
    const inviteOverlay = document.getElementById("inviteOverlay");
    const closeInviteBtn = document.getElementById("closeInviteBtn");
    const inviteForm = document.getElementById("inviteForm") as HTMLFormElement | null;
    const ownerEmailInput = document.getElementById("ownerEmail") as HTMLInputElement | null;

    // INVITE LIST
    const inviteList = document.getElementById("inviteList") as HTMLDivElement | null;

    async function loadInvites(): Promise<void> {
        if (!inviteList) return;
        inviteList.innerHTML = `<p class="invite-empty">Loading…</p>`;
        try {
            const res = await fetch(INVITES_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const invites = (await res.json()) as Invite[];
            renderInvites(invites);
        } catch (err) {
            console.error("Failed to load invites:", err);
            inviteList.innerHTML = `<p class="invite-empty">Could not load invites.</p>`;
        }
    }

    function renderInvites(invites: Invite[]): void {
        if (!inviteList) return;
        if (!invites || invites.length === 0) {
            inviteList.innerHTML = `<p class="invite-empty">No pending invites.</p>`;
            return;
        }
        inviteList.innerHTML = invites.map((inv) => `
            <div class="invite-row" data-invite-id="${inv.id}">
                <span class="invite-row-email">${escapeHtml(inv.email)}</span>
                <button type="button" class="invite-revoke-btn"
                        data-revoke="${inv.id}"
                        aria-label="Revoke invite for ${escapeHtml(inv.email)}">Revoke</button>
            </div>
        `).join("");
    }

    async function revokeInvite(id: number): Promise<void> {
        const confirmed = await showConfirmModal({
            title: "Revoke this invite?",
            message: "They will no longer be able to log in as a Product Owner.",
            confirmText: "Revoke",
            danger: true,
        });
        if (!confirmed) return;
        try {
            const res = await fetch(`${INVITES_API}/${id}`, { method: "DELETE" });
            if (res.status === 404) {
                showToast("That invite no longer exists.");
            } else if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            } else {
                showToast("Invite revoked");
            }
            await loadInvites();
        } catch (err) {
            console.error("Revoke invite failed:", err);
            showToast("Could not revoke the invite. Please try again.");
        }
    }

    inviteList?.addEventListener("click", (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-revoke]");
        if (!btn) return;
        const id = btn.dataset["revoke"];
        if (id) void revokeInvite(Number(id));
    });

    shareBtn?.addEventListener("click", () => {
        closeAllMenus();
        inviteOverlay?.classList.add("visible");
        void loadInvites();
    });
    closeInviteBtn?.addEventListener("click", () => inviteOverlay?.classList.remove("visible"));
    inviteOverlay?.addEventListener("click", (e) => {
        if (e.target === inviteOverlay) inviteOverlay.classList.remove("visible");
    });

    inviteForm?.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        const email = ownerEmailInput?.value.trim();
        if (!email) { showToast("Please enter an email address."); return; }
        try {
            const res = await fetch(INVITES_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const text = await res.text();
                console.error("Invite failed — backend said:", text);
                throw new Error(text || "Failed to send invite.");
            }
            showToast(`Invite sent to ${email}`);
            inviteForm.reset();
            await loadInvites();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send invite";
            showToast(message);
        }
    });
    // /INVITE LIST

    // BACKEND SYNC
    async function fetchTasks(): Promise<Task[]> {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: BackendTask[] = await res.json();
            return data.map((t) => ({
                id: String(t.id),
                sprintId: t.sprint?.id != null ? String(t.sprint.id) : "",
                column: (t.status ?? "PRODUCT_BACKLOG") as ColumnId,
                title: t.name,
                description: t.description ?? "",
                assignee: parseAssignee(t),
                dueDate: t.dueDate ?? "",
                estimateHours: t.estimateHours ?? 0,
                priority: (t.priority ?? "") as Priority,
                position: t.position ?? 0,
                tags: Array.isArray(t.tags) ? t.tags : [],
                progress: typeof t.progress === "number" ? t.progress : 0,
            }));
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    async function refreshFromBackend(): Promise<void> {
        tasks = await fetchTasks();
        renderBoard();
        renderTeamFilter();
        renderTagFilter();
    }

    async function apiCreate(task: Task): Promise<Task | null> {
        try {
            const payload = assigneeToBackendPayload(task.assignee);
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: task.title,
                    description: task.description,
                    status: task.column,
                    assignedTeams: payload.assignedTeams,
                    assignedEmployeeIds: payload.assignedEmployeeIds,
                    dueDate: task.dueDate || null,
                    estimateHours: task.estimateHours,
                    priority: task.priority || null,
                    position: task.position,
                    progress: task.progress ?? 0,
                    sprint: currentSprintBackendId ? { id: Number(currentSprintBackendId) } : null,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as Task;
        } catch (err) {
            console.error("Create failed:", err);
            showAlertModal("Create failed", "Failed to create task. Please try again.");
            return null;
        }
    }

    async function apiUpdate(task: Task): Promise<boolean> {
        try {
            const numericId = Number(task.id);
            if (!Number.isFinite(numericId) || numericId <= 0) {
                showAlertModal("Save failed", "This task has no ID yet. Try refreshing the page.");
                return false;
            }
            const payload = assigneeToBackendPayload(task.assignee);
            const body = {
                name: task.title,
                description: task.description,
                status: task.column,
                assignedTeams: payload.assignedTeams,
                assignedEmployeeIds: payload.assignedEmployeeIds,
                dueDate: task.dueDate || null,
                estimateHours: task.estimateHours,
                priority: task.priority || null,
                position: task.position,
                progress: task.progress ?? 0,
                sprint: currentSprintBackendId ? { id: Number(currentSprintBackendId) } : null,
            };
            const res = await fetch(`${API_BASE}/${numericId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return true;
        } catch (err) {
            console.error("Update failed:", err);
            showAlertModal("Save failed", "Failed to save task. Please try again.");
            return false;
        }
    }

    async function apiDelete(id: string): Promise<boolean> {
        try {
            const numericId = Number(id);
            if (!Number.isFinite(numericId) || numericId <= 0) return false;
            const role = sessionStorage.getItem("role") || "";
            const res = await fetch(`${API_BASE}/${numericId}`, {
                method: "DELETE",
                headers: { "X-Role": role },
            });
            if (res.status === 403) { showAlertModal("Not allowed", "Only admins can delete tasks."); return false; }
            if (!res.ok) {
                const text = await res.text();
                showAlertModal("Delete failed", text || `HTTP ${res.status}`);
                return false;
            }
            return true;
        } catch (err) {
            console.error("Delete failed:", err);
            showAlertModal("Delete failed", "Failed to delete task. Please try again.");
            return false;
        }
    }

    // RENDER
    function visibleTasks(): Task[] {
        const term = searchTerm.toLowerCase();
        return tasks.filter((task) => {
            if (!currentSprintBackendId) return false;
            if (task.sprintId !== currentSprintBackendId) return false;
            if (currentTeamId !== "all" && !teamsOfTask(task).includes(currentTeamId)) return false;
            if (currentTagName !== TAG_FILTER_ALL) {
                const hasTag = (task.tags ?? []).some(
                    (t) => t.name.toLowerCase() === currentTagName.toLowerCase()
                );
                if (!hasTag) return false;
            }
            if (term && !task.title.toLowerCase().includes(term)) return false;
            return true;
        });
    }

    function renderAssignee(task: Task): string {
        if (!task.assignee) return "";
        if (task.assignee.kind === "team") {
            return `<span class="team-chip">${escapeHtml(teamName(task.assignee.teamId))}</span>`;
        }
        if (task.assignee.kind === "teams") {
            return task.assignee.teamIds
                .map((t) => `<span class="team-chip">${escapeHtml(t)}</span>`).join(" ");
        }
        return assignedEmployees(task.assignee)
            .map((employee) =>
                `<div class="avatar avatar-small" style="background:${avatarColor(employee.name)};" title="${escapeHtml(employee.name)} · ${escapeHtml(employee.team)}">${escapeHtml(initials(employee.name))}</div>`
            ).join("");
    }

    const PENCIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/></svg>`;
    const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;

    function renderProgressBar(task: Task): string {
        const pct = Math.max(0, Math.min(100, Number(task.progress) || 0));
        if (pct <= 0) return "";
        return `
      <div class="progress-wrap" title="Progress: ${pct}%">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-text">${pct}%</span>
      </div>`;
    }

    function renderCard(task: Task): string {
        const priorityBadge = task.priority
            ? `<span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>` : "";
        const badges = [
            priorityBadge,
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${formatEstimate(task.estimateHours)}</span>` : "",
        ].join("");
        const tagBadges = (task.tags ?? []).map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`).join("");
        const assigneeHtml = renderAssignee(task);
        const footerHtml = badges || assigneeHtml || tagBadges
            ? `<div class="card-footer-row"><div class="card-badges">${badges}${tagBadges}</div><div class="tag-avatars">${assigneeHtml}</div></div>`
            : "";
        const progressHtml = renderProgressBar(task);

        return `
      <div class="card${footerHtml || progressHtml ? " card-detailed" : ""}" draggable="true" data-task="${escapeHtml(task.id)}">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
          <button type="button" class="edit-icon" data-edit="${escapeHtml(task.id)}" title="Edit task details" aria-label="Edit ${escapeHtml(task.title)}">${PENCIL_ICON}</button>
        </div>
        ${progressHtml}
        ${footerHtml}
      </div>`;
    }

    function renderBoard(): void {
        if (!currentSprintBackendId) {
            board.innerHTML = `
                <div class="board-empty-sprint">
                    <p><strong>No sprint exists on this tab yet.</strong></p>
                    <p>Go to <a href="index-sprint-planning-page.html">Sprint Planning</a>, create
                    <em>${escapeHtml(SPRINT_TAB_NAMES[currentSprintId] || "a sprint")}</em>, then come back to this page.</p>
                </div>`;
            return;
        }

        const shown = visibleTasks();
        board.innerHTML = COLUMNS.map((column) => {
            const cards = shown
                .filter((task) => task.column === column.id)
                .sort((a, b) => {
                    if (sortByTag) {
                        const aTag = (a.tags ?? [])[0]?.name.toLowerCase() ?? "\uffff";
                        const bTag = (b.tags ?? [])[0]?.name.toLowerCase() ?? "\uffff";
                        if (aTag !== bTag) return aTag < bTag ? -1 : 1;
                    }
                    return a.position - b.position;
                });
            return `
      <section class="column" data-column="${column.id}">
        <h2>${column.name}</h2>
        <div class="card-list">${cards.map(renderCard).join("")}</div>
        <button type="button" class="add-card" data-add="${column.id}">+Add a card</button>
      </section>`;
        }).join("");
    }

    board.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const editBtn = target.closest<HTMLElement>("[data-edit]");
        if (editBtn) {
            const task = tasks.find((t) => t.id === editBtn.dataset["edit"]);
            if (task) openModal(task);
            return;
        }

        const addBtn = target.closest<HTMLElement>("[data-add]");
        if (addBtn) {
            if (!currentSprintBackendId) {
                showAlertModal(
                    "No sprint on this tab",
                    "Create a sprint on this tab first in Sprint Planning, then you can add cards."
                );
                return;
            }
            const draftTask = blankTask(currentSprintId, addBtn.dataset["add"] as ColumnId);
            if (currentTeamId !== "all") draftTask.assignee = { kind: "team", teamId: currentTeamId };
            openModal(draftTask);
        }
    });

    // LOGGED HOURS PANEL
    const loggedHoursBody = document.getElementById("loggedHoursBody") as HTMLTableSectionElement | null;
    const loggedHoursTotal = document.getElementById("loggedHoursTotal") as HTMLParagraphElement | null;
    const loggedHoursRangeFilter = document.getElementById("loggedHoursRangeFilter") as HTMLSelectElement | null;
    const loggedHoursRefreshBtn = document.getElementById("loggedHoursRefreshBtn") as HTMLButtonElement | null;
    const loggedHoursScope = document.getElementById("loggedHoursScope") as HTMLSpanElement | null;

    async function loadLoggedHours(): Promise<void> {
        if (!loggedHoursBody) return;

        loggedHoursBody.innerHTML = `<tr><td colspan="5" class="muted">Loading…</td></tr>`;
        if (loggedHoursTotal) loggedHoursTotal.textContent = "";

        const teamFilter = currentTeamId;
        if (loggedHoursScope) {
            loggedHoursScope.textContent = teamFilter === "all" ? "— all teams" : `— ${teamFilter}`;
        }

        if (!currentSprintBackendId) {
            loggedHoursBody.innerHTML = `<tr><td colspan="5" class="muted">No logs found.</td></tr>`;
            if (loggedHoursTotal) loggedHoursTotal.textContent = "Total: 0h";
            return;
        }

        try {
            const res = await fetch(TIMELOGS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            let logs = (await res.json()) as TimeLogRow[];

            if (teamFilter !== "all") {
                const memberIds = new Set(
                    EMPLOYEES.filter((e) => e.team === teamFilter).map((e) => e.id)
                );
                logs = logs.filter((l) => l.user && memberIds.has(String(l.user.id)));
            }

            const sprintTaskIds = new Set(
                tasks
                    .filter((t) => t.sprintId === currentSprintBackendId)
                    .map((t) => String(t.id))
            );
            logs = logs.filter((l) => l.task && sprintTaskIds.has(String(l.task.id)));

            const rangeVal = loggedHoursRangeFilter?.value || "all";
            if (rangeVal !== "all") {
                const days = Number(rangeVal) || 7;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - (days - 1));
                const cutoffIso = cutoff.toISOString().slice(0, 10);
                logs = logs.filter((l) => (l.date ?? "") >= cutoffIso);
            }

            logs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

            if (logs.length === 0) {
                loggedHoursBody.innerHTML = `<tr><td colspan="5" class="muted">No logs found.</td></tr>`;
                if (loggedHoursTotal) loggedHoursTotal.textContent = "Total: 0h";
                return;
            }

            let total = 0;
            loggedHoursBody.innerHTML = logs.map((l) => {
                const hours = Number(l.hours || 0);
                total += hours;
                const date = formatDateShort(l.date);
                const task = l.task?.name ?? "—";
                const user = l.user?.name ?? "—";
                const desc = l.description ? escapeHtml(l.description) : "—";
                return `
                    <tr>
                        <td>${escapeHtml(date)}</td>
                        <td>${escapeHtml(task)}</td>
                        <td>${escapeHtml(user)}</td>
                        <td>${hours.toFixed(1)}h</td>
                        <td>${desc}</td>
                    </tr>`;
            }).join("");

            if (loggedHoursTotal) {
                loggedHoursTotal.textContent = `Total: ${total.toFixed(1)}h across ${logs.length} log(s)`;
            }
        } catch (err) {
            console.error("Failed to load logged hours:", err);
            loggedHoursBody.innerHTML = `<tr><td colspan="5" class="muted">Could not load logs.</td></tr>`;
        }
    }

    loggedHoursRefreshBtn?.addEventListener("click", () => { void loadLoggedHours(); });
    loggedHoursRangeFilter?.addEventListener("change", () => { void loadLoggedHours(); });

    // DRAG AND DROP
    // US17: only an admin may complete a task, and only from In Review.
    function completionBlockedReason(from: ColumnId, to: ColumnId): string | null {
        if (to !== "COMPLETED" || from === "COMPLETED") return null;
        if (sessionStorage.getItem("role") !== "ADMIN") return "Only an admin can mark a task as Completed.";
        if (from !== "IN_REVIEW") return "A task must be In Review before it can be marked Completed.";
        return null;
        }

    let draggedTaskId: string | null = null;
    function clearDropMarkers(): void {
        board.querySelectorAll(".drop-target, .drop-before").forEach((el) => {
            el.classList.remove("drop-target", "drop-before");
        });
    }
    function cardAfterPointer(column: HTMLElement, pointerY: number): HTMLElement | null {
        const cards = Array.from(column.querySelectorAll<HTMLElement>(".card:not(.dragging)"));
        return cards.find((card) => {
            const box = card.getBoundingClientRect();
            return pointerY < box.top + box.height / 2;
        }) ?? null;
    }
    board.addEventListener("dragstart", (event: DragEvent) => {
        const card = (event.target as HTMLElement).closest<HTMLElement>("[data-task]");
        if (!card || !event.dataTransfer) return;
        draggedTaskId = card.dataset["task"] ?? null;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedTaskId ?? "");
        card.classList.add("dragging");
    });
    board.addEventListener("dragover", (event: DragEvent) => {
        const column = (event.target as HTMLElement).closest<HTMLElement>(".column");
        if (!column || !draggedTaskId) return;
        event.preventDefault();
        clearDropMarkers();
        column.classList.add("drop-target");
        cardAfterPointer(column, event.clientY)?.classList.add("drop-before");
    });
    board.addEventListener("drop", async (event: DragEvent) => {
        const column = (event.target as HTMLElement).closest<HTMLElement>(".column");
        if (!column || !draggedTaskId) return;
        event.preventDefault();
        const moved = tasks.find((t) => t.id === draggedTaskId);
        if (!moved) { draggedTaskId = null; clearDropMarkers(); return; }
        if (!moved.id || moved.id === "" || Number.isNaN(Number(moved.id))) {
            showAlertModal("Cannot move", "This task has no ID yet. Refresh the page and try again.");
            draggedTaskId = null; clearDropMarkers(); return;
        }
        const targetColumn = column.dataset["column"] as ColumnId;
        const beforeId = cardAfterPointer(column, event.clientY)?.dataset["task"] ?? null;
        const siblings = tasks.filter((t) => t.column === targetColumn && t.id !== moved.id)
            .sort((a, b) => a.position - b.position);
        let newPosition: number;
        if (!beforeId) {
            const last = siblings[siblings.length - 1];
            newPosition = last ? last.position + 1 : 1;
        } else {
            const idx = siblings.findIndex((t) => t.id === beforeId);
            const prev = idx > 0 ? siblings[idx - 1] : undefined;
            const next = siblings[idx]; // undefined if the card under the pointer wasn't found
            if (next) {
                newPosition = prev ? (prev.position + next.position) / 2 : next.position - 1;
                } else {
                const last = siblings[siblings.length - 1];
                newPosition = last ? last.position + 1 : 1;
                }
            }
        const blocked = completionBlockedReason(moved.column, targetColumn);
        if (blocked) {
            showAlertModal("Cannot move", blocked);
            draggedTaskId = null; clearDropMarkers(); return;
        }
        const from = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
        const wasCompleted = from === "Completed";
        moved.column = targetColumn;
        moved.position = newPosition;
        if (targetColumn === "COMPLETED" && (moved.progress ?? 0) < 100) moved.progress = 100;
        else if (wasCompleted && targetColumn !== "COMPLETED") moved.progress = 0;
        const ok = await apiUpdate(moved);
        if (ok) {
            const to = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
            if (from !== to) showToast(`Moved to ${to}`);
            await refreshFromBackend();
        }
        draggedTaskId = null; clearDropMarkers();
    });
    board.addEventListener("dragend", () => {
        draggedTaskId = null; clearDropMarkers();
        board.querySelector(".dragging")?.classList.remove("dragging");
    });

    // SPRINT TABS + SEARCH
    function initSprintTabs(): void {
        const tabs = document.querySelectorAll<HTMLButtonElement>(".sprint-tab");
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((other) => other.classList.remove("active"));
                tab.classList.add("active");
                const sprintId = tab.dataset["sprint"];
                if (sprintId) {
                    currentSprintId = sprintId;
                    writeSprintSetting(sprintId);
                    void (async () => {
                        currentSprintBackendId = await resolveSprintBackendId(sprintId);
                        await refreshFromBackend();
                        await refreshSprintButton();
                        void loadLoggedHours();
                    })();
                }
            });
        });
    }
    function highlightSavedSprintTab(): void {
        const tabs = document.querySelectorAll<HTMLButtonElement>(".sprint-tab");
        tabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset["sprint"] === currentSprintId);
        });
    }
    requireElement<HTMLInputElement>("searchInput").addEventListener("input", (event: Event) => {
        searchTerm = (event.target as HTMLInputElement).value.trim();
        renderBoard();
    });

    // TEAM FILTER
    const teamFilterLabel = requireElement<HTMLSpanElement>("teamFilterLabel");

    function renderTeamFilter(): void {
        const inSprint = tasks.filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId);
        const options = [
            { id: "all", name: "All teams", count: inSprint.length },
            ...TEAMS.map((team) => ({
                id: team.id,
                name: team.name,
                count: inSprint.filter((t) => teamsOfTask(t).includes(team.id)).length,
            })),
        ];
        if (teamFilterMenu) {
            teamFilterMenu.innerHTML =
                `<span class="popover-label">View board for</span>` +
                options.map((option) => {
                    const active = option.id === currentTeamId;
                    return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-team="${option.id}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(option.name)}</span><span class="filter-count">${option.count}</span>
            </button>`;
                }).join("");
        }
        teamFilterLabel.textContent = currentTeamId === "all" ? "All teams" : (teamName(currentTeamId) || "All teams");
        teamFilterBtn?.classList.toggle("filtered", currentTeamId !== "all");
    }
    teamFilterBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        renderTeamFilter();
        const willOpen = !teamFilterMenu?.classList.contains("visible");
        closeAllMenus();
        setTeamFilterOpen(willOpen);
    });
    teamFilterMenu?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const option = (event.target as HTMLElement).closest<HTMLElement>("[data-team]");
        if (!option) return;
        currentTeamId = option.dataset["team"] ?? "all";
        setTeamFilterOpen(false);
        renderTeamFilter();
        renderBoard();
        void loadLoggedHours();
    });

    // FILTER TAGS
    const tagFilterLabel = requireElement<HTMLSpanElement>("tagFilterLabel");

    function availableTagNames(): string[] {
        const names = new Set<string>();
        tasks
            .filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId)
            .forEach((t) => (t.tags ?? []).forEach((tag) => names.add(tag.name)));
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }

    function renderTagFilter(): void {
        if (!tagFilterMenu) return;
        const inSprint = tasks.filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId);
        const names = availableTagNames();
        const countFor = (name: string) =>
            inSprint.filter((t) =>
                (t.tags ?? []).some((tag) => tag.name.toLowerCase() === name.toLowerCase())
            ).length;
        const sortActive = sortByTag ? " active" : "";
        const header = `
            <button type="button" class="filter-option${sortActive}" data-tag-sort="1" role="menuitemradio" aria-checked="${sortByTag}">
                <span>Sort by tag</span><span class="filter-count">${sortByTag ? "on" : "off"}</span>
            </button>
            <button type="button" class="filter-option${currentTagName === TAG_FILTER_ALL ? " active" : ""}" data-tag="${TAG_FILTER_ALL}" role="menuitemradio" aria-checked="${currentTagName === TAG_FILTER_ALL}">
                <span>All tags</span><span class="filter-count">${inSprint.length}</span>
            </button>`;
        const rows = names.length === 0
            ? `<p class="employee-empty">No tags in this sprint yet.</p>`
            : names.map((name) => {
                const active = currentTagName.toLowerCase() === name.toLowerCase();
                return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-tag="${escapeHtml(name)}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(name)}</span><span class="filter-count">${countFor(name)}</span>
            </button>`;
            }).join("");
        tagFilterMenu.innerHTML = `<span class="popover-label">Filter by tag</span>` + header + rows;
        if (sortByTag && currentTagName === TAG_FILTER_ALL) tagFilterLabel.textContent = "Sorted by tag";
        else if (currentTagName === TAG_FILTER_ALL) tagFilterLabel.textContent = "All tags";
        else tagFilterLabel.textContent = currentTagName;
        tagFilterBtn?.classList.toggle("filtered", sortByTag || currentTagName !== TAG_FILTER_ALL);
    }
    tagFilterBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        renderTagFilter();
        const willOpen = !tagFilterMenu?.classList.contains("visible");
        closeAllMenus();
        setTagFilterOpen(willOpen);
    });
    tagFilterMenu?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const target = event.target as HTMLElement;
        const sortBtn = target.closest<HTMLElement>("[data-tag-sort]");
        if (sortBtn) {
            sortByTag = !sortByTag;
            setTagFilterOpen(false);
            renderTagFilter();
            renderBoard();
            return;
        }
        const tagBtn = target.closest<HTMLElement>("[data-tag]");
        if (!tagBtn) return;
        currentTagName = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
    });

    // TASK MODAL
    const overlay = requireElement<HTMLDivElement>("taskModalOverlay");
    const columnSelect = requireElement<HTMLSelectElement>("modalColumn");
    const titleInput = requireElement<HTMLInputElement>("modalTitle");
    const errorText = requireElement<HTMLParagraphElement>("modalError");
    const descriptionBox = requireElement<HTMLTextAreaElement>("modalDescription");
    const summary = requireElement<HTMLDivElement>("modalSummary");
    const saveBtn = requireElement<HTMLButtonElement>("modalSaveBtn");
    const deleteBtn = requireElement<HTMLButtonElement>("modalDeleteBtn");
    const dueDateInput = requireElement<HTMLInputElement>("dueDateInput");
    const assigneeSelect = requireElement<HTMLSelectElement>("assigneeSelect");
    const employeeList = requireElement<HTMLDivElement>("employeeList");
    const estimateInput = requireElement<HTMLInputElement>("estimateInput");
    const prioritySelect = requireElement<HTMLSelectElement>("prioritySelect");
    const tagInput = requireElement<HTMLInputElement>("tagInput");
    const addTagBtn = requireElement<HTMLButtonElement>("addTagBtn");
    const tagChips = requireElement<HTMLDivElement>("tagChips");
    const tagEmpty = requireElement<HTMLParagraphElement>("tagEmpty");
    const progressInput = requireElement<HTMLInputElement>("progressInput");
    const progressValue = requireElement<HTMLSpanElement>("progressValue");
    const progressSlider = requireElement<HTMLInputElement>("progressSlider");
    const progressClearBtn = requireElement<HTMLButtonElement>("progressClearBtn");

    const modalMoreBtn = document.getElementById("modalMoreBtn") as HTMLButtonElement | null;
    const modalMoreMenu = document.getElementById("modalMoreMenu") as HTMLDivElement | null;
    const modalCommentsBtn = document.getElementById("modalCommentsBtn") as HTMLButtonElement | null;

    let draft: Task | null = null;
    let assignKind: "team" | "employees" = "team";

    function setModalMoreOpen(open: boolean): void {
        if (!modalMoreMenu || !modalMoreBtn) return;
        modalMoreMenu.classList.toggle("visible", open);
        modalMoreBtn.setAttribute("aria-expanded", String(open));
    }
    modalMoreBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        setModalMoreOpen(!modalMoreMenu!.classList.contains("visible"));
    });
    modalCommentsBtn?.addEventListener("click", () => {
        setModalMoreOpen(false);
        void openCommentsModal();
    });

    function openModal(task: Task): void {
        const d: Task = JSON.parse(JSON.stringify(task));
        draft = d;
        draft = JSON.parse(JSON.stringify(task));
        assignKind = d.assignee?.kind === "employees" ? "employees" : "team";
        columnSelect.value = d.column;
        titleInput.value = d.title;
        descriptionBox.value = d.description;
        dueDateInput.value = d.dueDate;
        estimateInput.value = d.estimateHours > 0 ? String(d.estimateHours) : "";
        prioritySelect.value = d.priority;
        tagInput.value = "";
        const pct = Number(d.progress) || 0;
        progressInput.value = String(pct);
        progressSlider.value = String(pct);
        progressValue.textContent = `${pct}%`;
        errorText.textContent = "";
        saveBtn.textContent = d.id ? "Save" : "Create task";
        deleteBtn.hidden = d.id === "" || sessionStorage.getItem("role") !== "ADMIN";
        setDeleteArmed(false);
        renderDraft();
        renderTags();
        closePopovers();
        setModalMoreOpen(false);
        overlay.classList.add("visible");
        titleInput.focus();
    }

    function closeModal(): void {
        overlay.classList.remove("visible");
        closePopovers();
        setModalMoreOpen(false);
        const wasSavedTask = draft !== null && draft.id !== "";
        draft = null;
        if (wasSavedTask) void refreshFromBackend();
    }

    function renderDraft(): void {
        if (!draft) return;
        const chips = [
            `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}</span>`,
            `<span class="summary-chip"><b>Due</b> ${draft.dueDate ? formatDateBadge(draft.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${draft.estimateHours > 0 ? formatEstimate(draft.estimateHours) : "Not set"}</span>`,
            `<span class="summary-chip"><b>Priority</b> ${draft.priority || "None"}</span>`,
            `<span class="summary-chip"><b>Progress</b> ${Math.max(0, Math.min(100, Number(draft.progress) || 0))}%</span>`,
        ];
        summary.innerHTML = chips.join("");
        renderAssignControls();
    }

    function renderAssignControls(): void {
        if (!draft) return;
        document.querySelectorAll<HTMLElement>("[data-assign-kind]").forEach((segment) => {
            segment.classList.toggle("active", segment.dataset["assignKind"] === assignKind);
        });
        assigneeSelect.hidden = assignKind !== "team";
        employeeList.hidden = assignKind !== "employees";
        const assignee = draft.assignee;
        const currentTeam = assignee?.kind === "team" ? assignee.teamId : null;
        assigneeSelect.innerHTML =
            `<option value="">Choose a team…</option>` +
            TEAMS.map((t) => `<option value="${t.name}">${escapeHtml(t.name)}</option>`).join("");
        assigneeSelect.value = currentTeam ?? "";
        const visibleEmployees = currentTeam ? EMPLOYEES.filter((e) => e.team === currentTeam) : [];
        const ticked = assignee?.kind === "employees" ? assignee.employeeIds : [];
        employeeList.innerHTML = visibleEmployees.length === 0
            ? `<p class="employee-empty">${currentTeam ? "No employees in this team yet." : "Choose a team first."}</p>`
            : visibleEmployees.map((employee) => `
            <label class="employee-option">
              <input type="checkbox" value="${escapeHtml(employee.id)}" ${ticked.includes(employee.id) ? "checked" : ""} />
              <span>${escapeHtml(employee.name)}</span>
              <span class="employee-team">${escapeHtml(employee.team)}</span>
            </label>`).join("");
    }

    function renderTags(): void {
        if (!draft) return;
        const tags = draft.tags ?? [];
        tagEmpty.hidden = tags.length > 0;
        tagChips.innerHTML = tags.map((t) => `
      <span class="tag-chip" data-tag-id="${t.id}">
        ${escapeHtml(t.name)}
        <button type="button" aria-label="Remove ${escapeHtml(t.name)}" data-remove-tag="${t.id}">✕</button>
      </span>`).join("");
    }
    async function addTagToDraft(): Promise<void> {
        if (!draft) return;
        const name = tagInput.value.trim().toLowerCase();
        if (!name) return;
        if ((draft.tags ?? []).some((t) => t.name.toLowerCase() === name)) { tagInput.value = ""; return; }
        if (!draft.id) { showToast("Task must be saved first before tags can be added."); return; }
        try {
            const res = await fetch(`${TAGS_API}/task/${Number(draft.id)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            draft.tags = Array.isArray(updated.tags) ? updated.tags : [];
            tagInput.value = "";
            renderTags();
        } catch (err) {
            console.error("Add tag failed:", err);
            showToast("Tag could not be added");
        }
    }
    async function removeTagFromDraft(tagId: number): Promise<void> {
        if (!draft || !draft.id) return;
        try {
            const res = await fetch(`${TAGS_API}/task/${Number(draft.id)}/${tagId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            draft.tags = Array.isArray(updated.tags) ? updated.tags : [];
            renderTags();
        } catch (err) {
            console.error("Remove tag failed:", err);
            showToast("Tag could not be removed");
        }
    }

    async function saveModal(): Promise<void> {
        if (!draft) return;
        const title = titleInput.value.trim();
        if (title.length < 2) {
            errorText.textContent = "Task name must be at least 2 characters.";
            titleInput.focus();
            return;
        }
        draft.title = title;
        draft.description = descriptionBox.value.trim();
        const chosenColumn = columnSelect.value as ColumnId;
        const blocked = completionBlockedReason(draft.column, chosenColumn);
        if (blocked) {
            errorText.textContent = blocked;
            columnSelect.value = draft.column;
            return;
        }
        draft.column = chosenColumn;
        draft.progress = Math.max(0, Math.min(100, Number(progressInput.value) || 0));
        const isNew = draft.id === "";
        const ok = isNew ? (await apiCreate(draft)) !== null : await apiUpdate(draft);
        if (!ok) return;
        closeModal();
        await refreshFromBackend();
        showToast(isNew ? "Task created" : "Changes saved");
    }

    let deleteArmed = false;
    function setDeleteArmed(armed: boolean): void {
        deleteArmed = armed;
        deleteBtn.textContent = armed ? "Click again to delete" : "Delete task";
        deleteBtn.classList.toggle("armed", armed);
    }
    deleteBtn.addEventListener("click", async () => {
        if (!draft) return;
        if (!deleteArmed) { setDeleteArmed(true); return; }
        const ok = await apiDelete(draft.id);
        if (!ok) return;
        closeModal();
        await refreshFromBackend();
        showToast("Task deleted");
    });
    deleteBtn.addEventListener("blur", () => setDeleteArmed(false));

    function closePopovers(): void {
        overlay.querySelectorAll(".popover.visible").forEach((p) => p.classList.remove("visible"));
        setModalMoreOpen(false);
    }

    document.querySelectorAll<HTMLElement>("[data-popover]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const popover = document.getElementById(button.dataset["popover"] ?? "");
            if (!popover) return;
            const wasOpen = popover.classList.contains("visible");
            closePopovers();
            if (!wasOpen) {
                popover.classList.add("visible");
                popover.querySelector<HTMLElement>("input, select")?.focus();
            }
        });
    });
    overlay.querySelectorAll(".popover").forEach((popover) => {
        popover.addEventListener("click", (event) => event.stopPropagation());
    });
    overlay.addEventListener("click", (event: MouseEvent) => {
        if (!modalMoreMenu?.classList.contains("visible")) return;
        const t = event.target as Node;
        if (modalMoreMenu.contains(t) || modalMoreBtn?.contains(t)) return;
        setModalMoreOpen(false);
    });

    dueDateInput.addEventListener("change", () => {
        if (!draft) return;
        draft.dueDate = dueDateInput.value;
        renderDraft();
    });
    requireElement<HTMLButtonElement>("dueDateClearBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.dueDate = "";
        dueDateInput.value = "";
        renderDraft();
    });
    estimateInput.addEventListener("input", () => {
        if (!draft) return;
        const hours = Number(estimateInput.value);
        draft.estimateHours = Number.isFinite(hours) && hours > 0 ? hours : 0;
        renderDraft();
    });
    requireElement<HTMLButtonElement>("estimateClearBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.estimateHours = 0;
        estimateInput.value = "";
        renderDraft();
    });
    prioritySelect.addEventListener("change", () => {
        if (!draft) return;
        draft.priority = prioritySelect.value as Priority;
        renderDraft();
    });
    requireElement<HTMLButtonElement>("priorityClearBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.priority = "";
        prioritySelect.value = "";
        renderDraft();
    });

    function syncProgress(value: string | number): void {
        const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
        if (draft) draft.progress = pct;
        progressInput.value = String(pct);
        progressSlider.value = String(pct);
        progressValue.textContent = `${pct}%`;
    }
    progressInput.addEventListener("input", () => syncProgress(progressInput.value));
    progressSlider.addEventListener("input", () => syncProgress(progressSlider.value));
    progressClearBtn.addEventListener("click", () => {
        if (!draft) return;
        syncProgress(0);
        renderDraft();
    });

    document.querySelectorAll<HTMLElement>("[data-assign-kind]").forEach((segment) => {
        segment.addEventListener("click", () => {
            assignKind = segment.dataset["assignKind"] === "employees" ? "employees" : "team";
            renderAssignControls();
        });
    });
    assigneeSelect.addEventListener("change", () => {
        if (!draft) return;
        draft.assignee = assigneeSelect.value ? { kind: "team", teamId: assigneeSelect.value } : null;
        renderAssignControls();
    });
    employeeList.addEventListener("change", () => {
        if (!draft) return;
        const employeeIds = Array.from(employeeList.querySelectorAll<HTMLInputElement>("input:checked")).map((box) => box.value);
        draft.assignee = employeeIds.length > 0 ? { kind: "employees", employeeIds } : null;
        const chip = summary.querySelector(".summary-chip");
        if (chip) chip.innerHTML = `<b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}`;
    });
    requireElement<HTMLButtonElement>("unassignBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.assignee = null;
        renderDraft();
    });

    addTagBtn.addEventListener("click", () => { void addTagToDraft(); });
    tagInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") { event.preventDefault(); void addTagToDraft(); }
    });
    tagChips.addEventListener("click", (event: MouseEvent) => {
        const btn = (event.target as HTMLElement).closest<HTMLElement>("[data-remove-tag]");
        if (!btn) return;
        void removeTagFromDraft(Number(btn.dataset["removeTag"]));
    });

    saveBtn.addEventListener("click", () => { void saveModal(); });
    titleInput.addEventListener("input", () => (errorText.textContent = ""));
    titleInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") void saveModal();
    });
    requireElement<HTMLButtonElement>("modalCloseBtn").addEventListener("click", closeModal);
    requireElement<HTMLButtonElement>("modalCancelBtn").addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
        else closePopovers();
    });

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;

        // Close the confirm dialog first if it's on top
        const confirmOverlayEl = document.getElementById("confirmOverlay");
        if (confirmOverlayEl?.classList.contains("visible")) {
            closeConfirmModal(false);
            return;
        }

        closeAllMenus();
        if (!overlay.classList.contains("visible")) return;
        if (overlay.querySelector(".popover.visible")) closePopovers();
        else if (modalMoreMenu?.classList.contains("visible")) setModalMoreOpen(false);
        else closeModal();
    });

    // COMMENTS MODAL
    const commentsOverlay = document.getElementById("commentsOverlay") as HTMLDivElement | null;
    const closeCommentsBtn = document.getElementById("closeCommentsBtn") as HTMLButtonElement | null;
    const commentsTitle = document.getElementById("commentsTitle") as HTMLHeadingElement | null;
    const commentsSubtitle = document.getElementById("commentsSubtitle") as HTMLParagraphElement | null;
    const commentsList = document.getElementById("commentsList") as HTMLDivElement | null;
    const newCommentText = document.getElementById("newCommentText") as HTMLTextAreaElement | null;
    const commentsCharCount = document.getElementById("commentsCharCount") as HTMLSpanElement | null;
    const sendCommentBtn = document.getElementById("sendCommentBtn") as HTMLButtonElement | null;

    let commentsTaskId: string | null = null;

    function formatCommentTime(iso: string): string {
        if (!iso) return "";
        const d = new Date(iso);
        const now = new Date();
        const sameDay =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
        const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        if (sameDay) return `Today ${time}`;
        const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        return `${date} · ${time}`;
    }

    function renderCommentList(comments: CommentDto[]): void {
        if (!commentsList) return;
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<p class="comments-empty">No comments yet. Start the conversation.</p>`;
            return;
        }
        commentsList.innerHTML = comments.map((c) => {
            const authorInitials = escapeHtml(
                String(c.authorName || "?")
                    .split(/\s+/).filter(Boolean).slice(0, 2)
                    .map((p) => p.charAt(0).toUpperCase()).join("")
            );
            const roleLabel =
                c.authorRole === "ADMIN" ? "Admin" :
                c.authorRole === "PRODUCT_OWNER" ? "Product Owner" :
                c.authorRole === "EMPLOYEE" ? "Employee" : "";
            const isAdmin = c.authorRole === "ADMIN" || c.authorRole === "PRODUCT_OWNER";
            return `
                <div class="comment-row${isAdmin ? " comment-row-admin" : ""}" data-comment-id="${c.id}">
                    <div class="comment-avatar" style="background:${avatarColor(c.authorName || "?")};">${authorInitials}</div>
                    <div class="comment-body-wrap">
                        <div class="comment-meta">
                            <span class="comment-author">${escapeHtml(c.authorName)}</span>
                            <span class="comment-role">${roleLabel}</span>
                            <button type="button" class="comment-delete-btn"
                                    data-delete-comment="${c.id}"
                                    title="Delete comment"
                                    aria-label="Delete comment">✕</button>
                            <span class="comment-time">${formatCommentTime(c.createdAt)}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(c.body)}</div>
                    </div>
                </div>`;
        }).join("");
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    async function loadComments(taskId: string): Promise<void> {
        if (!commentsList) return;
        commentsList.innerHTML = `<p class="comments-empty">Loading…</p>`;
        try {
            const res = await fetch(`${API_BASE}/${taskId}/comments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const comments = (await res.json()) as CommentDto[];
            renderCommentList(comments);
        } catch (err) {
            console.error("Failed to load comments:", err);
            commentsList.innerHTML = `<p class="comments-empty">Could not load comments.</p>`;
        }
    }

    async function openCommentsModal(): Promise<void> {
        if (!draft || !draft.id) {
            showToast("Save the task first, then add comments.");
            return;
        }
        commentsTaskId = draft.id;
        if (commentsTitle) commentsTitle.textContent = "Comments";
        if (commentsSubtitle) commentsSubtitle.textContent = `On "${draft.title}"`;
        if (newCommentText) newCommentText.value = "";
        updateCommentsCharCount();
        commentsOverlay?.classList.add("visible");
        await loadComments(draft.id);
        newCommentText?.focus();
    }

    function closeCommentsModal(): void {
        commentsOverlay?.classList.remove("visible");
        commentsTaskId = null;
    }

    function updateCommentsCharCount(): void {
        if (commentsCharCount && newCommentText) {
            commentsCharCount.textContent = `${newCommentText.value.length} / 2000`;
        }
    }

    closeCommentsBtn?.addEventListener("click", closeCommentsModal);
    commentsOverlay?.addEventListener("click", (e: MouseEvent) => {
        if (e.target === commentsOverlay) closeCommentsModal();
    });
    newCommentText?.addEventListener("input", updateCommentsCharCount);

    async function sendComment(): Promise<void> {
        if (!commentsTaskId || !newCommentText || !sendCommentBtn) return;
        const body = newCommentText.value.trim();
        if (!body) { showToast("Please type a comment first."); return; }
        const authorId = Number(sessionStorage.getItem("userId"));
        if (!authorId || Number.isNaN(authorId)) { showToast("You must be signed in."); return; }
        sendCommentBtn.disabled = true;
        sendCommentBtn.textContent = "Sending…";
        try {
            const res = await fetch(`${API_BASE}/${commentsTaskId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ authorId, body }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            newCommentText.value = "";
            updateCommentsCharCount();
            await loadComments(commentsTaskId);
        } catch (err) {
            console.error("Send comment failed:", err);
            showToast("Could not send the comment. Please try again.");
        } finally {
            sendCommentBtn.disabled = false;
            sendCommentBtn.textContent = "Send";
        }
    }
    sendCommentBtn?.addEventListener("click", () => { void sendComment(); });
    newCommentText?.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void sendComment();
        }
    });

    commentsList?.addEventListener("click", async (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-delete-comment]");
        if (!btn) return;
        const commentId = btn.dataset["deleteComment"];
        if (!commentId || !commentsTaskId) return;

        const confirmed = await showConfirmModal({
            title: "Delete this comment?",
            message: "This cannot be undone.",
            confirmText: "Delete",
            danger: true,
        });
        if (!confirmed) return;

        try {
            const role = sessionStorage.getItem("role") || "";
            const res = await fetch(`${API_BASE}/${commentsTaskId}/comments/${commentId}`, {
                method: "DELETE",
                headers: { "X-Role": role },
            });
            if (res.status === 403) { showToast("You are not allowed to delete this comment."); return; }
            if (res.status === 404) { showToast("That comment no longer exists."); }
            else if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            await loadComments(commentsTaskId);
        } catch (err) {
            console.error("Delete comment failed:", err);
            showToast("Could not delete the comment. Please try again.");
        }
    });

    // TOAST
    const toast = requireElement<HTMLDivElement>("toast");
    let toastTimeoutId: number | undefined;
    function showToast(message: string): void {
        toast.textContent = message;
        toast.classList.add("visible");
        if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
        toastTimeoutId = window.setTimeout(() => toast.classList.remove("visible"), 3000);
    }

    // NOTIFICATION BELL
    const NOTIF_SEEN_KEY = "symph.lastSeenCommentId";
    const notifBadge = document.getElementById("notifBadge") as HTMLSpanElement | null;
    const notifMenuList = document.getElementById("notifMenuList") as HTMLDivElement | null;

    let notifPollTimer: number | null = null;

    function getLastSeenCommentId(): number {
        try {
            const v = window.localStorage.getItem(NOTIF_SEEN_KEY);
            return v ? Number(v) : 0;
        } catch { return 0; }
    }
    function setLastSeenCommentId(id: number): void {
        try { window.localStorage.setItem(NOTIF_SEEN_KEY, String(id)); } catch { /* ignore */ }
    }

    function formatNotifTime(iso: string): string {
        if (!iso) return "";
        const d = new Date(iso);
        const now = new Date();
        const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diffSec < 60) return "Just now";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hour(s) ago`;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    function setNotifOpen(open: boolean): void {
        if (!notifMenu || !notifBellBtn) return;
        notifMenu.classList.toggle("visible", open);
        notifBellBtn.setAttribute("aria-expanded", String(open));
    }

    function renderNotifications(comments: RecentComment[]): void {
        if (!notifMenuList) return;

        const myId = Number(sessionStorage.getItem("userId"));
        const others = comments.filter(c => Number(c.authorId) !== myId);

        if (others.length === 0) {
            notifMenuList.innerHTML = `<p class="notif-empty">No notifications yet.</p>`;
            if (notifBadge) notifBadge.hidden = true;
            return;
        }

        const lastSeen = getLastSeenCommentId();
        const unreadCount = others.filter(c => Number(c.id) > lastSeen).length;

        if (notifBadge) {
            if (unreadCount > 0) {
                notifBadge.textContent = String(unreadCount > 9 ? "9+" : unreadCount);
                notifBadge.hidden = false;
            } else {
                notifBadge.hidden = true;
            }
        }

        notifMenuList.innerHTML = others.map(c => {
            const authorInitials = escapeHtml(
                String(c.authorName || "?")
                    .split(/\s+/).filter(Boolean).slice(0, 2)
                    .map(p => p.charAt(0).toUpperCase()).join("")
            );
            const color = avatarColor(c.authorName || "?");
            const isUnread = Number(c.id) > lastSeen;
            return `
                <button type="button" class="notif-item${isUnread ? " unread" : ""}"
                        data-notif-task="${c.taskId}"
                        data-notif-id="${c.id}">
                    <div class="notif-avatar" style="background:${color};">${authorInitials}</div>
                    <div class="notif-body">
                        <div class="notif-text">
                            <strong>${escapeHtml(c.authorName)}</strong> sent a message in
                            <span class="notif-task-name">"${escapeHtml(c.taskName)}"</span>
                        </div>
                        <div class="notif-time">${formatNotifTime(c.createdAt)}</div>
                    </div>
                </button>`;
        }).join("");
    }

    async function loadNotifications(): Promise<void> {
        if (!notifMenuList) return;
        try {
            const res = await fetch(RECENT_COMMENTS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const comments = (await res.json()) as RecentComment[];
            renderNotifications(comments);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        }
    }

    notifBellBtn?.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        const willOpen = !notifMenu!.classList.contains("visible");
        closeAllMenus();
        setNotifOpen(willOpen);

        if (willOpen) {
            void (async () => {
                try {
                    const res = await fetch(RECENT_COMMENTS_API);
                    if (res.ok) {
                        const comments = (await res.json()) as RecentComment[];
                        const myId = Number(sessionStorage.getItem("userId"));
                        const others = comments.filter(c => Number(c.authorId) !== myId);
                        const newest = others[0];
                        if (newest)
                        {
                            setLastSeenCommentId(newest.id);
                        }
                        if (notifBadge) notifBadge.hidden = true;
                    }
                } catch { /* ignore */ }
            })();
        }
    });

    notifMenuList?.addEventListener("click", (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-notif-task]");
        if (!btn) return;
        const taskId = btn.dataset["notifTask"];
        if (!taskId) return;

        const commentId = btn.dataset["notifId"];
        if (commentId) setLastSeenCommentId(Number(commentId));

        setNotifOpen(false);

        void (async () => {
            await refreshFromBackend();
            const task = tasks.find(t => t.id === String(taskId));
            if (!task) {
                showToast("That task no longer exists.");
                return;
            }
            openModal(task);
            setTimeout(() => {
                void openCommentsModal();
            }, 100);
        })();
    });

    function startNotifPolling(): void {
        if (notifPollTimer !== null) return;
        notifPollTimer = window.setInterval(() => {
            void loadNotifications();
        }, 30000);
    }

    // PROJECT NAME
    const PROJECT_NAME_KEY = "symph.projectName";
    const projectNameInput = requireElement<HTMLInputElement>("projectName");
    let projectName = readSetting(PROJECT_NAME_KEY) || "Project Name";

    function fitProjectName(): void {
        const sizer = document.createElement("span");
        sizer.className = "project-name-sizer";
        sizer.textContent = projectNameInput.value || " ";
        projectNameInput.parentElement?.appendChild(sizer);
        projectNameInput.style.width = `${Math.ceil(sizer.getBoundingClientRect().width) + 26}px`;
        sizer.remove();
    }
    function commitProjectName(): void {
        const typed = projectNameInput.value.trim();
        if (typed) { projectName = typed; writeSetting(PROJECT_NAME_KEY, projectName); }
        projectNameInput.value = projectName;
        fitProjectName();
    }
    projectNameInput.addEventListener("input", fitProjectName);
    projectNameInput.addEventListener("blur", commitProjectName);
    projectNameInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") projectNameInput.blur();
        else if (event.key === "Escape") { projectNameInput.value = projectName; projectNameInput.blur(); }
    });
    projectNameInput.value = projectName;
    fitProjectName();
    document.fonts?.ready.then(fitProjectName);

    // SIDEBAR
    const SIDEBAR_KEY = "symph.sidebarCollapsed";
    const appShell = requireElement<HTMLDivElement>("appShell");
    const sidebarToggle = requireElement<HTMLButtonElement>("sidebarToggle");
    function setSidebarCollapsed(collapsed: boolean): void {
        appShell.classList.toggle("sidebar-collapsed", collapsed);
        sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
        sidebarToggle.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu");
        sidebarToggle.title = collapsed ? "Expand menu" : "Collapse menu";
    }
    sidebarToggle.addEventListener("click", () => {
        const collapsed = !appShell.classList.contains("sidebar-collapsed");
        setSidebarCollapsed(collapsed);
        writeSetting(SIDEBAR_KEY, collapsed ? "1" : "0");
    });
    setSidebarCollapsed(readSetting(SIDEBAR_KEY) === "1");

    // START/END SPRINT
    const startSprintBtn = document.getElementById("startSprintBtn") as HTMLButtonElement | null;
    let currentSprintStatus: string | null = null;

    async function fetchSprintStatus(tabId: string): Promise<Sprint | null> {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text) return null;
            return JSON.parse(text) as Sprint;
        } catch (err) {
            console.error("Failed to load sprint:", err);
            return null;
        }
    }
    function renderSprintButton(status: string | null): void {
        if (!startSprintBtn) return;
        startSprintBtn.classList.remove("is-active", "is-completed", "is-planned");
        if (status === "ACTIVE") {
            startSprintBtn.textContent = "■ End Sprint";
            startSprintBtn.classList.add("is-active");
            startSprintBtn.disabled = false;
            startSprintBtn.title = "Mark the current sprint as completed";
        } else if (status === "COMPLETED") {
            startSprintBtn.textContent = "✓ Sprint Completed";
            startSprintBtn.classList.add("is-completed");
            startSprintBtn.disabled = true;
            startSprintBtn.title = "This sprint is already completed";
        } else {
            startSprintBtn.textContent = "▶ Start Sprint";
            startSprintBtn.classList.add("is-planned");
            startSprintBtn.disabled = false;
            startSprintBtn.title = "Start the current sprint";
        }
    }
    async function refreshSprintButton(): Promise<void> {
        const sprint = await fetchSprintStatus(currentSprintId);
        currentSprintStatus = sprint?.status ?? null;
        if (sprint?.id != null) currentSprintBackendId = String(sprint.id);
        renderSprintButton(currentSprintStatus);
    }
    startSprintBtn?.addEventListener("click", async () => {
        if (!startSprintBtn || startSprintBtn.disabled) return;
        const numericId = currentSprintBackendId != null ? Number(currentSprintBackendId) : null;
        if (numericId === null || !Number.isFinite(numericId) || numericId <= 0) { showNoSprintModal(); return; }
        const starting = currentSprintStatus !== "ACTIVE";
        const confirmMsg = starting
            ? "Start the sprint now? Time tracking will begin."
            : "End this sprint? The sprint will be marked as completed.";
        const confirmed = await showConfirmModal({
            title: starting ? "Start sprint?" : "End sprint?",
            message: confirmMsg,
            confirmText: starting ? "Start" : "End",
            danger: !starting,
        });
        if (!confirmed) return;
        startSprintBtn.disabled = true;
        try {
            const endpoint = starting ? "start" : "complete";
            const res = await fetch(`${SPRINTS_API}/${numericId}/${endpoint}`, { method: "PUT" });
            if (!res.ok) { const msg = await res.text(); throw new Error(msg || `HTTP ${res.status}`); }
            const updated = (await res.json()) as Sprint;
            currentSprintStatus = updated.status;
            renderSprintButton(currentSprintStatus);
            showToast(starting ? "Sprint started" : "Sprint completed");
        } catch (err) {
            console.error("Sprint action failed:", err);
            showAlertModal("Sprint update failed", `Failed to update sprint status (sprint ${numericId}).`);
            await refreshSprintButton();
        }
    });

    // INIT
    async function init(): Promise<void> {
        await loadEmployeesFromBackend();
        highlightSavedSprintTab();
        initSprintTabs();

        currentSprintBackendId = await resolveSprintBackendId(currentSprintId);

        renderTeamFilter();
        renderTagFilter();
        await refreshSprintButton();
        await refreshFromBackend();
        renderTagFilter();
        await loadLoggedHours();

        void loadNotifications();
        startNotifPolling();
    }
    void init();
})();