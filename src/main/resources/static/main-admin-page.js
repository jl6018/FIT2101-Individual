"use strict";
// main-admin-page.js
// Compiled from main-admin-page.ts — do not hand-edit.

// ===================== ADMIN GUARD =====================
window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("loggedIn") !== "true") {
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

    // ===================== CONFIG =====================
    const API_BASE = "http://localhost:8080/api/tasks";
    const USERS_API = "http://localhost:8080/api/users";

    // ===================== REFERENCE DATA =====================
    const TEAMS = [
        { id: "Team Alpha", name: "Team Alpha" },
        { id: "Team Beta",  name: "Team Beta" },
        { id: "Team Gamma", name: "Team Gamma" },
    ];

    let EMPLOYEES = [];

    async function loadEmployeesFromBackend() {
        try {
            const res = await fetch(USERS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users = await res.json();

            EMPLOYEES = users
                .filter((u) => u.role === "EMPLOYEE")
                .map((u) => ({
                    id: String(u.id),
                    name: u.name,
                    team: (u.team && u.team.name) ? u.team.name : "",
                }));
        } catch (err) {
            console.error("Failed to load employees:", err);
            EMPLOYEES = [];
        }
    }

    const COLUMNS = [
        { id: "PRODUCT_BACKLOG", name: "Product Backlog" },
        { id: "TO_DO", name: "To Do" },
        { id: "IN_PROGRESS", name: "In Progress" },
        { id: "IN_REVIEW", name: "In Review" },
        { id: "COMPLETED", name: "Completed" },
    ];

    function blankTask(sprintId, column) {
        return { id: "", sprintId, column, title: "", description: "", assignee: null, dueDate: "", estimateHours: 0 };
    }

    // ===================== HELPERS =====================
    function requireElement(id) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
        return el;
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function initials(name) {
        return name.split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase()).join("");
    }

    function teamName(teamId) {
        return TEAMS.find((team) => team.id === teamId)?.name ?? "";
    }

    function findEmployee(employeeId) {
        return EMPLOYEES.find((employee) => employee.id === employeeId);
    }

    function assignedEmployees(assignee) {
        if (assignee?.kind !== "employees") return [];
        return assignee.employeeIds
            .map(findEmployee)
            .filter((employee) => employee !== undefined);
    }

    function teamsOfTask(task) {
        if (!task.assignee) return [];
        if (task.assignee.kind === "team") return [task.assignee.teamId];
        if (task.assignee.kind === "teams") return task.assignee.teamIds;
        return assignedEmployees(task.assignee).map((employee) => employee.team).filter(Boolean);
    }

    function assigneeLabel(assignee) {
        if (!assignee) return "Unassigned";
        if (assignee.kind === "team") return teamName(assignee.teamId) || "Team";
        if (assignee.kind === "teams") return assignee.teamIds.join(", ");
        const names = assignedEmployees(assignee).map((employee) => employee.name);
        return names.length > 0 ? names.join(", ") : "Unassigned";
    }

    function formatEstimate(hours) {
        return `${hours}h`;
    }

    function formatDateBadge(isoDate) {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    function readSetting(key) {
        try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
    }

    function writeSetting(key, value) {
        try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    }

    // ===================== STATE =====================
    let tasks = [];
    let currentSprintId = "1";
    let currentTeamId = "all";
    let searchTerm = "";

    const board = requireElement("board");

    function assigneeToBackendPayload(assignee) {
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
    async function fetchTasks() {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.map((t) => {
                let assignee = null;

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
                    column: t.status ?? "PRODUCT_BACKLOG",
                    title: t.name,
                    description: t.description ?? "",
                    assignee,
                    dueDate: t.dueDate ?? "",
                    estimateHours: t.estimateHours ?? 0,
                };
            });
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    async function refreshFromBackend() {
        tasks = await fetchTasks();
        renderBoard();
        renderTeamFilter();
    }

    async function apiCreate(task) {
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
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Create failed:", err);
            alert("Failed to create task.");
            return null;
        }
    }

    async function apiUpdate(task) {
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
                    dueDate: task.dueDate || null,
                    estimateHours: task.estimateHours,
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

    async function apiDelete(id) {
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
    function visibleTasks() {
        const term = searchTerm.toLowerCase();
        return tasks.filter((task) => {
            if (task.sprintId !== currentSprintId) return false;
            if (currentTeamId !== "all" && !teamsOfTask(task).includes(currentTeamId)) return false;
            if (term && !task.title.toLowerCase().includes(term)) return false;
            return true;
        });
    }

    function renderAssignee(task) {
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

    function renderCard(task) {
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

    function renderBoard() {
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

    board.addEventListener("click", (event) => {
        const target = event.target;

        const editBtn = target.closest("[data-edit]");
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
    let draggedTaskId = null;

    function clearDropMarkers() {
        board.querySelectorAll(".drop-target, .drop-before").forEach((el) => {
            el.classList.remove("drop-target", "drop-before");
        });
    }

    function cardAfterPointer(column, pointerY) {
        const cards = Array.from(column.querySelectorAll(".card:not(.dragging)"));
        return cards.find((card) => {
            const box = card.getBoundingClientRect();
            return pointerY < box.top + box.height / 2;
        }) ?? null;
    }

    board.addEventListener("dragstart", (event) => {
        const card = event.target.closest("[data-task]");
        if (!card || !event.dataTransfer) return;
        draggedTaskId = card.dataset["task"] ?? null;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedTaskId ?? "");
        card.classList.add("dragging");
    });

    board.addEventListener("dragover", (event) => {
        const column = event.target.closest(".column");
        if (!column || !draggedTaskId) return;
        event.preventDefault();
        clearDropMarkers();
        column.classList.add("drop-target");
        cardAfterPointer(column, event.clientY)?.classList.add("drop-before");
    });

    board.addEventListener("drop", async (event) => {
        const column = event.target.closest(".column");
        if (!column || !draggedTaskId) return;
        event.preventDefault();

        const moved = tasks.find((t) => t.id === draggedTaskId);
        if (moved) {
            const from = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
            moved.column = column.dataset["column"];

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
    function initSprintTabs() {
        const tabs = document.querySelectorAll(".sprint-tab");
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

    requireElement("searchInput").addEventListener("input", (event) => {
        searchTerm = event.target.value.trim();
        renderBoard();
    });

    // ===================== TEAM FILTER =====================
    const teamFilterBtn = requireElement("teamFilterBtn");
    const teamFilterMenu = requireElement("teamFilterMenu");
    const teamFilterLabel = requireElement("teamFilterLabel");

    function renderTeamFilter() {
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

    function setTeamFilterOpen(open) {
        teamFilterMenu.classList.toggle("visible", open);
        teamFilterBtn.setAttribute("aria-expanded", String(open));
    }

    teamFilterBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTeamFilter();
        setTeamFilterOpen(!teamFilterMenu.classList.contains("visible"));
    });

    teamFilterMenu.addEventListener("click", (event) => {
        event.stopPropagation();
        const option = event.target.closest("[data-team]");
        if (!option) return;
        currentTeamId = option.dataset["team"] ?? "all";
        setTeamFilterOpen(false);
        renderTeamFilter();
        renderBoard();
    });

    document.addEventListener("click", () => setTeamFilterOpen(false));

    // ===================== TASK MODAL =====================
    const overlay = requireElement("taskModalOverlay");
    const columnSelect = requireElement("modalColumn");
    const titleInput = requireElement("modalTitle");
    const errorText = requireElement("modalError");
    const descriptionBox = requireElement("modalDescription");
    const summary = requireElement("modalSummary");
    const saveBtn = requireElement("modalSaveBtn");
    const deleteBtn = requireElement("modalDeleteBtn");
    const dueDateInput = requireElement("dueDateInput");
    const assigneeSelect = requireElement("assigneeSelect");
    const employeeList = requireElement("employeeList");
    const estimateInput = requireElement("estimateInput");

    let draft = null;
    let assignKind = "team";

    function openModal(task) {
        draft = JSON.parse(JSON.stringify(task));
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

    function closeModal() {
        overlay.classList.remove("visible");
        closePopovers();
        draft = null;
    }

    function renderDraft() {
        if (!draft) return;
        const chips = [
            `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}</span>`,
            `<span class="summary-chip"><b>Due</b> ${draft.dueDate ? formatDateBadge(draft.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${draft.estimateHours > 0 ? formatEstimate(draft.estimateHours) : "Not set"}</span>`,
        ];
        summary.innerHTML = chips.join("");
        renderAssignControls();
    }

    function renderAssignControls() {
        if (!draft) return;

        document.querySelectorAll("[data-assign-kind]").forEach((segment) => {
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

    async function saveModal() {
        if (!draft) return;

        const title = titleInput.value.trim();
        if (title.length < 2) {
            errorText.textContent = "Give the task a name of at least 2 characters.";
            titleInput.focus();
            return;
        }

        draft.title = title;
        draft.description = descriptionBox.value.trim();
        draft.column = columnSelect.value;

        const isNew = draft.id === "";
        const ok = isNew ? (await apiCreate(draft)) !== null : await apiUpdate(draft);
        if (!ok) return;

        closeModal();
        await refreshFromBackend();
        showToast(isNew ? "Task created" : "Changes saved");
    }

    // ----- Delete -----
    let deleteArmed = false;

    function setDeleteArmed(armed) {
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
    function closePopovers() {
        overlay.querySelectorAll(".popover.visible").forEach((p) => p.classList.remove("visible"));
    }

    document.querySelectorAll("[data-popover]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const popover = document.getElementById(button.dataset["popover"] ?? "");
            if (!popover) return;
            const wasOpen = popover.classList.contains("visible");
            closePopovers();
            if (!wasOpen) {
                popover.classList.add("visible");
                popover.querySelector("input, select")?.focus();
            }
        });
    });

    overlay.querySelectorAll(".popover").forEach((popover) => {
        popover.addEventListener("click", (event) => event.stopPropagation());
    });

    // ----- Due date -----
    dueDateInput.addEventListener("change", () => {
        if (!draft) return;
        draft.dueDate = dueDateInput.value;
        renderDraft();
    });

    requireElement("dueDateClearBtn").addEventListener("click", () => {
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

    requireElement("estimateClearBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.estimateHours = 0;
        estimateInput.value = "";
        renderDraft();
    });

    // ----- Assignee -----
    document.querySelectorAll("[data-assign-kind]").forEach((segment) => {
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
        const employeeIds = Array.from(employeeList.querySelectorAll("input:checked")).map((box) => box.value);
        draft.assignee = employeeIds.length > 0 ? { kind: "employees", employeeIds } : null;
        const chip = summary.querySelector(".summary-chip");
        if (chip) chip.innerHTML = `<b>Assigned to</b> ${escapeHtml(assigneeLabel(draft.assignee))}`;
    });

    requireElement("unassignBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.assignee = null;
        renderDraft();
    });

    // ----- Open / close wiring -----
    saveBtn.addEventListener("click", () => { void saveModal(); });
    titleInput.addEventListener("input", () => (errorText.textContent = ""));
    titleInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void saveModal();
    });
    requireElement("modalCloseBtn").addEventListener("click", closeModal);
    requireElement("modalCancelBtn").addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
        else closePopovers();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setTeamFilterOpen(false);
        if (!overlay.classList.contains("visible")) return;
        if (overlay.querySelector(".popover.visible")) closePopovers();
        else closeModal();
    });

    // ===================== TOAST =====================
    const toast = requireElement("toast");
    let toastTimeoutId;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("visible");
        if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
        toastTimeoutId = window.setTimeout(() => toast.classList.remove("visible"), 3000);
    }

    // ===================== PROJECT NAME =====================
    const PROJECT_NAME_KEY = "symph.projectName";
    const projectNameInput = requireElement("projectName");
    let projectName = readSetting(PROJECT_NAME_KEY) || "Project Name";

    function fitProjectName() {
        const sizer = document.createElement("span");
        sizer.className = "project-name-sizer";
        sizer.textContent = projectNameInput.value || " ";
        projectNameInput.parentElement?.appendChild(sizer);
        projectNameInput.style.width = `${Math.ceil(sizer.getBoundingClientRect().width) + 26}px`;
        sizer.remove();
    }

    function commitProjectName() {
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
    projectNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") projectNameInput.blur();
        else if (event.key === "Escape") { projectNameInput.value = projectName; projectNameInput.blur(); }
    });

    projectNameInput.value = projectName;
    fitProjectName();
    document.fonts?.ready.then(fitProjectName);

    // ===================== SIDEBAR =====================
    const SIDEBAR_KEY = "symph.sidebarCollapsed";
    const appShell = requireElement("appShell");
    const sidebarToggle = requireElement("sidebarToggle");

    function setSidebarCollapsed(collapsed) {
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
    async function init() {
        await loadEmployeesFromBackend();
        initSprintTabs();
        renderTeamFilter();
        await refreshFromBackend();
    }
    void init();
})();