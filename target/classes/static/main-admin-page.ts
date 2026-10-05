// main-admin-page.ts
// Compile with:
//   npx tsc main-admin-page.ts --module esnext --target esnext --strict --ignoreConfig

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
    type ColumnId = "PRODUCT_BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

    type Assignee =
        | { kind: "team"; teamId: string }
        | { kind: "teams"; teamIds: string[] }
        | { kind: "employees"; employeeIds: string[] };

    type Task = {
        id: string;
        sprintId: string;
        column: ColumnId;
        title: string;
        description: string;
        assignee: Assignee | null;
        dueDate: string;
        estimateHours: number;
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
        dueDate?: string | null;          // ✅ NEW
        estimateHours?: number | null;    // ✅ NEW
    };

    type BackendUser = {
        id: number;
        name: string;
        email: string;
        role: string;
        team?: { name: string } | null;
    };

    // ===================== CONFIG =====================
    const API_BASE = "http://localhost:8080/api/tasks";
    const USERS_API = "http://localhost:8080/api/users";

    // ===================== REFERENCE DATA =====================
    const TEAMS: Team[] = [
        { id: "Team Alpha", name: "Team Alpha" },
        { id: "Team Beta",  name: "Team Beta" },
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
        return { id: "", sprintId, column, title: "", description: "", assignee: null, dueDate: "", estimateHours: 0 };
    }

    // ===================== HELPERS =====================
    function requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
        return el as T;
    }

    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
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
        return assignedEmployees(task.assignee).map((employee) => employee.team).filter(Boolean);
    }

    function assigneeLabel(assignee: Assignee | null): string {
        if (!assignee) return "Unassigned";
        if (assignee.kind === "team") return teamName(assignee.teamId) || "Team";
        if (assignee.kind === "teams") return assignee.teamIds.join(", ");
        const names = assignedEmployees(assignee).map((employee) => employee.name);
        return names.length > 0 ? names.join(", ") : "Unassigned";
    }

    function formatEstimate(hours: number): string {
        return `${hours}h`;
    }

    function formatDateBadge(isoDate: string): string {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    function readSetting(key: string): string {
        try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
    }

    function writeSetting(key: string, value: string): void {
        try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    }

    // ===================== STATE =====================
    let tasks: Task[] = [];
    let currentSprintId = "1";
    let currentTeamId = "all";
    let searchTerm = "";

    const board = requireElement<HTMLElement>("board");

    function assigneeToBackendPayload(assignee: Assignee | null): { assignedTeams: string | null; assignedEmployeeIds: string | null } {
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

    // ===================== BACKEND SYNC =====================
    async function fetchTasks(): Promise<Task[]> {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: BackendTask[] = await res.json();

            return data.map((t) => {
                let assignee: Assignee | null = null;

                if (t.assignedEmployeeIds) {
                    const ids = t.assignedEmployeeIds.split(",").map((s) => s.trim()).filter(Boolean);
                    if (ids.length > 0) {
                        assignee = { kind: "employees", employeeIds: ids };
                    }
                }

                if (!assignee && t.assignedTeams) {
                    const names = t.assignedTeams.split(",").map((s) => s.trim()).filter(Boolean);
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
                    dueDate: t.dueDate ?? "",                         // ✅ NEW
                    estimateHours: t.estimateHours ?? 0,              // ✅ NEW
                };
            });
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    async function refreshFromBackend(): Promise<void> {
        tasks = await fetchTasks();
        renderBoard();
        renderTeamFilter();
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
                    dueDate: task.dueDate || null,                     // ✅ NEW
                    estimateHours: task.estimateHours,                 // ✅ NEW
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json() as Task;
        } catch (err) {
            console.error("Create failed:", err);
            alert("Failed to create task.");
            return null;
        }
    }

    async function apiUpdate(task: Task): Promise<boolean> {
        try {
            const payload = assigneeToBackendPayload(task.assignee);
            const res = await fetch(`${API_BASE}/${task.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: task.title,
                    description: task.description,
                    status: task.column,
                    assignedTeams: payload.assignedTeams,
                    assignedEmployeeIds: payload.assignedEmployeeIds,
                    dueDate: task.dueDate || null,                     // ✅ NEW
                    estimateHours: task.estimateHours,                 // ✅ NEW
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return true;
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to save task.");
            return false;
        }
    }

    async function apiDelete(id: string): Promise<boolean> {
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return true;
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete task.");
            return false;
        }
    }

    // ===================== RENDER =====================
    function visibleTasks(): Task[] {
        const term = searchTerm.toLowerCase();
        return tasks.filter((task) => {
            if (task.sprintId !== currentSprintId) return false;
            if (currentTeamId !== "all" && !teamsOfTask(task).includes(currentTeamId)) return false;
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
                .map((t) => `<span class="team-chip">${escapeHtml(t)}</span>`)
                .join(" ");
        }
        return assignedEmployees(task.assignee)
            .map((employee) =>
                `<div class="avatar avatar-small avatar-purple" title="${escapeHtml(employee.name)} · ${escapeHtml(employee.team)}">${escapeHtml(initials(employee.name))}</div>`
            )
            .join("");
    }

    const PENCIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/></svg>`;
    const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;

    function renderCard(task: Task): string {
        const badges = [
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${formatEstimate(task.estimateHours)}</span>` : "",
        ].join("");
        const assigneeHtml = renderAssignee(task);
        const footerHtml = badges || assigneeHtml
            ? `<div class="card-footer-row"><div class="card-badges">${badges}</div><div class="tag-avatars">${assigneeHtml}</div></div>`
            : "";

        return `
      <div class="card${footerHtml ? " card-detailed" : ""}" draggable="true" data-task="${task.id}">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
          <button type="button" class="edit-icon" data-edit="${task.id}" title="Edit task details" aria-label="Edit ${escapeHtml(task.title)}">${PENCIL_ICON}</button>
        </div>
        ${footerHtml}
      </div>`;
    }

    function renderBoard(): void {
        const shown = visibleTasks();
        board.innerHTML = COLUMNS.map((column) => {
            const cards = shown.filter((task) => task.column === column.id);
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

        const addBtn = target.closest("[data-add]");
        if (addBtn) {
            const draftTask = blankTask(currentSprintId, addBtn.dataset["add"]);
            // Only pre-assign if a specific team filter is active.
            // When "All teams" is selected, leave the task unassigned.
            if (currentTeamId !== "all") {
                draftTask.assignee = { kind: "team", teamId: currentTeamId };
            }
            openModal(draftTask);
        }
    });

    // ===================== DRAG AND DROP =====================
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
        if (moved) {
            const from = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
            moved.column = column.dataset["column"] as ColumnId;

            const ok = await apiUpdate(moved);
            if (ok) {
                const to = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
                if (from !== to) showToast(`Moved to ${to}`);
                await refreshFromBackend();
            }
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
    function initSprintTabs(): void {
        const tabs = document.querySelectorAll<HTMLButtonElement>(".sprint-tab");
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((other) => other.classList.remove("active"));
                tab.classList.add("active");
                const sprintId = tab.dataset["sprint"];
                if (sprintId) {
                    currentSprintId = sprintId;
                    renderBoard();
                    renderTeamFilter();
                }
            });
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
            options.map((option) => {
                const active = option.id === currentTeamId;
                return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-team="${option.id}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(option.name)}</span><span class="filter-count">${option.count}</span>
            </button>`;
            }).join("");

        teamFilterLabel.textContent = currentTeamId === "all" ? "All teams" : (teamName(currentTeamId) || "All teams");
        teamFilterBtn.classList.toggle("filtered", currentTeamId !== "all");
    }

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

    let draft: Task | null = null;
    let assignKind: "team" | "teams" | "employees" = "team";

    function openModal(task: Task): void {
        draft = JSON.parse(JSON.stringify(task)) as Task;
        assignKind = draft.assignee?.kind ?? "team";

        columnSelect.value = draft.column;
        titleInput.value = draft.title;
        descriptionBox.value = draft.description;
        dueDateInput.value = draft.dueDate;
        estimateInput.value = draft.estimateHours > 0 ? String(draft.estimateHours) : "";
        errorText.textContent = "";
        saveBtn.textContent = draft.id ? "Save" : "Create task";
        deleteBtn.hidden = draft.id === "";
        setDeleteArmed(false);

        renderDraft();
        closePopovers();
        overlay.classList.add("visible");
        titleInput.focus();
    }

    function closeModal(): void {
        overlay.classList.remove("visible");
        closePopovers();
        draft = null;
    }

    function renderDraft(): void {
        if (!draft) return;
        const chips: string[] = [
            `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}</span>`,
            `<span class="summary-chip"><b>Due</b> ${draft.dueDate ? formatDateBadge(draft.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${draft.estimateHours > 0 ? formatEstimate(draft.estimateHours) : "Not set"}</span>`,
        ];
        summary.innerHTML = chips.join("");
        renderAssignControls();
    }

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

        employeeList.innerHTML = visibleEmployees.length === 0
            ? `<p class="employee-empty">${currentTeam ? "No employees in this team yet." : "Choose a team first."}</p>`
            : visibleEmployees.map((employee) => `
            <label class="employee-option">
              <input type="checkbox" value="${escapeHtml(employee.id)}" ${ticked.includes(employee.id) ? "checked" : ""} />
              <span>${escapeHtml(employee.name)}</span>
              <span class="employee-team">${escapeHtml(employee.team)}</span>
            </label>`).join("");
    }

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

    // ----- Popovers -----
    function closePopovers(): void {
        overlay.querySelectorAll<HTMLElement>(".popover.visible").forEach((p) => p.classList.remove("visible"));
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

    // ----- Assignee -----
    document.querySelectorAll<HTMLButtonElement>("[data-assign-kind]").forEach((segment) => {
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

    // ----- Open / close wiring -----
    saveBtn.addEventListener("click", () => { void saveModal(); });
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
        else if (event.key === "Escape") { projectNameInput.value = projectName; projectNameInput.blur(); }
    });

    projectNameInput.value = projectName;
    fitProjectName();
    document.fonts?.ready.then(fitProjectName);

    // ===================== SIDEBAR =====================
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

    // ===================== START SPRINT (US23) =====================
    const startSprintBtn = document.getElementById("startSprintBtn");
    startSprintBtn?.addEventListener("click", () => {
        if (!confirm("Start the sprint now? Time tracking will begin.")) return;
        showToast("Sprint started");
    });

    // ===================== INIT =====================
    async function init(): Promise<void> {
        await loadEmployeesFromBackend();
        initSprintTabs();
        renderTeamFilter();
        await refreshFromBackend();
    }
    void init();
})();