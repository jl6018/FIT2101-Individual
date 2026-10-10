/**
 * Admin Board Page — Symph Web Application
 * Compiled output of main-admin-page.ts — do not hand-edit.
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
    // ===================== HELPERS =====================
    function avatarColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
    }

    // ===================== SHOW CURRENT USER =====================
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

    // ===================== MENUS =====================
    const profileMenuBtn = document.getElementById("profileMenuBtn");
    const profileMenu = document.getElementById("profileMenu");
    const headerMenuBtn = document.getElementById("headerMenuBtn");
    const headerMenu = document.getElementById("headerMenu");
    const tagFilterBtn = document.getElementById("tagFilterBtn");
    const tagFilterMenu = document.getElementById("tagFilterMenu");
    const teamFilterBtn = document.getElementById("teamFilterBtn");
    const teamFilterMenu = document.getElementById("teamFilterMenu");
    const notifMenu = document.getElementById("notifMenu");
    const notifBellBtn = document.getElementById("notifBellBtn");

    function setProfileMenuOpen(open) {
        if (!profileMenu || !profileMenuBtn) return;
        profileMenu.classList.toggle("visible", open);
        profileMenuBtn.setAttribute("aria-expanded", String(open));
    }
    function setHeaderMenuOpen(open) {
        if (!headerMenu || !headerMenuBtn) return;
        headerMenu.classList.toggle("visible", open);
        headerMenuBtn.setAttribute("aria-expanded", String(open));
    }
    function setTagFilterOpen(open) {
        if (!tagFilterMenu || !tagFilterBtn) return;
        tagFilterMenu.classList.toggle("visible", open);
        tagFilterBtn.setAttribute("aria-expanded", String(open));
    }
    function setTeamFilterOpen(open) {
        if (!teamFilterMenu || !teamFilterBtn) return;
        teamFilterMenu.classList.toggle("visible", open);
        teamFilterBtn.setAttribute("aria-expanded", String(open));
    }
    function closeAllMenus() {
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
        setTeamFilterOpen(false);
        if (notifMenu && notifBellBtn) {
            notifMenu.classList.remove("visible");
            notifBellBtn.setAttribute("aria-expanded", "false");
        }
    }

    profileMenuBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !profileMenu.classList.contains("visible");
        closeAllMenus();
        setProfileMenuOpen(willOpen);
    });

    headerMenuBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !headerMenu.classList.contains("visible");
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

    document.addEventListener("click", (event) => {
        const t = event.target;
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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAllMenus();
    });

    // ===================== CONFIG =====================
    const API_BASE = "http://localhost:8080/api/tasks";
    const USERS_API = "http://localhost:8080/api/users";
    const SPRINTS_API = "http://localhost:8080/api/sprints";
    const TAGS_API = "http://localhost:8080/api/tags";
    const TIMELOGS_API = "http://localhost:8080/api/timelogs";
    const RECENT_COMMENTS_API = "http://localhost:8080/api/tasks/comments/recent?limit=20";

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
            id: "", sprintId, column, title: "", description: "",
            assignee: null, dueDate: "", estimateHours: 0, priority: "",
            position: 0, tags: [], progress: 0,
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
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
        return assignee.employeeIds.map(findEmployee).filter((e) => e !== undefined);
    }
    function teamsOfTask(task) {
        if (!task.assignee) return [];
        if (task.assignee.kind === "team") return [task.assignee.teamId];
        if (task.assignee.kind === "teams") return task.assignee.teamIds;
        return assignedEmployees(task.assignee).map((e) => e.team).filter(Boolean);
    }
    function assigneeLabel(assignee) {
        if (!assignee) return "Unassigned";
        if (assignee.kind === "team") return teamName(assignee.teamId) || "Team";
        if (assignee.kind === "teams") return assignee.teamIds.join(", ");
        const names = assignedEmployees(assignee).map((e) => e.name);
        return names.length > 0 ? names.join(", ") : "Unassigned";
    }
    function formatEstimate(hours) { return `${hours}h`; }

    // ✅ Due date now shows the full year, e.g. "10 Oct 2026"
    function formatDateBadge(isoDate) {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function formatDateShort(iso) {
        if (!iso) return "—";
        const d = new Date(`${iso}T00:00:00`);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    function readSetting(key) {
        try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
    }
    function writeSetting(key, value) {
        try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    }

    const SPRINT_KEY = "symph.currentSprint";
    function readSprintSetting() { return readSetting(SPRINT_KEY) || "1"; }
    function writeSprintSetting(sprintId) { writeSetting(SPRINT_KEY, sprintId); }

    // ===================== STATE =====================
    let tasks = [];
    let currentSprintId = readSprintSetting();
    let currentSprintBackendId = null;
    let currentTeamId = "all";
    let currentTagName = TAG_FILTER_ALL;
    let sortByTag = false;
    let searchTerm = "";

    const board = requireElement("board");

    function assigneeToBackendPayload(assignee) {
        if (!assignee) return { assignedTeams: null, assignedEmployeeIds: null };
        if (assignee.kind === "team") return { assignedTeams: assignee.teamId, assignedEmployeeIds: null };
        if (assignee.kind === "teams") return { assignedTeams: assignee.teamIds.join(","), assignedEmployeeIds: null };
        return { assignedTeams: null, assignedEmployeeIds: assignee.employeeIds.join(",") };
    }

    function parseAssignee(t) {
        if (t.assignedEmployeeIds) {
            const ids = String(t.assignedEmployeeIds).split(",").map((s) => s.trim()).filter(Boolean);
            if (ids.length > 0) return { kind: "employees", employeeIds: ids };
        }
        if (t.assignedTeams) {
            const names = String(t.assignedTeams).split(",").map((s) => s.trim()).filter(Boolean);
            if (names.length === 1) return { kind: "team", teamId: names[0] };
            if (names.length > 1) return { kind: "teams", teamIds: names };
        }
        return null;
    }

    // ===================== SPRINT RESOLUTION =====================
    async function resolveSprintBackendId(tabId) {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text) return null;
            const sprint = JSON.parse(text);
            return sprint?.id != null ? String(sprint.id) : null;
        } catch (err) {
            console.error("Failed to resolve sprint backend id:", err);
            return null;
        }
    }

    // ===================== CUSTOM MODALS =====================
    function showOverlay(id) { const el = document.getElementById(id); if (el) el.classList.add("visible"); }
    function hideOverlay(id) { const el = document.getElementById(id); if (el) el.classList.remove("visible"); }

    function showNoSprintModal() { showOverlay("noSprintOverlay"); }
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
        if (confirmResolver) { confirmResolver(result); confirmResolver = null; }
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

    shareBtn?.addEventListener("click", () => {
        closeAllMenus();
        inviteOverlay?.classList.add("visible");
    });
    closeInviteBtn?.addEventListener("click", () => inviteOverlay?.classList.remove("visible"));
    inviteOverlay?.addEventListener("click", (e) => {
        if (e.target === inviteOverlay) inviteOverlay.classList.remove("visible");
    });

    inviteForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = ownerEmailInput?.value.trim();
        if (!email) { showToast("Please enter an email address."); return; }
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
            return data.map((t) => ({
                id: String(t.id),
                sprintId: t.sprint?.id != null ? String(t.sprint.id) : "",
                column: t.status ?? "PRODUCT_BACKLOG",
                title: t.name,
                description: t.description ?? "",
                assignee: parseAssignee(t),
                dueDate: t.dueDate ?? "",
                estimateHours: t.estimateHours ?? 0,
                priority: t.priority ?? "",
                position: t.position ?? 0,
                tags: Array.isArray(t.tags) ? t.tags : [],
                progress: typeof t.progress === "number" ? t.progress : 0,
            }));
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
                    sprint: currentSprintBackendId ? { id: Number(currentSprintBackendId) } : null,
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

    async function apiDelete(id) {
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

    // ===================== RENDER =====================
    function visibleTasks() {
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

    function renderAssignee(task) {
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

    function renderBoard() {
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
            if (!currentSprintBackendId) {
                showAlertModal(
                    "No sprint on this tab",
                    "Create a sprint on this tab first in Sprint Planning, then you can add cards."
                );
                return;
            }
            const draftTask = blankTask(currentSprintId, addBtn.dataset["add"]);
            if (currentTeamId !== "all") draftTask.assignee = { kind: "team", teamId: currentTeamId };
            openModal(draftTask);
        }
    });

    // ===================== LOGGED HOURS PANEL =====================
    const loggedHoursBody = document.getElementById("loggedHoursBody");
    const loggedHoursTotal = document.getElementById("loggedHoursTotal");
    const loggedHoursRangeFilter = document.getElementById("loggedHoursRangeFilter");
    const loggedHoursRefreshBtn = document.getElementById("loggedHoursRefreshBtn");
    const loggedHoursScope = document.getElementById("loggedHoursScope");

    async function loadLoggedHours() {
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
            let logs = await res.json();

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
                const cutoffIso = cutoff.toISOString().split("T")[0];
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
                loggedHoursTotal.textContent =
                    `Total: ${total.toFixed(1)}h across ${logs.length} log(s)`;
            }
        } catch (err) {
            console.error("Failed to load logged hours:", err);
            loggedHoursBody.innerHTML = `<tr><td colspan="5" class="muted">Could not load logs.</td></tr>`;
        }
    }

    loggedHoursRefreshBtn?.addEventListener("click", () => { void loadLoggedHours(); });
    loggedHoursRangeFilter?.addEventListener("change", () => { void loadLoggedHours(); });

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
        if (!moved) { draggedTaskId = null; clearDropMarkers(); return; }
        if (!moved.id || moved.id === "" || Number.isNaN(Number(moved.id))) {
            showAlertModal("Cannot move", "This task has no ID yet. Refresh the page and try again.");
            draggedTaskId = null; clearDropMarkers(); return;
        }
        const targetColumn = column.dataset["column"];
        const beforeId = cardAfterPointer(column, event.clientY)?.dataset["task"] ?? null;
        const siblings = tasks.filter((t) => t.column === targetColumn && t.id !== moved.id)
            .sort((a, b) => a.position - b.position);
        let newPosition;
        if (!beforeId) {
            const last = siblings[siblings.length - 1];
            newPosition = last ? last.position + 1 : 1;
        } else {
            const idx = siblings.findIndex((t) => t.id === beforeId);
            const prev = siblings[idx - 1];
            const next = siblings[idx];
            newPosition = prev ? (prev.position + next.position) / 2 : next.position - 1;
        }
        const from = COLUMNS.find((c) => c.id === moved.column)?.name ?? "";
        const wasCompleted = from === "Completed";
        moved.column = targetColumn;
        moved.position = newPosition;
        if (targetColumn === "COMPLETED" && (moved.progress ?? 0) < 100) moved.progress = 100;
        else if (wasCompleted && (targetColumn === "TO_DO" || targetColumn === "IN_PROGRESS" || targetColumn === "IN_REVIEW")) moved.progress = 0;
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
    const teamFilterLabel = requireElement("teamFilterLabel");

    function renderTeamFilter() {
        const inSprint = tasks.filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId);
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
    teamFilterBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTeamFilter();
        const willOpen = !teamFilterMenu.classList.contains("visible");
        closeAllMenus();
        setTeamFilterOpen(willOpen);
    });
    teamFilterMenu.addEventListener("click", (event) => {
        event.stopPropagation();
        const option = event.target.closest("[data-team]");
        if (!option) return;
        currentTeamId = option.dataset["team"] ?? "all";
        setTeamFilterOpen(false);
        renderTeamFilter();
        renderBoard();
        void loadLoggedHours();
    });

    // ===================== TAG FILTER =====================
    const tagFilterLabel = requireElement("tagFilterLabel");

    function availableTagNames() {
        const names = new Set();
        tasks
            .filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId)
            .forEach((t) => (t.tags ?? []).forEach((tag) => names.add(tag.name)));
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }

    function renderTagFilter() {
        if (!tagFilterMenu) return;
        const inSprint = tasks.filter((t) => !currentSprintBackendId || t.sprintId === currentSprintBackendId);
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
        tagFilterBtn.classList.toggle("filtered", sortByTag || currentTagName !== TAG_FILTER_ALL);
    }
    tagFilterBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTagFilter();
        const willOpen = !tagFilterMenu.classList.contains("visible");
        closeAllMenus();
        setTagFilterOpen(willOpen);
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
        currentTagName = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
    });

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

    const modalMoreBtn = document.getElementById("modalMoreBtn");
    const modalMoreMenu = document.getElementById("modalMoreMenu");
    const modalCommentsBtn = document.getElementById("modalCommentsBtn");

    let draft = null;
    let assignKind = "team";

    function setModalMoreOpen(open) {
        if (!modalMoreMenu || !modalMoreBtn) return;
        modalMoreMenu.classList.toggle("visible", open);
        modalMoreBtn.setAttribute("aria-expanded", String(open));
    }

    modalMoreBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        setModalMoreOpen(!modalMoreMenu.classList.contains("visible"));
    });

    modalCommentsBtn?.addEventListener("click", () => {
        setModalMoreOpen(false);
        void openCommentsModal();
    });

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
        setModalMoreOpen(false);
        overlay.classList.add("visible");
        titleInput.focus();
    }

    function closeModal() {
        overlay.classList.remove("visible");
        closePopovers();
        setModalMoreOpen(false);
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

    function renderTags() {
        if (!draft) return;
        const tags = draft.tags ?? [];
        tagEmpty.hidden = tags.length > 0;
        tagChips.innerHTML = tags.map((t) => `
      <span class="tag-chip" data-tag-id="${t.id}">
        ${escapeHtml(t.name)}
        <button type="button" aria-label="Remove ${escapeHtml(t.name)}" data-remove-tag="${t.id}">✕</button>
      </span>`).join("");
    }
    async function addTagToDraft() {
        if (!draft) return;
        const name = tagInput.value.trim().toLowerCase();
        if (!name) return;
        if ((draft.tags ?? []).some((t) => t.name.toLowerCase() === name)) { tagInput.value = ""; return; }
        if (!draft.id) { showToast("Save the task first, then add tags."); return; }
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
            const res = await fetch(`${TAGS_API}/task/${Number(draft.id)}/${tagId}`, { method: "DELETE" });
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
        setModalMoreOpen(false);
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
    overlay.addEventListener("click", (event) => {
        if (!modalMoreMenu?.classList.contains("visible")) return;
        if (modalMoreMenu.contains(event.target) || modalMoreBtn?.contains(event.target)) return;
        setModalMoreOpen(false);
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

    addTagBtn.addEventListener("click", () => { void addTagToDraft(); });
    tagInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); void addTagToDraft(); }
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
        closeAllMenus();
        if (!overlay.classList.contains("visible")) return;
        if (overlay.querySelector(".popover.visible")) closePopovers();
        else if (modalMoreMenu?.classList.contains("visible")) setModalMoreOpen(false);
        else closeModal();
    });

    // ===================== COMMENTS MODAL =====================
    const commentsOverlay = document.getElementById("commentsOverlay");
    const closeCommentsBtn = document.getElementById("closeCommentsBtn");
    const commentsTitle = document.getElementById("commentsTitle");
    const commentsSubtitle = document.getElementById("commentsSubtitle");
    const commentsList = document.getElementById("commentsList");
    const newCommentText = document.getElementById("newCommentText");
    const commentsCharCount = document.getElementById("commentsCharCount");
    const sendCommentBtn = document.getElementById("sendCommentBtn");

    let commentsTaskId = null;

    function formatCommentTime(iso) {
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

    function renderCommentList(comments) {
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

    async function loadComments(taskId) {
        commentsList.innerHTML = `<p class="comments-empty">Loading…</p>`;
        try {
            const res = await fetch(`${API_BASE}/${taskId}/comments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const comments = await res.json();
            renderCommentList(comments);
        } catch (err) {
            console.error("Failed to load comments:", err);
            commentsList.innerHTML = `<p class="comments-empty">Could not load comments.</p>`;
        }
    }

    async function openCommentsModal() {
        if (!draft || !draft.id) {
            showToast("Save the task first, then add comments.");
            return;
        }
        commentsTaskId = draft.id;
        commentsTitle.textContent = "Comments";
        commentsSubtitle.textContent = `On "${draft.title}"`;
        newCommentText.value = "";
        updateCommentsCharCount();
        commentsOverlay.classList.add("visible");
        await loadComments(draft.id);
        newCommentText.focus();
    }

    function closeCommentsModal() {
        commentsOverlay.classList.remove("visible");
        commentsTaskId = null;
    }

    function updateCommentsCharCount() {
        if (commentsCharCount && newCommentText) {
            commentsCharCount.textContent = `${newCommentText.value.length} / 2000`;
        }
    }

    closeCommentsBtn?.addEventListener("click", closeCommentsModal);
    commentsOverlay?.addEventListener("click", (e) => {
        if (e.target === commentsOverlay) closeCommentsModal();
    });
    newCommentText?.addEventListener("input", updateCommentsCharCount);

    async function sendComment() {
        if (!commentsTaskId) return;
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
    newCommentText?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void sendComment();
        }
    });

    commentsList?.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-delete-comment]");
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

    // ===================== TOAST =====================
    const toast = requireElement("toast");
    let toastTimeoutId;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("visible");
        if (toastTimeoutId !== undefined) window.clearTimeout(toastTimeoutId);
        toastTimeoutId = window.setTimeout(() => toast.classList.remove("visible"), 3000);
    }

    // ===================== NOTIFICATION BELL =====================
    const NOTIF_SEEN_KEY = "symph.lastSeenCommentId";
    const notifBadge = document.getElementById("notifBadge");
    const notifMenuList = document.getElementById("notifMenuList");

    let notifPollTimer = null;

    function getLastSeenCommentId() {
        try {
            const v = window.localStorage.getItem(NOTIF_SEEN_KEY);
            return v ? Number(v) : 0;
        } catch { return 0; }
    }
    function setLastSeenCommentId(id) {
        try { window.localStorage.setItem(NOTIF_SEEN_KEY, String(id)); } catch { /* ignore */ }
    }

    function formatNotifTime(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const now = new Date();
        const diffSec = Math.floor((now - d) / 1000);
        if (diffSec < 60) return "Just now";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hour(s) ago`;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    function setNotifOpen(open) {
        if (!notifMenu || !notifBellBtn) return;
        notifMenu.classList.toggle("visible", open);
        notifBellBtn.setAttribute("aria-expanded", String(open));
    }

    function renderNotifications(comments) {
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

    async function loadNotifications() {
        if (!notifMenuList) return;
        try {
            const res = await fetch(RECENT_COMMENTS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const comments = await res.json();
            renderNotifications(comments);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        }
    }

    notifBellBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !notifMenu.classList.contains("visible");
        closeAllMenus();
        setNotifOpen(willOpen);

        if (willOpen) {
            void (async () => {
                try {
                    const res = await fetch(RECENT_COMMENTS_API);
                    if (res.ok) {
                        const comments = await res.json();
                        const myId = Number(sessionStorage.getItem("userId"));
                        const others = comments.filter(c => Number(c.authorId) !== myId);
                        if (others.length > 0) {
                            setLastSeenCommentId(others[0].id);
                        }
                        if (notifBadge) notifBadge.hidden = true;
                    }
                } catch { /* ignore */ }
            })();
        }
    });

    notifMenuList?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-notif-task]");
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

    function startNotifPolling() {
        if (notifPollTimer !== null) return;
        notifPollTimer = window.setInterval(() => {
            void loadNotifications();
        }, 30000);
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
        if (typed) { projectName = typed; writeSetting(PROJECT_NAME_KEY, projectName); }
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

    // ===================== START / END SPRINT =====================
    const startSprintBtn = document.getElementById("startSprintBtn");
    let currentSprintStatus = null;

    async function fetchSprintStatus(tabId) {
        const name = SPRINT_TAB_NAMES[tabId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text) return null;
            return JSON.parse(text);
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
            const updated = await res.json();
            currentSprintStatus = updated.status;
            renderSprintButton(currentSprintStatus);
            showToast(starting ? "Sprint started" : "Sprint completed");
        } catch (err) {
            console.error("Sprint action failed:", err);
            showAlertModal("Sprint update failed", `Failed to update sprint status (sprint ${numericId}).`);
            await refreshSprintButton();
        }
    });

    // ===================== INIT =====================
    async function init() {
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