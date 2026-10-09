// main-user-page.ts
// Compile with:
//   npx tsc main-user-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * User Board Page — Symph Web Application
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ===================== EMPLOYEE GUARD =====================
window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index-login-page.html";
    }
});

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index-login-page.html";
    throw new Error("Not logged in");
}
if (sessionStorage.getItem("role") !== "EMPLOYEE") {
    window.location.href = "index-admin-page.html";
    throw new Error("Employee access only");
}

(() => {
    // ===================== CONFIG =====================
    const API_BASE = "http://localhost:8080/api/tasks";
    const SPRINTS_API = "http://localhost:8080/api/sprints";
    const TIMELOGS_API = "http://localhost:8080/api/timelogs";
    const USERS_API = "http://localhost:8080/api/users";

    type ColumnId = "PRODUCT_BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";
    type Task = {
        id: string;
        column: ColumnId;
        title: string;
        description: string;
        dueDate: string;
        estimateHours: number;
        priority: string;
        progress: number;
        tags: { id: number; name: string }[];
        assignedTeams: string | null;
        assignedEmployeeIds: string | null;
    };
    type BackendTask = {
        id: number;
        name: string;
        description?: string | null;
        status?: ColumnId | null;
        dueDate?: string | null;
        estimateHours?: number | null;
        priority?: string | null;
        progress?: number | null;
        tags?: { id: number; name: string }[] | null;
        sprint?: { id: number } | null;
        assignedTeams?: string | null;
        assignedEmployeeIds?: string | null;
    };
    type Sprint = { id: number; name: string };
    type BackendTimeLog = {
        id: number;
        date: string | null;
        hours: number;
        description?: string | null;
        task?: { id: number; name: string } | null;
    };
    type BackendUser = {
        id: number;
        name: string;
        role: string;
        team?: { name: string } | null;
    };
    type CommentDto = {
        id: number;
        body: string;
        createdAt: string;
        authorId: number;
        authorName: string;
        authorRole: string;
    };

    const SPRINT_TAB_NAMES: Record<string, string> = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };
    const TAG_FILTER_ALL = "all";

    // ===================== HELPERS =====================
    function requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Missing element: ${id}`);
        return el as T;
    }
    function escapeHtml(text: string): string {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    function formatDateBadge(isoDate: string): string {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
    function formatDateShort(iso: string | null | undefined): string {
        if (!iso) return "—";
        const d = new Date(`${iso}T00:00:00`);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    function initials(name: string): string {
        return String(name).split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase()).join("");
    }

    const COLUMNS: { id: ColumnId; name: string }[] = [
        { id: "PRODUCT_BACKLOG", name: "Product Backlog" },
        { id: "TO_DO", name: "To Do" },
        { id: "IN_PROGRESS", name: "In Progress" },
        { id: "IN_REVIEW", name: "In Review" },
        { id: "COMPLETED", name: "Completed" },
    ];

    // ===================== STATE =====================
    let tasks: Task[] = [];
    let searchTerm = "";
    let currentTagName: string = TAG_FILTER_ALL;

    const savedSprintId = sessionStorage.getItem("currentSprintId");
    let currentSprintId = savedSprintId && savedSprintId !== "" ? savedSprintId : "1";
    let currentSprintNumericId: number | null = null;

    let teammateIds: Set<string> = new Set();
    let userIdToName: Map<string, string> = new Map();
    let currentOpenTaskId: string | null = null;

    const board = requireElement<HTMLElement>("board");
    const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
    const emptyState = document.getElementById("boardEmptyState") as HTMLParagraphElement | null;

    // ===================== TOAST + CONFIRM =====================
    const toastEl = document.getElementById("toast");
    let toastTimeoutId: number | undefined;
    function showToast(message: string): void {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add("visible");
        if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
        toastTimeoutId = window.setTimeout(() => toastEl.classList.remove("visible"), 3000);
    }

    const confirmOverlay = document.getElementById("confirmOverlay") as HTMLDivElement | null;
    const confirmTitleEl = document.getElementById("confirmTitle") as HTMLHeadingElement | null;
    const confirmMessageEl = document.getElementById("confirmMessage") as HTMLParagraphElement | null;
    const confirmOkBtn = document.getElementById("confirmOkBtn") as HTMLButtonElement | null;
    const confirmCancelBtn = document.getElementById("confirmCancelBtn") as HTMLButtonElement | null;
    let confirmResolver: ((value: boolean) => void) | null = null;

    function showConfirmModal(opts: { title: string; message: string; confirmText?: string; danger?: boolean }): Promise<boolean> {
        return new Promise((resolve) => {
            confirmResolver = resolve;
            if (confirmTitleEl) confirmTitleEl.textContent = opts.title;
            if (confirmMessageEl) confirmMessageEl.textContent = opts.message;
            if (confirmOkBtn) {
                confirmOkBtn.textContent = opts.confirmText ?? "OK";
                confirmOkBtn.classList.toggle("btn-danger", opts.danger === true);
                confirmOkBtn.classList.toggle("btn-primary", opts.danger !== true);
            }
            confirmOverlay?.classList.add("visible");
        });
    }
    function closeConfirmModal(result: boolean): void {
        confirmOverlay?.classList.remove("visible");
        if (confirmResolver) { confirmResolver(result); confirmResolver = null; }
    }
    confirmOkBtn?.addEventListener("click", () => closeConfirmModal(true));
    confirmCancelBtn?.addEventListener("click", () => closeConfirmModal(false));
    confirmOverlay?.addEventListener("click", (e: MouseEvent) => {
        if (e.target === confirmOverlay) closeConfirmModal(false);
    });

    // ===================== SHOW CURRENT USER =====================
    const avatarEl = document.getElementById("userAvatar");
    const profileMenuName = document.getElementById("profileMenuName");
    const profileMenuSub = document.getElementById("profileMenuSub");

    const storedName = sessionStorage.getItem("name") || "";
    const storedTeam = sessionStorage.getItem("team") || "";
    if (profileMenuName) profileMenuName.textContent = storedName || "Employee";
    if (profileMenuSub) profileMenuSub.textContent = storedTeam || "—";
    if (avatarEl) {
        const label = initials(storedName) || (storedName ? storedName.charAt(0).toUpperCase() : "?");
        avatarEl.textContent = label;
        if (storedName) avatarEl.title = storedName;
    }

    const roleBadgeEl = document.getElementById("roleBadge");
    if (roleBadgeEl) roleBadgeEl.textContent = storedTeam || "Employee";

    // ===================== MENUS =====================
    const profileMenuBtn = document.getElementById("profileMenuBtn") as HTMLButtonElement | null;
    const profileMenu = document.getElementById("profileMenu") as HTMLDivElement | null;
    const headerMenuBtn = document.getElementById("headerMenuBtn") as HTMLButtonElement | null;
    const headerMenu = document.getElementById("headerMenu") as HTMLDivElement | null;
    const tagFilterBtn = document.getElementById("tagFilterBtn") as HTMLButtonElement | null;
    const tagFilterMenu = document.getElementById("tagFilterMenu") as HTMLDivElement | null;
    const tagFilterLabel = document.getElementById("tagFilterLabel") as HTMLSpanElement | null;

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
    function closeAllMenus(): void {
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
    }

    profileMenuBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const willOpen = !profileMenu!.classList.contains("visible");
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
        setProfileMenuOpen(willOpen);
    });
    headerMenuBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const willOpen = !headerMenu!.classList.contains("visible");
        setProfileMenuOpen(false);
        setTagFilterOpen(false);
        setHeaderMenuOpen(willOpen);
    });
    tagFilterBtn?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        renderTagFilter();
        const willOpen = !tagFilterMenu!.classList.contains("visible");
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(willOpen);
    });
    document.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as Node;
        if (profileMenu?.classList.contains("visible")
            && !profileMenu.contains(target) && !profileMenuBtn?.contains(target)) {
            setProfileMenuOpen(false);
        }
        if (headerMenu?.classList.contains("visible")
            && !headerMenu.contains(target) && !headerMenuBtn?.contains(target)) {
            setHeaderMenuOpen(false);
        }
        if (tagFilterMenu?.classList.contains("visible")
            && !tagFilterMenu.contains(target) && !tagFilterBtn?.contains(target)) {
            setTagFilterOpen(false);
        }
    });
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") closeAllMenus();
    });

    // ===================== LOGOUT =====================
    const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement | null;
    const logoutOverlay = document.getElementById("logoutOverlay") as HTMLDivElement | null;
    const cancelLogoutBtn = document.getElementById("cancelLogoutBtn") as HTMLButtonElement | null;
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn") as HTMLButtonElement | null;

    logoutBtn?.addEventListener("click", () => {
        closeAllMenus();
        logoutOverlay?.classList.add("visible");
    });
    cancelLogoutBtn?.addEventListener("click", () => logoutOverlay?.classList.remove("visible"));
    confirmLogoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index-login-page.html";
    });
    logoutOverlay?.addEventListener("click", (e: MouseEvent) => {
        if (e.target === logoutOverlay) logoutOverlay.classList.remove("visible");
    });

    // ===================== SPRINT RESOLUTION =====================
    async function resolveCurrentSprintId(): Promise<number | null> {
        const name = SPRINT_TAB_NAMES[currentSprintId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text) return null;
            const sprint = JSON.parse(text) as Sprint;
            return sprint?.id ?? null;
        } catch (err) {
            console.error("Failed to resolve sprint:", err);
            return null;
        }
    }

    // ===================== TEAMMATES =====================
    async function loadTeammates(): Promise<void> {
        teammateIds = new Set<string>();
        userIdToName = new Map<string, string>();
        const myTeam = sessionStorage.getItem("team") || "";
        const myId = sessionStorage.getItem("userId") || "";
        if (myId) teammateIds.add(myId);
        if (!myTeam) return;
        try {
            const res = await fetch(USERS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users = (await res.json()) as BackendUser[];
            users.forEach((u) => {
                const id = String(u.id);
                userIdToName.set(id, u.name || `User ${id}`);
                const teamName = u.team?.name || "";
                if (teamName === myTeam) teammateIds.add(id);
            });
        } catch (err) {
            console.error("Failed to load teammates:", err);
        }
    }

    function taskVisibleToCurrentEmployee(task: BackendTask): boolean {
        const myTeam = sessionStorage.getItem("team") || "";
        if (!myTeam) return false;
        if (task.assignedTeams) {
            const teams = String(task.assignedTeams).split(",").map((s) => s.trim()).filter(Boolean);
            if (teams.includes(myTeam)) return true;
        }
        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds).split(",").map((s) => s.trim()).filter(Boolean);
            if (ids.some((id) => teammateIds.has(id))) return true;
        }
        return false;
    }

    function assigneeLabel(task: Task): string {
        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds).split(",").map((s) => s.trim()).filter(Boolean);
            const names = ids.map((id) => userIdToName.get(id)).filter((n): n is string => typeof n === "string");
            if (names.length > 0) return names.join(", ");
        }
        if (task.assignedTeams) {
            const teams = String(task.assignedTeams).split(",").map((s) => s.trim()).filter(Boolean);
            if (teams.length > 0) return teams.join(", ");
        }
        return "Unassigned";
    }

    // ===================== BACKEND SYNC =====================
    async function fetchTasks(): Promise<Task[]> {
        try {
            currentSprintNumericId = await resolveCurrentSprintId();
            let raw: BackendTask[] = [];
            if (currentSprintNumericId) {
                const res = await fetch(`${API_BASE}/sprint/${currentSprintNumericId}`);
                if (res.ok) raw = (await res.json()) as BackendTask[];
                else {
                    const allRes = await fetch(API_BASE);
                    if (allRes.ok) raw = (await allRes.json()) as BackendTask[];
                }
            } else {
                const allRes = await fetch(API_BASE);
                if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`);
                const all = (await allRes.json()) as BackendTask[];
                raw = all.filter((t) => {
                    const taskSprintId = t.sprint?.id ? String(t.sprint.id) : "";
                    return taskSprintId === "";
                });
            }
            return raw.filter(taskVisibleToCurrentEmployee).map(mapTask);
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    function mapTask(t: BackendTask): Task {
        return {
            id: String(t.id),
            column: (t.status ?? "PRODUCT_BACKLOG") as ColumnId,
            title: t.name,
            description: t.description ?? "",
            dueDate: t.dueDate ?? "",
            estimateHours: t.estimateHours ?? 0,
            priority: t.priority ?? "",
            progress: typeof t.progress === "number" ? t.progress : 0,
            tags: Array.isArray(t.tags) ? t.tags : [],
            assignedTeams: t.assignedTeams ?? null,
            assignedEmployeeIds: t.assignedEmployeeIds ?? null,
        };
    }

    // ===================== RENDER =====================
    const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;
    function renderPriorityBadge(task: Task): string {
        if (!task.priority) return "";
        return `<span class="priority-badge priority-${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>`;
    }
    function renderProgressBar(task: Task): string {
        const pct = Math.max(0, Math.min(100, Number(task.progress) || 0));
        if (pct <= 0) return "";
        return `
      <div class="progress-wrap" title="Progress: ${pct}%">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-text">${pct}%</span>
      </div>`;
    }
    function renderAssignees(task: Task): string {
        if (task.assignedTeams) {
            const teams = String(task.assignedTeams).split(",").map((s) => s.trim()).filter(Boolean);
            if (teams.length > 0) {
                return teams.map((name) => `<span class="team-chip">${escapeHtml(name)}</span>`).join(" ");
            }
        }
        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds).split(",").map((s) => s.trim()).filter(Boolean);
            return ids.map((id) => {
                const name = userIdToName.get(id) || `User ${id}`;
                return `<div class="avatar avatar-small avatar-purple" title="${escapeHtml(name)}">${escapeHtml(initials(name))}</div>`;
            }).join("");
        }
        return "";
    }

    function renderCard(task: Task): string {
        const priorityBadge = renderPriorityBadge(task);
        const badges = [
            priorityBadge,
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${task.estimateHours}h</span>` : "",
        ].join("");
        const tagBadges = (task.tags ?? []).map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`).join("");
        const assigneesHtml = renderAssignees(task);
        const footerHtml = badges || tagBadges || assigneesHtml
            ? `<div class="card-footer-row">
                 <div class="card-badges">${badges}${tagBadges}</div>
                 <div class="tag-avatars">${assigneesHtml}</div>
               </div>`
            : "";
        const progressHtml = renderProgressBar(task);
        return `
      <div class="card${footerHtml || progressHtml ? " card-detailed" : ""}" data-task="${escapeHtml(task.id)}" style="cursor: pointer;">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
          <button type="button" class="logtime-icon" data-logtime="${escapeHtml(task.id)}" title="Log time on this task" aria-label="Log time on ${escapeHtml(task.title)}">${CLOCK_ICON}</button>
        </div>
        ${progressHtml}
        ${footerHtml}
      </div>`;
    }

    function renderBoard(): void {
        const term = searchTerm.toLowerCase();
        board.innerHTML = COLUMNS.map((column) => {
            const cards = tasks.filter((t) => {
                if (t.column !== column.id) return false;
                if (term && !t.title.toLowerCase().includes(term)) return false;
                if (currentTagName !== TAG_FILTER_ALL) {
                    const hasTag = (t.tags ?? []).some(
                        (tag) => tag.name.toLowerCase() === currentTagName.toLowerCase()
                    );
                    if (!hasTag) return false;
                }
                return true;
            });
            return `
      <section class="column" data-column="${column.id}">
        <h2>${column.name}</h2>
        <div class="card-list">${cards.map(renderCard).join("")}</div>
      </section>`;
        }).join("");
        if (emptyState) emptyState.style.display = tasks.length === 0 ? "block" : "none";
    }

    // ===================== SEARCH =====================
    searchInput?.addEventListener("input", (event) => {
        searchTerm = (event.target as HTMLInputElement).value.trim();
        renderBoard();
    });
    searchInput?.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            searchInput.value = "";
            searchTerm = "";
            renderBoard();
        }
    });

    // ===================== TAG FILTER =====================
    function availableTagNames(): string[] {
        const names = new Set<string>();
        tasks.forEach((t) => (t.tags ?? []).forEach((tag) => names.add(tag.name)));
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }
    function renderTagFilter(): void {
        if (!tagFilterMenu) return;
        const names = availableTagNames();
        const countFor = (name: string) =>
            tasks.filter((t) =>
                (t.tags ?? []).some((tag) => tag.name.toLowerCase() === name.toLowerCase())
            ).length;
        const header = `
            <button type="button" class="filter-option${currentTagName === TAG_FILTER_ALL ? " active" : ""}" data-tag="${TAG_FILTER_ALL}" role="menuitemradio" aria-checked="${currentTagName === TAG_FILTER_ALL}">
                <span>All tags</span><span class="filter-count">${tasks.length}</span>
            </button>`;
        const rows = names.length === 0
            ? `<p class="employee-empty">No tags yet.</p>`
            : names.map((name) => {
                const active = currentTagName.toLowerCase() === name.toLowerCase();
                return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-tag="${escapeHtml(name)}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(name)}</span><span class="filter-count">${countFor(name)}</span>
            </button>`;
            }).join("");
        tagFilterMenu.innerHTML = `<span class="popover-label">Filter by tag</span>` + header + rows;
        if (tagFilterLabel) {
            tagFilterLabel.textContent = currentTagName === TAG_FILTER_ALL ? "All tags" : currentTagName;
        }
        tagFilterBtn?.classList.toggle("filtered", currentTagName !== TAG_FILTER_ALL);
    }
    tagFilterMenu?.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const target = event.target as HTMLElement;
        const tagBtn = target.closest<HTMLElement>("[data-tag]");
        if (!tagBtn) return;
        currentTagName = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
    });

    // ===================== LOG TIME MODAL =====================
    const logTimeOverlay = requireElement<HTMLDivElement>("logTimeOverlay");
    const closeLogTimeBtn = requireElement<HTMLButtonElement>("closeLogTimeBtn");
    const logTimeForm = requireElement<HTMLFormElement>("logTimeForm");
    const logDate = requireElement<HTMLInputElement>("logDate");
    const logStartTime = requireElement<HTMLInputElement>("logStartTime");
    const logHours = requireElement<HTMLInputElement>("logHours");
    const logDescription = requireElement<HTMLInputElement>("logDescription");
    const logTimeTaskContext = requireElement<HTMLParagraphElement>("logTimeTaskContext");
    const logTimeError = requireElement<HTMLDivElement>("logTimeError");
    const logTimeErrorText = requireElement<HTMLSpanElement>("logTimeErrorText");
    const logTimeSubmitBtn = requireElement<HTMLButtonElement>("logTimeSubmitBtn");

    let logTimeTaskId: string | null = null;

    function openLogTimeModal(task: Task): void {
        if (!task || !task.id) return;
        logTimeTaskId = task.id;
        logTimeTaskContext.textContent = `Record your start time, time spent, and date for "${task.title}".`;
        logDate.value = new Date().toISOString().split("T")[0];
        logStartTime.value = "";
        logHours.value = "";
        logDescription.value = "";
        logTimeError.hidden = true;
        logTimeSubmitBtn.disabled = false;
        logTimeSubmitBtn.textContent = "Save log";
        logTimeOverlay.classList.add("visible");
        logDate.focus();
    }
    function closeLogTimeModal(): void {
        logTimeOverlay.classList.remove("visible");
        logTimeTaskId = null;
    }
    closeLogTimeBtn.addEventListener("click", closeLogTimeModal);
    logTimeOverlay.addEventListener("click", (e: MouseEvent) => {
        if (e.target === logTimeOverlay) closeLogTimeModal();
    });
    logTimeForm.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();
        logTimeError.hidden = true;
        const userId = sessionStorage.getItem("userId");
        const payload = {
            date: logDate.value,
            startTime: logStartTime.value,
            hours: Number(logHours.value),
            description: logDescription.value.trim() || null,
            taskId: logTimeTaskId ? Number(logTimeTaskId) : null,
            userId: userId ? Number(userId) : null,
        };
        if (!payload.date) { logTimeErrorText.textContent = "Please pick a date."; logTimeError.hidden = false; return; }
        if (!payload.startTime) { logTimeErrorText.textContent = "Please pick a start time."; logTimeError.hidden = false; return; }
        if (!payload.hours || payload.hours <= 0) { logTimeErrorText.textContent = "Hours must be greater than 0."; logTimeError.hidden = false; return; }
        if (!payload.taskId) { logTimeErrorText.textContent = "Missing task ID."; logTimeError.hidden = false; return; }
        if (!payload.userId) { logTimeErrorText.textContent = "You must be signed in."; logTimeError.hidden = false; return; }
        logTimeSubmitBtn.disabled = true;
        logTimeSubmitBtn.textContent = "Saving…";
        try {
            const res = await fetch(TIMELOGS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            closeLogTimeModal();
            showToast(`Logged ${payload.hours}h on this task`);
        } catch (err) {
            console.error("Log time failed:", err);
            logTimeErrorText.textContent = err instanceof Error ? err.message : "Could not save the time log.";
            logTimeError.hidden = false;
            logTimeSubmitBtn.disabled = false;
            logTimeSubmitBtn.textContent = "Save log";
        }
    });

    // ===================== MY LOGS MODAL =====================
    const myLogsBtn = document.getElementById("myLogsBtn") as HTMLButtonElement | null;
    const myLogsOverlay = document.getElementById("myLogsOverlay") as HTMLDivElement | null;
    const closeMyLogsBtn = document.getElementById("closeMyLogsBtn") as HTMLButtonElement | null;
    const myLogsBody = document.getElementById("myLogsBody") as HTMLTableSectionElement | null;
    const myLogsTotal = document.getElementById("myLogsTotal") as HTMLParagraphElement | null;

    async function openMyLogs(): Promise<void> {
        if (!myLogsOverlay || !myLogsBody) return;
        closeAllMenus();
        myLogsBody.innerHTML = `<tr><td colspan="5" class="muted">Loading…</td></tr>`;
        if (myLogsTotal) myLogsTotal.textContent = "";
        myLogsOverlay.classList.add("visible");
        await refreshMyLogs();
    }
    async function refreshMyLogs(): Promise<void> {
        if (!myLogsBody) return;
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            myLogsBody.innerHTML = `<tr><td colspan="5" class="muted">You must be signed in.</td></tr>`;
            return;
        }
        try {
            const res = await fetch(`${TIMELOGS_API}/user/${userId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const logs = (await res.json()) as BackendTimeLog[];
            if (!Array.isArray(logs) || logs.length === 0) {
                myLogsBody.innerHTML = `<tr><td colspan="5" class="muted">You haven't logged any time yet.</td></tr>`;
                if (myLogsTotal) myLogsTotal.textContent = "Total: 0h across 0 log(s)";
                return;
            }
            logs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
            let total = 0;
            myLogsBody.innerHTML = logs.map((l) => {
                const hours = Number(l.hours || 0);
                total += hours;
                const date = formatDateShort(l.date);
                const task = l.task?.name ?? "—";
                const desc = l.description ? escapeHtml(l.description) : "—";
                return `
                    <tr>
                        <td>${escapeHtml(date)}</td>
                        <td>${escapeHtml(task)}</td>
                        <td>${hours.toFixed(1)}h</td>
                        <td>${desc}</td>
                        <td>
                            <button type="button" class="log-delete-btn"
                                    data-delete-log="${l.id}"
                                    aria-label="Delete this log entry">✕</button>
                        </td>
                    </tr>`;
            }).join("");
            if (myLogsTotal) {
                myLogsTotal.textContent = `Total: ${total.toFixed(1)}h across ${logs.length} log(s)`;
            }
        } catch (err) {
            console.error("Failed to load my logs:", err);
            myLogsBody.innerHTML = `<tr><td colspan="5" class="muted">Could not load your logs.</td></tr>`;
        }
    }
    async function deleteMyLog(logId: string): Promise<void> {
        const confirmed = await showConfirmModal({
            title: "Delete this time log?",
            message: "This cannot be undone.",
            confirmText: "Delete",
            danger: true,
        });
        if (!confirmed) return;
        try {
            const role = sessionStorage.getItem("role") || "";
            const res = await fetch(`${TIMELOGS_API}/${logId}`, {
                method: "DELETE",
                headers: { "X-Role": role },
            });
            if (res.status === 403) { showToast("You are not allowed to delete this log."); return; }
            if (res.status === 404) showToast("That log no longer exists.");
            else if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            await refreshMyLogs();
        } catch (err) {
            console.error("Delete log failed:", err);
            showToast("Could not delete the log. Please try again.");
        }
    }
    myLogsBody?.addEventListener("click", (event: MouseEvent) => {
        const btn = (event.target as HTMLElement).closest<HTMLElement>("[data-delete-log]");
        if (!btn) return;
        const id = btn.dataset["deleteLog"];
        if (id) void deleteMyLog(id);
    });
    function closeMyLogs(): void { myLogsOverlay?.classList.remove("visible"); }
    myLogsBtn?.addEventListener("click", () => { void openMyLogs(); });
    closeMyLogsBtn?.addEventListener("click", closeMyLogs);
    myLogsOverlay?.addEventListener("click", (e: MouseEvent) => {
        if (e.target === myLogsOverlay) closeMyLogs();
    });

    // ===================== TASK MODAL =====================
    const overlay = document.getElementById("taskModalOverlay");
    const modalColumn = document.getElementById("modalColumn") as HTMLSelectElement | null;
    const titleInput = document.getElementById("modalTitle") as HTMLInputElement | null;
    const descriptionBox = document.getElementById("modalDescription") as HTMLTextAreaElement | null;
    const summary = document.getElementById("modalSummary") as HTMLDivElement | null;
    const closeBtn = document.getElementById("modalCloseBtn") as HTMLButtonElement | null;
    const cancelBtn = document.getElementById("modalCancelBtn") as HTMLButtonElement | null;

    const modalMoreBtn = document.getElementById("modalMoreBtn") as HTMLButtonElement | null;
    const modalMoreMenu = document.getElementById("modalMoreMenu") as HTMLDivElement | null;
    const modalCommentsBtn = document.getElementById("modalCommentsBtn") as HTMLButtonElement | null;

    function setModalMoreOpen(open: boolean): void {
        if (!modalMoreMenu || !modalMoreBtn) return;
        modalMoreMenu.classList.toggle("visible", open);
        modalMoreBtn.setAttribute("aria-expanded", String(open));
    }
    modalMoreBtn?.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        setModalMoreOpen(!modalMoreMenu!.classList.contains("visible"));
    });
    modalCommentsBtn?.addEventListener("click", () => {
        setModalMoreOpen(false);
        void openCommentsModal();
    });

    function openModal(task: Task): void {
        if (!overlay) return;
        currentOpenTaskId = task.id;
        if (modalColumn) modalColumn.value = task.column;
        if (titleInput) titleInput.value = task.title;
        if (descriptionBox) descriptionBox.value = task.description || "";
        if (summary) {
            const priorityLabel = task.priority ? escapeHtml(task.priority) : "None";
            const chips: string[] = [
                `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(task))}</span>`,
                `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
                `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
                `<span class="summary-chip"><b>Priority</b> ${priorityLabel}</span>`,
                `<span class="summary-chip"><b>Progress</b> ${Math.max(0, Math.min(100, Number(task.progress) || 0))}%</span>`,
            ];
            summary.innerHTML = chips.join("");
        }
        setModalMoreOpen(false);
        overlay.classList.add("visible");
    }
    function closeModal(): void {
        setModalMoreOpen(false);
        overlay?.classList.remove("visible");
        currentOpenTaskId = null;
    }

    if (overlay && closeBtn && cancelBtn) {
        closeBtn.addEventListener("click", closeModal);
        cancelBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });
        overlay.addEventListener("click", (event) => {
            if (!modalMoreMenu?.classList.contains("visible")) return;
            const t = event.target as Node;
            if (modalMoreMenu.contains(t) || modalMoreBtn?.contains(t)) return;
            setModalMoreOpen(false);
        });
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (confirmOverlay?.classList.contains("visible")) { closeConfirmModal(false); return; }
                if (commentsOverlay?.classList.contains("visible")) { closeCommentsModal(); return; }
                if (logoutOverlay?.classList.contains("visible")) { logoutOverlay.classList.remove("visible"); return; }
                if (logTimeOverlay.classList.contains("visible")) { closeLogTimeModal(); return; }
                if (myLogsOverlay?.classList.contains("visible")) { closeMyLogs(); return; }
                if (tagFilterMenu?.classList.contains("visible")) { setTagFilterOpen(false); return; }
                if (modalMoreMenu?.classList.contains("visible")) { setModalMoreOpen(false); return; }
                closeModal();
            }
        });
    }

    // ===================== COMMENTS MODAL =====================
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
                    <div class="comment-avatar">${authorInitials}</div>
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
        if (!currentOpenTaskId) return;
        const task = tasks.find((t) => t.id === currentOpenTaskId);
        if (!task) return;
        commentsTaskId = currentOpenTaskId;
        if (commentsTitle) commentsTitle.textContent = "Comments";
        if (commentsSubtitle) commentsSubtitle.textContent = `On "${task.title}"`;
        if (newCommentText) newCommentText.value = "";
        updateCommentsCharCount();
        commentsOverlay?.classList.add("visible");
        await loadComments(currentOpenTaskId);
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

    // ===== Delete a comment =====
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

    // ===================== BOARD CLICK =====================
    board.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const logBtn = target.closest<HTMLElement>("[data-logtime]");
        if (logBtn) {
            const taskId = logBtn.dataset["logtime"];
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return;
            openLogTimeModal(task);
            return;
        }
        const card = target.closest<HTMLElement>("[data-task]");
        if (!card) return;
        const id = card.dataset["task"];
        const task = tasks.find((t) => t.id === id);
        if (task) openModal(task);
    });

    // ===================== SPRINT TABS =====================
    function initSprintTabs(): void {
        const tabs = document.querySelectorAll<HTMLButtonElement>(".sprint-tab");
        tabs.forEach((tab) => {
            const isActive = tab.dataset["sprint"] === currentSprintId;
            tab.classList.toggle("active", isActive);
        });
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((other) => other.classList.remove("active"));
                tab.classList.add("active");
                const sprintId = tab.dataset["sprint"];
                if (!sprintId) return;
                currentSprintId = sprintId;
                sessionStorage.setItem("currentSprintId", sprintId);
                void (async () => {
                    await loadTeammates();
                    tasks = await fetchTasks();
                    currentTagName = TAG_FILTER_ALL;
                    renderTagFilter();
                    renderBoard();
                })();
            });
        });
    }

    // ===================== INIT =====================
    async function init(): Promise<void> {
        initSprintTabs();
        await loadTeammates();
        tasks = await fetchTasks();
        renderTagFilter();
        renderBoard();
    }
    void init();
})();