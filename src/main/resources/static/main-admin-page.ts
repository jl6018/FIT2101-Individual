// main-admin-page.ts
// Compile with:
//   npx tsc main-admin-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Admin Board Page — Symph Web Application
 * Handles all interactive behaviour for the admin Kanban board, including
 * authentication guards, task CRUD, drag-and-drop reordering, sprint tabs,
 * team filtering, search, the task modal, and sprint start/end controls.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ===================== ADMIN GUARD =====================
window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index-login-page.html";
    }
});

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index-login-page.html";
    throw new Error("Not logged in");
}
if (sessionStorage.getItem("role") !== "ADMIN") {
    window.location.href = "index-user-page.html";
    throw new Error("Admin access only");
}

(() => {
    // ===================== SHOW CURRENT USER =====================
    const nameEl = document.getElementById("signedInName");
    if (nameEl) {
        const name = sessionStorage.getItem("name");
        const role = sessionStorage.getItem("role");
        if (name) {
            nameEl.textContent = role === "ADMIN" ? `${name} (Admin)` : name;
        }
    }

    // ===================== LOGOUT MODAL =====================
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutOverlay = document.getElementById("logoutOverlay");
    const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

    logoutBtn?.addEventListener("click", () => logoutOverlay?.classList.add("visible"));
    cancelLogoutBtn?.addEventListener("click", () => logoutOverlay?.classList.remove("visible"));
    confirmLogoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index-login-page.html";
    });
    logoutOverlay?.addEventListener("click", (e) => {
        if (e.target === logoutOverlay) logoutOverlay.classList.remove("visible");
    });

    // ===================== TYPES =====================
    /** Identifiers for the five board columns. */
    type ColumnId = "PRODUCT_BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

    /** Priority levels for a task, or an empty string for no priority. */
    type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "";

    /** Assignee of a task — a single team, multiple teams, or specific employees. */
    type Assignee =
        | { kind: "team"; teamId: string }
        | { kind: "teams"; teamIds: string[] }
        | { kind: "employees"; employeeIds: string[] };

    /** Front-end representation of a task on the board. */
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
    };

    /** Reference data for a team. */
    type Team = { id: string; name: string };

    /** Reference data for an employee. */
    type Employee = { id: string; name: string; team: string };

    /** Shape of a task as returned by the backend API. */
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
    };

    /** Shape of a user as returned by the backend API. */
    type BackendUser = {
        id: number;
        name: string;
        email: string;
        role: string;
        team?: { name: string } | null;
    };

    /** Shape of a sprint as returned by the backend API. */
    type Sprint = {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        status: "PLANNED" | "ACTIVE" | "COMPLETED";
        memberCount?: number;
    };

    // ===================== CONFIG =====================
    const API_BASE = "http://localhost:8080/api/tasks";
    const USERS_API = "http://localhost:8080/api/users";
    const SPRINTS_API = "http://localhost:8080/api/sprints";

    /** Maps sprint tab IDs to the sprint names stored in the backend. */
    const SPRINT_TAB_NAMES: Record<string, string> = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };

    // ===================== REFERENCE DATA =====================
    const TEAMS: Team[] = [
        { id: "Team Alpha", name: "Team Alpha" },
        { id: "Team Beta", name: "Team Beta" },
        { id: "Team Gamma", name: "Team Gamma" },
    ];

    let EMPLOYEES: Employee[] = [];

    /**
     * Loads all employees from the backend and caches them in EMPLOYEES.
     */
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

    /**
     * Creates a blank draft task for the given sprint and column.
     *
     * @param sprintId The sprint ID to attach the task to
     * @param column   The board column the task belongs to
     * @returns        A blank Task object
     */
    function blankTask(sprintId: string, column: ColumnId): Task {
        return {
            id: "",
            sprintId,
            column,
            title: "",
            description: "",
            assignee: null,
            dueDate: "",
            estimateHours: 0,
            priority: "",
            position: 0,
        };
    }

    // ===================== HELPERS =====================
    /**
     * Retrieves a DOM element by its ID and throws if not found.
     *
     * @param id The ID of the element to retrieve
     * @returns  The element cast to the expected type
     */
    function requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
        return el as T;
    }

    /**
     * Escapes HTML special characters to prevent XSS injection.
     *
     * @param text The raw string to escape
     * @returns    The escaped string
     */
    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Extracts the initials from a name (up to 2 characters).
     *
     * @param name The full name to extract initials from
     * @returns    The uppercase initials
     */
    function initials(name: string): string {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }

    /**
     * Resolves a team ID to its display name.
     *
     * @param teamId The team ID to resolve
     * @returns       The team name, or an empty string if not found
     */
    function teamName(teamId: string): string {
        return TEAMS.find((team) => team.id === teamId)?.name ?? "";
    }

    /**
     * Looks up an employee by their ID.
     *
     * @param employeeId The employee ID to look up
     * @returns           The Employee object, or undefined if not found
     */
    function findEmployee(employeeId: string): Employee | undefined {
        return EMPLOYEES.find((employee) => employee.id === employeeId);
    }

    /**
     * Returns the list of employees assigned to a task.
     *
     * @param assignee The task's assignee
     * @returns        An array of Employee objects
     */
    function assignedEmployees(assignee: Assignee | null): Employee[] {
        if (assignee?.kind !== "employees") return [];
        return assignee.employeeIds
            .map(findEmployee)
            .filter((employee): employee is Employee => employee !== undefined);
    }

    /**
     * Returns the team IDs a task is assigned to.
     *
     * @param task The task to inspect
     * @returns    An array of team IDs
     */
    function teamsOfTask(task: Task): string[] {
        if (!task.assignee) return [];
        if (task.assignee.kind === "team") return [task.assignee.teamId];
        if (task.assignee.kind === "teams") return task.assignee.teamIds;
        return assignedEmployees(task.assignee)
            .map((employee) => employee.team)
            .filter(Boolean);
    }

    /**
     * Returns a human-readable label for a task's assignee.
     *
     * @param assignee The task's assignee
     * @returns        A display string such as "Team Alpha" or "Unassigned"
     */
    function assigneeLabel(assignee: Assignee | null): string {
        if (!assignee) return "Unassigned";
        if (assignee.kind === "team") return teamName(assignee.teamId) || "Team";
        if (assignee.kind === "teams") return assignee.teamIds.join(", ");
        const names = assignedEmployees(assignee).map((employee) => employee.name);
        return names.length > 0 ? names.join(", ") : "Unassigned";
    }

    /**
     * Formats an estimate in hours for display.
     *
     * @param hours The number of hours
     * @returns      A string such as "4h"
     */
    function formatEstimate(hours: number): string {
        return `${hours}h`;
    }

    /**
     * Formats an ISO date string into a short badge label.
     *
     * @param isoDate The ISO date string (YYYY-MM-DD)
     * @returns        A string such as "5 Sep"
     */
    function formatDateBadge(isoDate: string): string {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    /**
     * Reads a value from localStorage, returning an empty string on failure.
     *
     * @param key The localStorage key
     * @returns    The stored value, or an empty string
     */
    function readSetting(key: string): string {
        try {
            return window.localStorage.getItem(key) ?? "";
        } catch {
            return "";
        }
    }

    /**
     * Writes a value to localStorage, silently ignoring failures.
     *
     * @param key   The localStorage key
     * @param value The value to store
     */
    function writeSetting(key: string, value: string): void {
        try {
            window.localStorage.setItem(key, value);
        } catch {
            /* ignore */
        }
    }

    const SPRINT_KEY = "symph.currentSprint";

    /**
     * Reads the persisted sprint ID, defaulting to "1".
     *
     * @returns The stored sprint ID
     */
    function readSprintSetting(): string {
        return readSetting(SPRINT_KEY) || "1";
    }

    /**
     * Persists the current sprint ID.
     *
     * @param sprintId The sprint ID to save
     */
    function writeSprintSetting(sprintId: string): void {
        writeSetting(SPRINT_KEY, sprintId);
    }

    // ===================== STATE =====================
    let tasks: Task[] = [];
    let currentSprintId = readSprintSetting();
    let currentTeamId = "all";
    let searchTerm = "";

    const board = requireElement<HTMLElement>("board");

    /**
     * Converts a front-end assignee into the backend's payload format.
     *
     * @param assignee The assignee to convert
     * @returns        An object with assignedTeams and assignedEmployeeIds
     */
    function assigneeToBackendPayload(assignee: Assignee | null): {
        assignedTeams: string | null;
        assignedEmployeeIds: string | null;
    } {
        if (!assignee) {
            return { assignedTeams: null, assignedEmployeeIds: null };
        }
        if (assignee.kind === "team") {
            return { assignedTeams: assignee.teamId, assignedEmployeeIds: null };
        }
        if (assignee.kind === "teams") {
            return { assignedTeams: assignee.teamIds.join(","), assignedEmployeeIds: null };
        }
        return { assignedTeams: null, assignedEmployeeIds: assignee.employeeIds.join(",") };
    }

    // ===================== CUSTOM MODALS =====================
    /**
     * Shows a modal overlay by adding the "visible" class.
     *
     * @param id The ID of the overlay to show
     */
    function showOverlay(id: string): void {
        const el = document.getElementById(id);
        if (el) el.classList.add("visible");
    }

    /**
     * Hides a modal overlay by removing the "visible" class.
     *
     * @param id The ID of the overlay to hide
     */
    function hideOverlay(id: string): void {
        const el = document.getElementById(id);
        if (el) el.classList.remove("visible");
    }

    // -------- No-Sprint modal --------
    /**
     * Displays the "No sprint found" modal.
     */
    function showNoSprintModal(): void {
        showOverlay("noSprintOverlay");
    }
    document.getElementById("closeNoSprintBtn")?.addEventListener("click", () => hideOverlay("noSprintOverlay"));
    document.getElementById("noSprintOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("noSprintOverlay")) hideOverlay("noSprintOverlay");
    });

    // -------- Generic Confirm modal --------
    let confirmResolver: ((value: boolean) => void) | null = null;

    /**
     * Shows a generic confirmation modal and returns a promise resolving to the user's choice.
     *
     * @param opts               The options for the modal
     * @param opts.title         The modal title
     * @param opts.message       The modal message body
     * @param opts.confirmText   The confirm button label
     * @param opts.danger        Whether the action is destructive
     * @returns                  A promise resolving to true (confirmed) or false (cancelled)
     */
    function showConfirmModal(opts: {
        title: string;
        message: string;
        confirmText?: string;
        danger?: boolean;
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

    /**
     * Closes the confirm modal and resolves the pending promise.
     *
     * @param result The result to resolve the promise with
     */
    function closeConfirmModal(result: boolean): void {
        hideOverlay("confirmOverlay");
        if (confirmResolver) {
            confirmResolver(result);
            confirmResolver = null;
        }
    }

    document.getElementById("confirmOkBtn")?.addEventListener("click", () => closeConfirmModal(true));
    document.getElementById("confirmCancelBtn")?.addEventListener("click", () => closeConfirmModal(false));
    document.getElementById("confirmOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("confirmOverlay")) closeConfirmModal(false);
    });

    // -------- Generic Alert modal --------
    /**
     * Shows a generic alert modal with a title and message.
     *
     * @param title   The alert title
     * @param message The alert message
     */
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

    // -------- Invite Product Owner (Share button) --------
    const shareBtn = document.getElementById("shareBtn");
    const inviteOverlay = document.getElementById("inviteOverlay");
    const closeInviteBtn = document.getElementById("closeInviteBtn");
    const inviteForm = document.getElementById("inviteForm") as HTMLFormElement | null;
    const ownerEmailInput = document.getElementById("ownerEmail") as HTMLInputElement | null;

    shareBtn?.addEventListener("click", () => inviteOverlay?.classList.add("visible"));
    closeInviteBtn?.addEventListener("click", () => inviteOverlay?.classList.remove("visible"));
    inviteOverlay?.addEventListener("click", (e) => {
        if (e.target === inviteOverlay) inviteOverlay.classList.remove("visible");
    });

    inviteForm?.addEventListener("submit", async (e: SubmitEvent) => {
        e.preventDefault();

        const email = ownerEmailInput?.value.trim();
        if (!email) {
            showToast("Please enter an email address.");
            return;
        }

        try {
            const res = await fetch("/api/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Invite failed — backend said:", text);
                throw new Error(text || "Failed to send invite.");
            }

            inviteOverlay?.classList.remove("visible");
            showToast(`Invite sent to ${email}`);
            inviteForm.reset();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send invite";
            showToast(message);
        }
    });

    // ===================== BACKEND SYNC =====================
    /**
     * Fetches all tasks from the backend and maps them into the front-end Task shape.
     *
     * @returns A promise resolving to an array of Tasks
     */
    async function fetchTasks(): Promise<Task[]> {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: BackendTask[] = await res.json();

            return data.map((t) => {
                let assignee: Assignee | null = null;

                if (t.assignedEmployeeIds) {
                    const ids = t.assignedEmployeeIds
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                    if (ids.length > 0) {
                        assignee = { kind: "employees", employeeIds: ids };
                    }
                }

                if (!assignee && t.assignedTeams) {
                    const names = t.assignedTeams
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                    if (names.length === 1) {
                        assignee = { kind: "team", teamId: names[0] };
                    } else if (names.length > 1) {
                        assignee = { kind: "teams", teamIds: names };
                    }
                }

                return {
                    id: String(t.id),
                    sprintId: "1",
                    column: (t.status ?? "PRODUCT_BACKLOG") as ColumnId,
                    title: t.name,
                    description: t.description ?? "",
                    assignee,
                    dueDate: t.dueDate ?? "",
                    estimateHours: t.estimateHours ?? 0,
                    priority: (t.priority ?? "") as Priority,
                    position: t.position ?? 0,
                };
            });
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    /**
     * Refreshes the task list and re-renders the board and team filter.
     */
    async function refreshFromBackend(): Promise<void> {
        tasks = await fetchTasks();
        renderBoard();
        renderTeamFilter();
    }

    /**
     * Creates a new task on the backend.
     *
     * @param task The task to create
     * @returns    A promise resolving to the created task, or null on failure
     */
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
                    sprint: { id: Number(currentSprintId) },
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

    /**
     * Updates an existing task on the backend.
     *
     * @param task The task to update
     * @returns    A promise resolving to true on success, false on failure
     */
    async function apiUpdate(task: Task): Promise<boolean> {
        try {
            const numericId = Number(task.id);
            if (!Number.isFinite(numericId) || numericId <= 0) {
                console.warn("Skipping update — task has no valid backend ID:", task);
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
                sprint: { id: Number(currentSprintId) },
            };

            console.log(`PUT ${API_BASE}/${numericId}`, body);

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

    /**
     * Deletes a task from the backend by its ID.
     *
     * @param id The ID of the task to delete
     * @returns  A promise resolving to true on success, false on failure
     */
    async function apiDelete(id: string): Promise<boolean> {
        try {
            const numericId = Number(id);
            if (!Number.isFinite(numericId) || numericId <= 0) return false;

            const res = await fetch(`${API_BASE}/${numericId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return true;
        } catch (err) {
            console.error("Delete failed:", err);
            showAlertModal("Delete failed", "Failed to delete task. Please try again.");
            return false;
        }
    }

    // ===================== RENDER =====================
    /**
     * Filters tasks by the current sprint, team, and search term.
     *
     * @returns An array of visible tasks
     */
    function visibleTasks(): Task[] {
        const term = searchTerm.toLowerCase();
        return tasks.filter((task) => {
            if (task.sprintId !== currentSprintId) return false;
            if (currentTeamId !== "all" && !teamsOfTask(task).includes(currentTeamId))
                return false;
            if (term && !task.title.toLowerCase().includes(term)) return false;
            return true;
        });
    }

    /**
     * Renders the assignee chips or avatars for a task card.
     *
     * @param task The task to render assignees for
     * @returns    An HTML string
     */
    function renderAssignee(task: Task): string {
        if (!task.assignee) return "";
        if (task.assignee.kind === "team") {
            return `<span class="team-chip">${escapeHtml(teamName(task.assignee.teamId))}</span>`;
        }
        if (task.assignee.kind === "teams") {
            return task.assignee.teamIds
                .map((t) => `<span class="team-chip">${escapeHtml(t)}</span>`)
                .join(" ");
        }
        return assignedEmployees(task.assignee)
            .map(
                (employee) =>
                    `<div class="avatar avatar-small avatar-purple" title="${escapeHtml(employee.name)} · ${escapeHtml(employee.team)}">${escapeHtml(initials(employee.name))}</div>`
            )
            .join("");
    }

    const PENCIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/></svg>`;
    const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;

    /**
     * Renders a single task card as HTML.
     *
     * @param task The task to render
     * @returns    The card's HTML string
     */
    function renderCard(task: Task): string {
        const priorityBadge = task.priority
            ? `<span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>`
            : "";
        const badges = [
            priorityBadge,
            task.dueDate
                ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>`
                : "",
            task.estimateHours > 0
                ? `<span class="date-badge" title="Estimate">Est. ${formatEstimate(task.estimateHours)}</span>`
                : "",
        ].join("");
        const assigneeHtml = renderAssignee(task);
        const footerHtml =
            badges || assigneeHtml
                ? `<div class="card-footer-row"><div class="card-badges">${badges}</div><div class="tag-avatars">${assigneeHtml}</div></div>`
                : "";

        return `
      <div class="card${footerHtml ? " card-detailed" : ""}" draggable="true" data-task="${escapeHtml(task.id)}">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
          <button type="button" class="edit-icon" data-edit="${escapeHtml(task.id)}" title="Edit task details" aria-label="Edit ${escapeHtml(task.title)}">${PENCIL_ICON}</button>
        </div>
        ${footerHtml}
      </div>`;
    }

    /**
     * Renders the full board with all columns and their cards sorted by position.
     */
    function renderBoard(): void {
        const shown = visibleTasks();
        board.innerHTML = COLUMNS.map((column) => {
            const cards = shown
                .filter((task) => task.column === column.id)
                .sort((a, b) => a.position - b.position);
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
            const draftTask = blankTask(
                currentSprintId,
                addBtn.dataset["add"] as ColumnId
            );
            if (currentTeamId !== "all") {
                draftTask.assignee = { kind: "team", teamId: currentTeamId };
            }
            openModal(draftTask);
        }
    });

    // ===================== DRAG AND DROP =====================
    let draggedTaskId: string | null = null;

    /**
     * Removes all drop-target and drop-before markers from the board.
     */
    function clearDropMarkers(): void {
        board.querySelectorAll(".drop-target, .drop-before").forEach((el) => {
            el.classList.remove("drop-target", "drop-before");
        });
    }

    /**
     * Returns the card directly after the pointer's Y position in a column.
     *
     * @param column   The column to search in
     * @param pointerY The pointer's Y coordinate
     * @returns         The card after the pointer, or null
     */
    function cardAfterPointer(column: HTMLElement, pointerY: number): HTMLElement | null {
        const cards = Array.from(
            column.querySelectorAll<HTMLElement>(".card:not(.dragging)")
        );
        return (
            cards.find((card) => {
                const box = card.getBoundingClientRect();
                return pointerY < box.top + box.height / 2;
            }) ?? null
        );
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
        if (!moved) {
            draggedTaskId = null;
            clearDropMarkers();
            return;
        }

        if (!moved.id || moved.id === "" || Number.isNaN(Number(moved.id))) {
            console.warn("Cannot move — task has no backend ID:", moved);
            showAlertModal("Cannot move", "This task has no ID yet. Refresh the page and try again.");
            draggedTaskId = null;
            clearDropMarkers();
            return;
        }

        const targetColumn = column.dataset["column"] as ColumnId;
        const beforeId =
            cardAfterPointer(column, event.clientY)?.dataset["task"] ?? null;

        const siblings = tasks
            .filter((t) => t.column === targetColumn && t.id !== moved.id)
            .sort((a, b) => a.position - b.position);

        let newPosition: number;
        if (!beforeId) {
            const last = siblings[siblings.length - 1];
            newPosition = last ? last.position + 1 : 1;
        } else {
            const idx = siblings.findIndex((t) => t.id === beforeId);
            const prev = siblings[idx - 1];
            const next = siblings[idx];
            newPosition = prev
                ? (prev.position + next.position) / 2
                : next.position - 1;
        }

        const from = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
        moved.column = targetColumn;
        moved.position = newPosition;

        const ok = await apiUpdate(moved);
        if (ok) {
            const to = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
            if (from !== to) showToast(`Moved to ${to}`);
            await refreshFromBackend();
        }

        draggedTaskId = null;
        clearDropMarkers();
    });

    board.addEventListener("dragend", () => {
        draggedTaskId = null;
        clearDropMarkers();
        board.querySelector(".dragging")?.classList.remove("dragging");
    });

    // ===================== SPRINT TABS + SEARCH =====================
    /**
     * Wires up click handlers for the sprint tab buttons.
     */
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
                    renderBoard();
                    renderTeamFilter();
                    void refreshSprintButton();
                }
            });
        });
    }

    /**
     * Highlights the sprint tab matching the persisted sprint ID.
     */
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

    // ===================== TEAM FILTER =====================
    const teamFilterBtn = requireElement<HTMLButtonElement>("teamFilterBtn");
    const teamFilterMenu = requireElement<HTMLDivElement>("teamFilterMenu");
    const teamFilterLabel = requireElement<HTMLSpanElement>("teamFilterLabel");

    /**
     * Renders the team filter dropdown with counts per team.
     */
    function renderTeamFilter(): void {
        const inSprint = tasks.filter((t) => t.sprintId === currentSprintId);
        const options = [
            { id: "all", name: "All teams", count: inSprint.length },
            ...TEAMS.map((team) => ({
                id: team.id,
                name: team.name,
                count: inSprint.filter((t) => teamsOfTask(t).includes(team.id)).length,
            })),
        ];

        teamFilterMenu.innerHTML =
            `<span class="popover-label">View board for</span>` +
            options
                .map((option) => {
                    const active = option.id === currentTeamId;
                    return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-team="${option.id}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(option.name)}</span><span class="filter-count">${option.count}</span>
            </button>`;
                })
                .join("");

        teamFilterLabel.textContent =
            currentTeamId === "all"
                ? "All teams"
                : teamName(currentTeamId) || "All teams";
        teamFilterBtn.classList.toggle("filtered", currentTeamId !== "all");
    }

    /**
     * Opens or closes the team filter dropdown.
     *
     * @param open Whether the dropdown should be open
     */
    function setTeamFilterOpen(open: boolean): void {
        teamFilterMenu.classList.toggle("visible", open);
        teamFilterBtn.setAttribute("aria-expanded", String(open));
    }

    teamFilterBtn.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        renderTeamFilter();
        setTeamFilterOpen(!teamFilterMenu.classList.contains("visible"));
    });

    teamFilterMenu.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const option = (event.target as HTMLElement).closest<HTMLElement>("[data-team]");
        if (!option) return;
        currentTeamId = option.dataset["team"] ?? "all";
        setTeamFilterOpen(false);
        renderTeamFilter();
        renderBoard();
    });

    document.addEventListener("click", () => setTeamFilterOpen(false));

    // ===================== TASK MODAL =====================
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

    let draft: Task | null = null;
    let assignKind: "team" | "teams" | "employees" = "team";

    /**
     * Opens the task modal with the given task (existing or blank).
     *
     * @param task The task to edit or create
     */
    function openModal(task: Task): void {
        draft = JSON.parse(JSON.stringify(task)) as Task;
        assignKind = draft.assignee?.kind ?? "team";

        columnSelect.value = draft.column;
        titleInput.value = draft.title;
        descriptionBox.value = draft.description;
        dueDateInput.value = draft.dueDate;
        estimateInput.value =
            draft.estimateHours > 0 ? String(draft.estimateHours) : "";
        prioritySelect.value = draft.priority;
        errorText.textContent = "";
        saveBtn.textContent = draft.id ? "Save" : "Create task";
        deleteBtn.hidden = draft.id === "";
        setDeleteArmed(false);

        renderDraft();
        closePopovers();
        overlay.classList.add("visible");
        titleInput.focus();
    }

    /**
     * Closes the task modal and clears the draft.
     */
    function closeModal(): void {
        overlay.classList.remove("visible");
        closePopovers();
        draft = null;
    }

    /**
     * Re-renders the summary chips and assignment controls from the current draft.
     */
    function renderDraft(): void {
        if (!draft) return;
        const chips: string[] = [
            `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}</span>`,
            `<span class="summary-chip"><b>Due</b> ${draft.dueDate ? formatDateBadge(draft.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${draft.estimateHours > 0 ? formatEstimate(draft.estimateHours) : "Not set"}</span>`,
            `<span class="summary-chip"><b>Priority</b> ${draft.priority || "None"}</span>`,
        ];
        summary.innerHTML = chips.join("");
        renderAssignControls();
    }

    /**
     * Renders the team/employee assignment controls from the current draft.
     */
    function renderAssignControls(): void {
        if (!draft) return;

        document.querySelectorAll<HTMLButtonElement>("[data-assign-kind]").forEach((segment) => {
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

        const visibleEmployees = currentTeam
            ? EMPLOYEES.filter((e) => e.team === currentTeam)
            : [];

        const ticked = assignee?.kind === "employees" ? assignee.employeeIds : [];

        employeeList.innerHTML =
            visibleEmployees.length === 0
                ? `<p class="employee-empty">${currentTeam ? "No employees in this team yet." : "Choose a team first."}</p>`
                : visibleEmployees
                      .map(
                          (employee) => `
            <label class="employee-option">
              <input type="checkbox" value="${escapeHtml(employee.id)}" ${ticked.includes(employee.id) ? "checked" : ""} />
              <span>${escapeHtml(employee.name)}</span>
              <span class="employee-team">${escapeHtml(employee.team)}</span>
            </label>`
                      )
                      .join("");
    }

    /**
     * Validates and saves the current draft to the backend.
     */
    async function saveModal(): Promise<void> {
        if (!draft) return;

        const title = titleInput.value.trim();
        if (title.length < 2) {
            errorText.textContent = "Give the task a name of at least 2 characters.";
            titleInput.focus();
            return;
        }

        draft.title = title;
        draft.description = descriptionBox.value.trim();
        draft.column = columnSelect.value as ColumnId;

        const isNew = draft.id === "";
        const ok = isNew ? (await apiCreate(draft)) !== null : await apiUpdate(draft);
        if (!ok) return;

        closeModal();
        await refreshFromBackend();
        showToast(isNew ? "Task created" : "Changes saved");
    }

    // ----- Delete -----
    let deleteArmed = false;

    /**
     * Arms or disarms the delete button (two-click confirmation).
     *
     * @param armed Whether the button should be armed
     */
    function setDeleteArmed(armed: boolean): void {
        deleteArmed = armed;
        deleteBtn.textContent = armed ? "Click again to delete" : "Delete task";
        deleteBtn.classList.toggle("armed", armed);
    }

    deleteBtn.addEventListener("click", async () => {
        if (!draft) return;
        if (!deleteArmed) {
            setDeleteArmed(true);
            return;
        }

        const ok = await apiDelete(draft.id);
        if (!ok) return;

        closeModal();
        await refreshFromBackend();
        showToast("Task deleted");
    });

    deleteBtn.addEventListener("blur", () => setDeleteArmed(false));

    // ----- Popovers -----
    /**
     * Closes all open popovers inside the task modal.
     */
    function closePopovers(): void {
        overlay
            .querySelectorAll<HTMLElement>(".popover.visible")
            .forEach((p) => p.classList.remove("visible"));
    }

    document.querySelectorAll<HTMLButtonElement>("[data-popover]").forEach((button) => {
        button.addEventListener("click", (event: MouseEvent) => {
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

    overlay.querySelectorAll<HTMLElement>(".popover").forEach((popover) => {
        popover.addEventListener("click", (event: MouseEvent) => event.stopPropagation());
    });

    // ----- Due date -----
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

    // ----- Estimate -----
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

    // ----- Priority -----
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

    // ----- Assignee -----
    document.querySelectorAll<HTMLButtonElement>("[data-assign-kind]").forEach((segment) => {
        segment.addEventListener("click", () => {
            assignKind = segment.dataset["assignKind"] === "employees" ? "employees" : "team";
            renderAssignControls();
        });
    });

    assigneeSelect.addEventListener("change", () => {
        if (!draft) return;
        draft.assignee = assigneeSelect.value
            ? { kind: "team", teamId: assigneeSelect.value }
            : null;
        renderAssignControls();
    });

    employeeList.addEventListener("change", () => {
        if (!draft) return;
        const employeeIds = Array.from(
            employeeList.querySelectorAll<HTMLInputElement>("input:checked")
        ).map((box) => box.value);
        draft.assignee =
            employeeIds.length > 0 ? { kind: "employees", employeeIds } : null;
        const chip = summary.querySelector(".summary-chip");
        if (chip)
            chip.innerHTML = `<b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}`;
    });

    requireElement<HTMLButtonElement>("unassignBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.assignee = null;
        renderDraft();
    });

    // ----- Open / close wiring -----
    saveBtn.addEventListener("click", () => {
        void saveModal();
    });
    titleInput.addEventListener("input", () => (errorText.textContent = ""));
    titleInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") void saveModal();
    });
    requireElement<HTMLButtonElement>("modalCloseBtn").addEventListener("click", closeModal);
    requireElement<HTMLButtonElement>("modalCancelBtn").addEventListener("click", closeModal);

    overlay.addEventListener("click", (event: MouseEvent) => {
        if (event.target === overlay) closeModal();
        else closePopovers();
    });

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        setTeamFilterOpen(false);
        if (!overlay.classList.contains("visible")) return;
        if (overlay.querySelector(".popover.visible")) closePopovers();
        else closeModal();
    });

    // ===================== TOAST =====================
    const toast = requireElement<HTMLDivElement>("toast");
    let toastTimeoutId: number | undefined;

    /**
     * Displays a toast notification for 3 seconds.
     *
     * @param message The message to display
     */
    function showToast(message: string): void {
        toast.textContent = message;
        toast.classList.add("visible");
        if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
        toastTimeoutId = window.setTimeout(() => toast.classList.remove("visible"), 3000);
    }

    // ===================== PROJECT NAME =====================
    const PROJECT_NAME_KEY = "symph.projectName";
    const projectNameInput = requireElement<HTMLInputElement>("projectName");
    let projectName = readSetting(PROJECT_NAME_KEY) || "Project Name";

    /**
     * Auto-sizes the project name input to fit its content.
     */
    function fitProjectName(): void {
        const sizer = document.createElement("span");
        sizer.className = "project-name-sizer";
        sizer.textContent = projectNameInput.value || " ";
        projectNameInput.parentElement?.appendChild(sizer);
        projectNameInput.style.width = `${Math.ceil(sizer.getBoundingClientRect().width) + 26}px`;
        sizer.remove();
    }

    /**
     * Commits the typed project name and persists it.
     */
    function commitProjectName(): void {
        const typed = projectNameInput.value.trim();
        if (typed) {
            projectName = typed;
            writeSetting(PROJECT_NAME_KEY, projectName);
        }
        projectNameInput.value = projectName;
        fitProjectName();
    }

    projectNameInput.addEventListener("input", fitProjectName);
    projectNameInput.addEventListener("blur", commitProjectName);
    projectNameInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") projectNameInput.blur();
        else if (event.key === "Escape") {
            projectNameInput.value = projectName;
            projectNameInput.blur();
        }
    });

    projectNameInput.value = projectName;
    fitProjectName();
    document.fonts?.ready.then(fitProjectName);

    // ===================== SIDEBAR =====================
    const SIDEBAR_KEY = "symph.sidebarCollapsed";
    const appShell = requireElement<HTMLDivElement>("appShell");
    const sidebarToggle = requireElement<HTMLButtonElement>("sidebarToggle");

    /**
     * Collapses or expands the sidebar.
     *
     * @param collapsed Whether the sidebar should be collapsed
     */
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

    // ===================== START / END SPRINT (US23) =====================
    const startSprintBtn = document.getElementById("startSprintBtn") as HTMLButtonElement | null;
    let currentSprintStatus: Sprint["status"] | null = null;
    let currentSprintNumericId: number | null = null;

    /**
     * Fetches the sprint matching the given tab ID from the backend.
     *
     * @param tabId The sprint tab ID ("1", "2", or "3")
     * @returns      A promise resolving to the Sprint, or null if not found
     */
    async function fetchSprintStatus(tabId: string): Promise<Sprint | null> {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as Sprint;
        } catch (err) {
            console.error("Failed to load sprint:", err);
            return null;
        }
    }

    /**
     * Renders the sprint start/end button based on sprint status.
     *
     * @param status The current sprint status, or null
     */
    function renderSprintButton(status: Sprint["status"] | null): void {
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

    /**
     * Refreshes the current sprint's status and updates the button.
     */
    async function refreshSprintButton(): Promise<void> {
        const sprint = await fetchSprintStatus(currentSprintId);
        currentSprintStatus = sprint?.status ?? null;
        currentSprintNumericId = sprint?.id ?? null;
        renderSprintButton(currentSprintStatus);
    }

    startSprintBtn?.addEventListener("click", async () => {
        if (!startSprintBtn || startSprintBtn.disabled) return;

        const numericId = currentSprintNumericId;
        if (numericId === null || !Number.isFinite(numericId) || numericId <= 0) {
            showNoSprintModal();
            return;
        }

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
            const res = await fetch(`${SPRINTS_API}/${numericId}/${endpoint}`, {
                method: "PUT",
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `HTTP ${res.status}`);
            }

            const updated: Sprint = await res.json();
            currentSprintStatus = updated.status;
            renderSprintButton(currentSprintStatus);
            showToast(starting ? "Sprint started" : "Sprint completed");
        } catch (err) {
            console.error("Sprint action failed:", err);
            showAlertModal(
                "Sprint update failed",
                `Failed to update sprint status (sprint ${numericId}). Check the console for details.`
            );
            await refreshSprintButton();
        }
    });

    // ===================== INIT =====================
    /**
     * Initializes the admin board page by loading data and wiring UI.
     */
    async function init(): Promise<void> {
        await loadEmployeesFromBackend();
        highlightSavedSprintTab();
        initSprintTabs();
        renderTeamFilter();
        await refreshSprintButton();
        await refreshFromBackend();
    }
    void init();
})();