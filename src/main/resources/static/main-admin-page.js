/**
 * Admin Board Page — Symph Web Application
 * Compiled output of main-admin-page.ts — do not hand-edit.
 * Handles all interactive behaviour for the admin Kanban board, including
 * authentication guards, task CRUD, drag-and-drop reordering, sprint tabs,
 * accumulated sprint hours (US25), team filtering, tag filtering/sorting
 * (US14), search, the task modal with progress editing (US16), log-time
 * modal (US24), card status dropdown (US18), sprint start/end controls,
 * tag management (US13), admin-only task deletion (US11), and the
 * PRODUCT_OWNER role (US22).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

// ===================== ADMIN / PRODUCT OWNER GUARD =====================
window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("loggedIn") !== "true") {
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
    // ===================== SHOW CURRENT USER =====================
    const nameEl = document.getElementById("signedInName");
    const avatarEl = document.getElementById("userAvatar");

    const storedName = sessionStorage.getItem("name") || "";
    const storedRole = sessionStorage.getItem("role") || "";

    if (nameEl) {
        if (storedName) {
            const suffix =
                storedRole === "ADMIN" ? " (Admin)" :
                storedRole === "PRODUCT_OWNER" ? " (Product Owner)" : "";
            nameEl.textContent = `${storedName}${suffix}`;
        }
    }

    if (avatarEl) {
        const label = storedName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
        avatarEl.textContent = label || (storedName ? storedName.charAt(0).toUpperCase() : "?");
        if (storedName) avatarEl.title = storedName;
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
    const SPRINTS_API = "http://localhost:8080/api/sprints";
    const TAGS_API = "http://localhost:8080/api/tags";
    const TIMELOGS_API = "http://localhost:8080/api/timelogs";

    const TAG_FILTER_ALL = "all";

    const SPRINT_TAB_NAMES = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };

    // ===================== REFERENCE DATA =====================
    const TEAMS = [
        { id: "Team Alpha", name: "Team Alpha" },
        { id: "Team Beta", name: "Team Beta" },
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
            tags: [],
            progress: 0,
        };
    }

    // ===================== HELPERS =====================
    function requireElement(id) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
        return el;
    }

    function escapeHtml(text) {
        return String(text)
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

    const SPRINT_KEY = "symph.currentSprint";

    function readSprintSetting() {
        return readSetting(SPRINT_KEY) || "1";
    }

    function writeSprintSetting(sprintId) {
        writeSetting(SPRINT_KEY, sprintId);
    }

    // ===================== STATE =====================
    let tasks = [];
    let currentSprintId = readSprintSetting();
    let currentTeamId = "all";
    let currentTagName = TAG_FILTER_ALL;
    let sortByTag = false;
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

    // ===================== US25: SPRINT HOURS =====================
    let currentSprintNumericIdForHours = null;

    async function refreshSprintHours() {
        const chip = document.getElementById("sprintHours");
        const chipValue = document.getElementById("sprintHoursValue");
        if (!chip || !chipValue) return;

        const name = SPRINT_TAB_NAMES[currentSprintId];
        if (!name) {
            chipValue.textContent = "0h logged";
            chip.classList.remove("is-nonzero");
            return;
        }

        try {
            const sprintRes = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (sprintRes.status === 404) {
                chipValue.textContent = "0h logged";
                chip.classList.remove("is-nonzero");
                return;
            }
            if (!sprintRes.ok) throw new Error(`HTTP ${sprintRes.status}`);
            const sprint = await sprintRes.json();
            currentSprintNumericIdForHours = sprint?.id ?? null;

            if (!currentSprintNumericIdForHours) {
                chipValue.textContent = "0h logged";
                chip.classList.remove("is-nonzero");
                return;
            }

            const totalRes = await fetch(`${TIMELOGS_API}/sprint/${currentSprintNumericIdForHours}/total`);
            if (!totalRes.ok) throw new Error(`HTTP ${totalRes.status}`);
            const total = Number(await totalRes.json()) || 0;

            chipValue.textContent = `${total.toFixed(1)}h logged`;
            chip.classList.toggle("is-nonzero", total > 0);
        } catch (err) {
            console.error("Failed to load sprint hours:", err);
            chipValue.textContent = "0h logged";
            chip.classList.remove("is-nonzero");
        }
    }

    // ===================== CUSTOM MODALS =====================
    function showOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("visible");
    }

    function hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove("visible");
    }

    function showNoSprintModal() {
        showOverlay("noSprintOverlay");
    }
    document.getElementById("closeNoSprintBtn")?.addEventListener("click", () => hideOverlay("noSprintOverlay"));
    document.getElementById("noSprintOverlay")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("noSprintOverlay")) hideOverlay("noSprintOverlay");
    });

    let confirmResolver = null;

    function showConfirmModal(opts) {
        return new Promise((resolve) => {
            confirmResolver = resolve;

            const titleEl = document.getElementById("confirmTitle");
            const msgEl = document.getElementById("confirmMessage");
            const okBtn = document.getElementById("confirmOkBtn");

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

    function closeConfirmModal(result) {
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

    function showAlertModal(title, message) {
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
    const inviteForm = document.getElementById("inviteForm");
    const ownerEmailInput = document.getElementById("ownerEmail");

    shareBtn?.addEventListener("click", () => inviteOverlay?.classList.add("visible"));
    closeInviteBtn?.addEventListener("click", () => inviteOverlay?.classList.remove("visible"));
    inviteOverlay?.addEventListener("click", (e) => {
        if (e.target === inviteOverlay) inviteOverlay.classList.remove("visible");
    });

    inviteForm?.addEventListener("submit", async (e) => {
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
                    priority: t.priority ?? "",
                    position: t.position ?? 0,
                    tags: Array.isArray(t.tags) ? t.tags : [],
                    progress: typeof t.progress === "number" ? t.progress : 0,
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
        renderTagFilter();
        await refreshSprintHours();
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
                    priority: task.priority || null,
                    position: task.position,
                    progress: task.progress ?? 0,
                    sprint: { id: Number(currentSprintId) },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Create failed:", err);
            showAlertModal("Create failed", "Failed to create task. Please try again.");
            return null;
        }
    }

    async function apiUpdate(task) {
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
                progress: task.progress ?? 0,
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

    async function apiDelete(id) {
        try {
            const numericId = Number(id);
            if (!Number.isFinite(numericId) || numericId <= 0) return false;

            const role = sessionStorage.getItem("role") || "";
            const res = await fetch(`${API_BASE}/${numericId}`, {
                method: "DELETE",
                headers: { "X-Role": role },
            });

            if (res.status === 403) {
                showAlertModal("Not allowed", "Only admins can delete tasks.");
                return false;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return true;
        } catch (err) {
            console.error("Delete failed:", err);
            showAlertModal("Delete failed", "Failed to delete task. Please try again.");
            return false;
        }
    }

    // ===================== RENDER =====================
    function visibleTasks() {
        const term = searchTerm.toLowerCase();
        return tasks.filter((task) => {
            if (task.sprintId !== currentSprintId) return false;
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

    function renderProgressBar(task) {
        const pct = Math.max(0, Math.min(100, Number(task.progress) || 0));
        if (pct <= 0) return "";
        return `
      <div class="progress-wrap" title="Progress: ${pct}%">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-text">${pct}%</span>
      </div>`;
    }

    function renderCard(task) {
        const priorityBadge = task.priority
            ? `<span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>`
            : "";
        const badges = [
            priorityBadge,
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${formatEstimate(task.estimateHours)}</span>` : "",
        ].join("");
        const tagBadges = (task.tags ?? [])
            .map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`)
            .join("");
        const assigneeHtml = renderAssignee(task);
        const footerHtml = badges || assigneeHtml || tagBadges
            ? `<div class="card-footer-row"><div class="card-badges">${badges}${tagBadges}</div><div class="tag-avatars">${assigneeHtml}</div></div>`
            : "";

        const progressHtml = renderProgressBar(task);

        const columnOptions = COLUMNS.map((col) =>
            `<option value="${col.id}"${col.id === task.column ? " selected" : ""}>${escapeHtml(col.name)}</option>`
        ).join("");

        return `
      <div class="card${footerHtml || progressHtml ? " card-detailed" : ""}" draggable="true" data-task="${escapeHtml(task.id)}">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
          <button type="button" class="logtime-icon" data-logtime="${escapeHtml(task.id)}" title="Log time on this task" aria-label="Log time on ${escapeHtml(task.title)}">${CLOCK_ICON}</button>
          <button type="button" class="edit-icon" data-edit="${escapeHtml(task.id)}" title="Edit task details" aria-label="Edit ${escapeHtml(task.title)}">${PENCIL_ICON}</button>
        </div>
        ${progressHtml}
        <select class="card-status-select" data-status-for="${escapeHtml(task.id)}" aria-label="Change status">
          ${columnOptions}
        </select>
        ${footerHtml}
      </div>`;
    }

    function renderBoard() {
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

    board.addEventListener("click", (event) => {
        const target = event.target;

        const logBtn = target.closest("[data-logtime]");
        if (logBtn) {
            const taskId = logBtn.dataset["logtime"];
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return;
            openLogTimeModal(task);
            return;
        }

        const editBtn = target.closest("[data-edit]");
        if (editBtn) {
            const task = tasks.find((t) => t.id === editBtn.dataset["edit"]);
            if (task) openModal(task);
            return;
        }

        const addBtn = target.closest("[data-add]");
        if (addBtn) {
            const draftTask = blankTask(currentSprintId, addBtn.dataset["add"]);
            if (currentTeamId !== "all") {
                draftTask.assignee = { kind: "team", teamId: currentTeamId };
            }
            openModal(draftTask);
        }
    });

    // ===================== US18: STATUS DROPDOWN ON CARD =====================
    board.addEventListener("change", async (event) => {
        const select = event.target.closest("[data-status-for]");
        if (!select) return;

        const taskId = select.dataset["statusFor"];
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newColumn = select.value;
        if (newColumn === task.column) return;

        const oldColumn = task.column;
        task.column = newColumn;

        if (newColumn === "COMPLETED" && (task.progress ?? 0) < 100) {
            task.progress = 100;
        } else if (
            oldColumn === "COMPLETED" &&
            (newColumn === "TO_DO" || newColumn === "IN_PROGRESS" || newColumn === "IN_REVIEW")
        ) {
            task.progress = 0;
        }

        const ok = await apiUpdate(task);
        if (ok) {
            const to = COLUMNS.find((c) => c.id === newColumn)?.name ?? newColumn;
            showToast(`Moved to ${to}`);
            await refreshFromBackend();
        }
    });

    // ===================== US24: LOG TIME MODAL =====================
    const logTimeOverlay = requireElement("logTimeOverlay");
    const closeLogTimeBtn = requireElement("closeLogTimeBtn");
    const logTimeForm = requireElement("logTimeForm");
    const logDate = requireElement("logDate");
    const logStartTime = requireElement("logStartTime");
    const logHours = requireElement("logHours");
    const logDescription = requireElement("logDescription");
    const logTimeTaskContext = requireElement("logTimeTaskContext");
    const logTimeError = requireElement("logTimeError");
    const logTimeErrorText = requireElement("logTimeErrorText");
    const logTimeSubmitBtn = requireElement("logTimeSubmitBtn");

    let logTimeTaskId = null;

    function openLogTimeModal(task) {
        if (!task || !task.id) return;
        logTimeTaskId = task.id;

        logTimeTaskContext.textContent =
            `Record your start time, time spent, and date for "${task.title}".`;

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

    function closeLogTimeModal() {
        logTimeOverlay.classList.remove("visible");
        logTimeTaskId = null;
    }

    closeLogTimeBtn.addEventListener("click", closeLogTimeModal);
    logTimeOverlay.addEventListener("click", (e) => {
        if (e.target === logTimeOverlay) closeLogTimeModal();
    });

    logTimeForm.addEventListener("submit", async (e) => {
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
            await refreshSprintHours();
        } catch (err) {
            console.error("Log time failed:", err);
            logTimeErrorText.textContent =
                err instanceof Error ? err.message : "Could not save the time log.";
            logTimeError.hidden = false;
            logTimeSubmitBtn.disabled = false;
            logTimeSubmitBtn.textContent = "Save log";
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

        const targetColumn = column.dataset["column"];
        const beforeId =
            cardAfterPointer(column, event.clientY)?.dataset["task"] ?? null;

        const siblings = tasks
            .filter((t) => t.column === targetColumn && t.id !== moved.id)
            .sort((a, b) => a.position - b.position);

        let newPosition;
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
        const wasCompleted = from === "Completed";

        moved.column = targetColumn;
        moved.position = newPosition;

        if (targetColumn === "COMPLETED" && (moved.progress ?? 0) < 100) {
            moved.progress = 100;
        } else if (
            wasCompleted &&
            (targetColumn === "TO_DO" ||
             targetColumn === "IN_PROGRESS" ||
             targetColumn === "IN_REVIEW")
        ) {
            moved.progress = 0;
        }

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
    function initSprintTabs() {
        const tabs = document.querySelectorAll(".sprint-tab");
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
                    renderTagFilter();
                    void refreshSprintButton();
                    void refreshSprintHours();
                }
            });
        });
    }

    function highlightSavedSprintTab() {
        const tabs = document.querySelectorAll(".sprint-tab");
        tabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset["sprint"] === currentSprintId);
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

    // ===================== TAG FILTER (US14) =====================
    const tagFilterBtn = requireElement("tagFilterBtn");
    const tagFilterMenu = requireElement("tagFilterMenu");
    const tagFilterLabel = requireElement("tagFilterLabel");

    function availableTagNames() {
        const names = new Set();
        tasks
            .filter((t) => t.sprintId === currentSprintId)
            .forEach((t) => (t.tags ?? []).forEach((tag) => names.add(tag.name)));
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }

    function renderTagFilter() {
        if (!tagFilterMenu) return;

        const inSprint = tasks.filter((t) => t.sprintId === currentSprintId);
        const names = availableTagNames();

        const countFor = (name) =>
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
            : names
                  .map((name) => {
                      const active = currentTagName.toLowerCase() === name.toLowerCase();
                      return `
            <button type="button" class="filter-option${active ? " active" : ""}" data-tag="${escapeHtml(name)}" role="menuitemradio" aria-checked="${active}">
              <span>${escapeHtml(name)}</span><span class="filter-count">${countFor(name)}</span>
            </button>`;
                  })
                  .join("");

        tagFilterMenu.innerHTML =
            `<span class="popover-label">Filter by tag</span>` + header + rows;

        if (sortByTag && currentTagName === TAG_FILTER_ALL) {
            tagFilterLabel.textContent = "Sorted by tag";
        } else if (currentTagName === TAG_FILTER_ALL) {
            tagFilterLabel.textContent = "All tags";
        } else {
            tagFilterLabel.textContent = currentTagName;
        }

        tagFilterBtn.classList.toggle(
            "filtered",
            sortByTag || currentTagName !== TAG_FILTER_ALL
        );
    }

    function setTagFilterOpen(open) {
        tagFilterMenu.classList.toggle("visible", open);
        tagFilterBtn.setAttribute("aria-expanded", String(open));
    }

    tagFilterBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTagFilter();
        setTagFilterOpen(!tagFilterMenu.classList.contains("visible"));
    });

    tagFilterMenu.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = event.target;

        const sortBtn = target.closest("[data-tag-sort]");
        if (sortBtn) {
            sortByTag = !sortByTag;
            setTagFilterOpen(false);
            renderTagFilter();
            renderBoard();
            return;
        }

        const tagBtn = target.closest("[data-tag]");
        if (!tagBtn) return;
        const name = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        currentTagName = name;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
    });

    document.addEventListener("click", () => setTagFilterOpen(false));

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
    const prioritySelect = requireElement("prioritySelect");

    const tagInput = requireElement("tagInput");
    const addTagBtn = requireElement("addTagBtn");
    const tagChips = requireElement("tagChips");
    const tagEmpty = requireElement("tagEmpty");

    const progressInput = requireElement("progressInput");
    const progressValue = requireElement("progressValue");
    const progressSlider = requireElement("progressSlider");
    const progressClearBtn = requireElement("progressClearBtn");

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
        prioritySelect.value = draft.priority;
        tagInput.value = "";

        const pct = Number(draft.progress) || 0;
        progressInput.value = String(pct);
        progressSlider.value = String(pct);
        progressValue.textContent = `${pct}%`;

        errorText.textContent = "";
        saveBtn.textContent = draft.id ? "Save" : "Create task";
        deleteBtn.hidden = draft.id === "" || sessionStorage.getItem("role") !== "ADMIN";
        setDeleteArmed(false);

        renderDraft();
        renderTags();
        closePopovers();
        overlay.classList.add("visible");
        titleInput.focus();
    }

    function closeModal() {
        overlay.classList.remove("visible");
        closePopovers();

        const wasSavedTask = draft !== null && draft.id !== "";
        draft = null;

        if (wasSavedTask) void refreshFromBackend();
    }

    function renderDraft() {
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

    // ===================== TAGS (US13) =====================
    function renderTags() {
        if (!draft) return;
        const tags = draft.tags ?? [];

        tagEmpty.hidden = tags.length > 0;
        tagChips.innerHTML = tags
            .map((t) => `
      <span class="tag-chip" data-tag-id="${t.id}">
        ${escapeHtml(t.name)}
        <button type="button" aria-label="Remove ${escapeHtml(t.name)}" data-remove-tag="${t.id}">✕</button>
      </span>`)
            .join("");
    }

    async function addTagToDraft() {
        if (!draft) return;

        const name = tagInput.value.trim().toLowerCase();
        if (!name) return;

        if ((draft.tags ?? []).some((t) => t.name.toLowerCase() === name)) {
            tagInput.value = "";
            return;
        }

        if (!draft.id) {
            showToast("Save the task first, then add tags.");
            return;
        }

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
            showToast("Could not add tag");
        }
    }

    async function removeTagFromDraft(tagId) {
        if (!draft || !draft.id) return;
        try {
            const res = await fetch(`${TAGS_API}/task/${Number(draft.id)}/${tagId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(await res.text());

            const updated = await res.json();
            draft.tags = Array.isArray(updated.tags) ? updated.tags : [];
            renderTags();
        } catch (err) {
            console.error("Remove tag failed:", err);
            showToast("Could not remove tag");
        }
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
        draft.progress = Math.max(0, Math.min(100, Number(progressInput.value) || 0));

        const isNew = draft.id === "";
        const ok = isNew ? (await apiCreate(draft)) !== null : await apiUpdate(draft);
        if (!ok) return;

        closeModal();
        await refreshFromBackend();
        showToast(isNew ? "Task created" : "Changes saved");
    }

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

    prioritySelect.addEventListener("change", () => {
        if (!draft) return;
        draft.priority = prioritySelect.value;
        renderDraft();
    });

    requireElement("priorityClearBtn").addEventListener("click", () => {
        if (!draft) return;
        draft.priority = "";
        prioritySelect.value = "";
        renderDraft();
    });

    function syncProgress(value) {
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

    addTagBtn.addEventListener("click", () => {
        void addTagToDraft();
    });

    tagInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            void addTagToDraft();
        }
    });

    tagChips.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-remove-tag]");
        if (!btn) return;
        void removeTagFromDraft(Number(btn.dataset["removeTag"]));
    });

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

        if (logTimeOverlay.classList.contains("visible")) {
            closeLogTimeModal();
            return;
        }

        setTeamFilterOpen(false);
        setTagFilterOpen(false);
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

    // ===================== START / END SPRINT (US23) =====================
    const startSprintBtn = document.getElementById("startSprintBtn");
    let currentSprintStatus = null;
    let currentSprintNumericId = null;

    async function fetchSprintStatus(tabId) {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Failed to load sprint:", err);
            return null;
        }
    }

    function renderSprintButton(status) {
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

    async function refreshSprintButton() {
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

            const updated = await res.json();
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
    async function init() {
        await loadEmployeesFromBackend();
        highlightSavedSprintTab();
        initSprintTabs();
        renderTeamFilter();
        renderTagFilter();
        await refreshSprintButton();
        await refreshFromBackend();
        renderTagFilter();
        await refreshSprintHours();
    }
    void init();
})();