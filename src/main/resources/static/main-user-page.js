/**
 * User Board Page — Symph Web Application
 * Kanban board for employees. Includes search, tag filter, sprint tabs,
 * a read-only task modal, a Log Time modal (US24), a "My Logs" modal
 * (opened from the ⋯ menu in the project header), an account menu on the
 * avatar with Log out, a team badge in the project header that is
 * auto-detected from sessionStorage, and a logout confirmation modal.
 *
 * Only one of the three menus (tag filter / account / ⋯) can be open at
 * a time — clicking one closes the others.
 *
 * US07 + US08: teammates share their team's board. A task is visible if
 * it is assigned to my team by name, or to any user who is on my team.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

// ===================== EMPLOYEE GUARD =====================
window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("loggedIn") !== "true") {
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

    const SPRINT_TAB_NAMES = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };

    const TAG_FILTER_ALL = "all";

    // ===================== HELPERS =====================
    function requireElement(id) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Missing element: ${id}`);
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

    function formatDateBadge(isoDate) {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    function formatDateShort(iso) {
        if (!iso) return "—";
        const d = new Date(`${iso}T00:00:00`);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function initials(name) {
        return String(name)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }

    const COLUMNS = [
        { id: "PRODUCT_BACKLOG", name: "Product Backlog" },
        { id: "TO_DO", name: "To Do" },
        { id: "IN_PROGRESS", name: "In Progress" },
        { id: "IN_REVIEW", name: "In Review" },
        { id: "COMPLETED", name: "Completed" },
    ];

    // ===================== STATE =====================
    let tasks = [];
    let searchTerm = "";
    let currentTagName = TAG_FILTER_ALL;

    const savedSprintId = sessionStorage.getItem("currentSprintId");
    let currentSprintId = savedSprintId && savedSprintId !== "" ? savedSprintId : "1";
    let currentSprintNumericId = null;

    let teammateIds = new Set();
    let userIdToName = new Map();

    const board = requireElement("board");
    const searchInput = document.getElementById("searchInput");
    const emptyState = document.getElementById("boardEmptyState");

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

    // ===================== ROLE BADGE (project header) =====================
    // Auto-detect the employee's team from sessionStorage. Falls back to
    // "Employee" if the user has no team assigned.
    const roleBadgeEl = document.getElementById("roleBadge");
    if (roleBadgeEl) {
        roleBadgeEl.textContent = storedTeam || "Employee";
    }

    // ===================== MENUS (only one open at a time) =====================
    const profileMenuBtn = document.getElementById("profileMenuBtn");
    const profileMenu = document.getElementById("profileMenu");

    const headerMenuBtn = document.getElementById("headerMenuBtn");
    const headerMenu = document.getElementById("headerMenu");

    const tagFilterBtn = document.getElementById("tagFilterBtn");
    const tagFilterMenu = document.getElementById("tagFilterMenu");
    const tagFilterLabel = document.getElementById("tagFilterLabel");

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

    function closeAllMenus() {
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
    }

    profileMenuBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !profileMenu.classList.contains("visible");
        setHeaderMenuOpen(false);
        setTagFilterOpen(false);
        setProfileMenuOpen(willOpen);
    });

    headerMenuBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !headerMenu.classList.contains("visible");
        setProfileMenuOpen(false);
        setTagFilterOpen(false);
        setHeaderMenuOpen(willOpen);
    });

    tagFilterBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTagFilter();
        const willOpen = !tagFilterMenu.classList.contains("visible");
        setProfileMenuOpen(false);
        setHeaderMenuOpen(false);
        setTagFilterOpen(willOpen);
    });

    // Click anywhere else closes all menus
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (profileMenu?.classList.contains("visible")
            && !profileMenu.contains(target)
            && !profileMenuBtn?.contains(target)) {
            setProfileMenuOpen(false);
        }
        if (headerMenu?.classList.contains("visible")
            && !headerMenu.contains(target)
            && !headerMenuBtn?.contains(target)) {
            setHeaderMenuOpen(false);
        }
        if (tagFilterMenu?.classList.contains("visible")
            && !tagFilterMenu.contains(target)
            && !tagFilterBtn?.contains(target)) {
            setTagFilterOpen(false);
        }
    });

    // Esc closes all menus
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAllMenus();
    });

    // ===================== LOGOUT =====================
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutOverlay = document.getElementById("logoutOverlay");
    const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

    // Click "Log out" in the account menu → open the confirmation modal
    logoutBtn?.addEventListener("click", () => {
        closeAllMenus();
        logoutOverlay?.classList.add("visible");
    });

    // Cancel → close the modal, stay on the page
    cancelLogoutBtn?.addEventListener("click", () => {
        logoutOverlay?.classList.remove("visible");
    });

    // Confirm → clear session and go to login
    confirmLogoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index-login-page.html";
    });

    // Click outside the modal → close it (same as Cancel)
    logoutOverlay?.addEventListener("click", (e) => {
        if (e.target === logoutOverlay) {
            logoutOverlay.classList.remove("visible");
        }
    });

    // ===================== SPRINT RESOLUTION =====================
    async function resolveCurrentSprintId() {
        const name = SPRINT_TAB_NAMES[currentSprintId];
        if (!name) return null;

        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const sprint = await res.json();
            return sprint?.id ?? null;
        } catch (err) {
            console.error("Failed to resolve sprint:", err);
            return null;
        }
    }

    // ===================== US07 + US08: TEAMMATES =====================
    async function loadTeammates() {
        teammateIds = new Set();
        userIdToName = new Map();

        const myTeam = sessionStorage.getItem("team") || "";
        const myId = sessionStorage.getItem("userId") || "";
        if (myId) teammateIds.add(myId);

        if (!myTeam) return;

        try {
            const res = await fetch(USERS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users = await res.json();
            users.forEach((u) => {
                const id = String(u.id);
                userIdToName.set(id, u.name || `User ${id}`);
                const teamName = (u.team && u.team.name) ? u.team.name : "";
                if (teamName === myTeam) {
                    teammateIds.add(id);
                }
            });
        } catch (err) {
            console.error("Failed to load teammates:", err);
        }
    }

    function taskVisibleToCurrentEmployee(task) {
        const myTeam = sessionStorage.getItem("team") || "";
        if (!myTeam) return false;

        if (task.assignedTeams) {
            const teams = String(task.assignedTeams)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (teams.includes(myTeam)) return true;
        }

        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (ids.some((id) => teammateIds.has(id))) return true;
        }

        return false;
    }

    function assigneeLabel(task) {
        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const names = ids
                .map((id) => userIdToName.get(id))
                .filter(Boolean);
            if (names.length > 0) return names.join(", ");
        }
        if (task.assignedTeams) {
            const teams = String(task.assignedTeams)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (teams.length > 0) return teams.join(", ");
        }
        return "Unassigned";
    }

    // ===================== BACKEND SYNC =====================
    async function fetchTasks() {
        try {
            currentSprintNumericId = await resolveCurrentSprintId();

            let raw = [];

            if (currentSprintNumericId) {
                const res = await fetch(`${API_BASE}/sprint/${currentSprintNumericId}`);
                if (res.ok) {
                    raw = await res.json();
                } else {
                    console.warn(`Sprint ${currentSprintNumericId} fetch failed — falling back`);
                    const allRes = await fetch(API_BASE);
                    if (allRes.ok) raw = await allRes.json();
                }
            } else {
                const allRes = await fetch(API_BASE);
                if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`);
                const all = await allRes.json();
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

    function mapTask(t) {
        return {
            id: String(t.id),
            column: t.status ?? "PRODUCT_BACKLOG",
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

    function renderPriorityBadge(task) {
        if (!task.priority) return "";
        return `<span class="priority-badge priority-${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>`;
    }

    function renderProgressBar(task) {
        const pct = Math.max(0, Math.min(100, Number(task.progress) || 0));
        if (pct <= 0) return "";
        return `
      <div class="progress-wrap" title="Progress: ${pct}%">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-text">${pct}%</span>
      </div>`;
    }

    function renderAssignees(task) {
        if (task.assignedTeams) {
            const teams = String(task.assignedTeams)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (teams.length > 0) {
                return teams
                    .map((name) => `<span class="team-chip">${escapeHtml(name)}</span>`)
                    .join(" ");
            }
        }
        if (task.assignedEmployeeIds) {
            const ids = String(task.assignedEmployeeIds)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            return ids
                .map((id) => {
                    const name = userIdToName.get(id) || `User ${id}`;
                    return `<div class="avatar avatar-small avatar-purple" title="${escapeHtml(name)}">${escapeHtml(initials(name))}</div>`;
                })
                .join("");
        }
        return "";
    }

    function renderCard(task) {
        const priorityBadge = renderPriorityBadge(task);
        const badges = [
            priorityBadge,
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${task.estimateHours}h</span>` : "",
        ].join("");
        const tagBadges = (task.tags ?? [])
            .map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`)
            .join("");

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

    function renderBoard() {
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

        if (emptyState) {
            emptyState.style.display = tasks.length === 0 ? "block" : "none";
        }
    }

    // ===================== SEARCH =====================
    searchInput?.addEventListener("input", (event) => {
        searchTerm = event.target.value.trim();
        renderBoard();
    });

    searchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            searchInput.value = "";
            searchTerm = "";
            renderBoard();
        }
    });

    // ===================== TAG FILTER RENDER =====================
    function availableTagNames() {
        const names = new Set();
        tasks.forEach((t) => (t.tags ?? []).forEach((tag) => names.add(tag.name)));
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }

    function renderTagFilter() {
        if (!tagFilterMenu) return;

        const names = availableTagNames();

        const countFor = (name) =>
            tasks.filter((t) =>
                (t.tags ?? []).some((tag) => tag.name.toLowerCase() === name.toLowerCase())
            ).length;

        const header = `
            <button type="button" class="filter-option${currentTagName === TAG_FILTER_ALL ? " active" : ""}" data-tag="${TAG_FILTER_ALL}" role="menuitemradio" aria-checked="${currentTagName === TAG_FILTER_ALL}">
                <span>All tags</span><span class="filter-count">${tasks.length}</span>
            </button>`;

        const rows = names.length === 0
            ? `<p class="employee-empty">No tags yet.</p>`
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

        if (tagFilterLabel) {
            tagFilterLabel.textContent =
                currentTagName === TAG_FILTER_ALL ? "All tags" : currentTagName;
        }
        tagFilterBtn?.classList.toggle("filtered", currentTagName !== TAG_FILTER_ALL);
    }

    tagFilterMenu?.addEventListener("click", (event) => {
        event.stopPropagation();
        const tagBtn = event.target.closest("[data-tag]");
        if (!tagBtn) return;
        currentTagName = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
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
            alert(`Logged ${payload.hours}h on this task`);
        } catch (err) {
            console.error("Log time failed:", err);
            logTimeErrorText.textContent =
                err instanceof Error ? err.message : "Could not save the time log.";
            logTimeError.hidden = false;
            logTimeSubmitBtn.disabled = false;
            logTimeSubmitBtn.textContent = "Save log";
        }
    });

    // ===================== MY LOGS MODAL =====================
    const myLogsBtn = document.getElementById("myLogsBtn");
    const myLogsOverlay = document.getElementById("myLogsOverlay");
    const closeMyLogsBtn = document.getElementById("closeMyLogsBtn");
    const myLogsBody = document.getElementById("myLogsBody");
    const myLogsTotal = document.getElementById("myLogsTotal");

    async function openMyLogs() {
        if (!myLogsOverlay) return;

        closeAllMenus();

        myLogsBody.innerHTML =
            `<tr><td colspan="5" class="muted">Loading…</td></tr>`;
        myLogsTotal.textContent = "";
        myLogsOverlay.classList.add("visible");

        await refreshMyLogs();
    }

    async function refreshMyLogs() {
        if (!myLogsBody) return;

        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            myLogsBody.innerHTML =
                `<tr><td colspan="5" class="muted">You must be signed in.</td></tr>`;
            return;
        }

        try {
            const res = await fetch(`${TIMELOGS_API}/user/${userId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const logs = await res.json();

            if (!Array.isArray(logs) || logs.length === 0) {
                myLogsBody.innerHTML =
                    `<tr><td colspan="5" class="muted">You haven't logged any time yet.</td></tr>`;
                myLogsTotal.textContent = "Total: 0h across 0 log(s)";
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

            myLogsTotal.textContent =
                `Total: ${total.toFixed(1)}h across ${logs.length} log(s)`;
        } catch (err) {
            console.error("Failed to load my logs:", err);
            myLogsBody.innerHTML =
                `<tr><td colspan="5" class="muted">Could not load your logs.</td></tr>`;
        }
    }

    async function deleteMyLog(logId) {
        const confirmed = window.confirm(
            "Delete this time log? This cannot be undone."
        );
        if (!confirmed) return;

        try {
            const role = sessionStorage.getItem("role") || "";
            const res = await fetch(`${TIMELOGS_API}/${logId}`, {
                method: "DELETE",
                headers: { "X-Role": role },
            });

            if (res.status === 403) {
                alert("You are not allowed to delete this log.");
                return;
            }
            if (res.status === 404) {
                alert("That log no longer exists.");
            } else if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            await refreshMyLogs();
        } catch (err) {
            console.error("Delete log failed:", err);
            alert("Could not delete the log. Please try again.");
        }
    }

    myLogsBody?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-delete-log]");
        if (!btn) return;
        const id = btn.dataset["deleteLog"];
        if (id) void deleteMyLog(id);
    });

    function closeMyLogs() {
        myLogsOverlay?.classList.remove("visible");
    }

    myLogsBtn?.addEventListener("click", () => { void openMyLogs(); });
    closeMyLogsBtn?.addEventListener("click", closeMyLogs);
    myLogsOverlay?.addEventListener("click", (e) => {
        if (e.target === myLogsOverlay) closeMyLogs();
    });

    // ===================== TASK MODAL (READ-ONLY) =====================
    const overlay = document.getElementById("taskModalOverlay");
    const modalColumn = document.getElementById("modalColumn");
    const titleInput = document.getElementById("modalTitle");
    const descriptionBox = document.getElementById("modalDescription");
    const summary = document.getElementById("modalSummary");
    const closeBtn = document.getElementById("modalCloseBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    function openModal(task) {
        if (!overlay) return;
        if (modalColumn) modalColumn.value = task.column;
        if (titleInput) titleInput.value = task.title;
        if (descriptionBox) descriptionBox.value = task.description || "";

        const column = COLUMNS.find((c) => c.id === task.column);
        if (summary) {
            const priorityLabel = task.priority ? escapeHtml(task.priority) : "None";
            const chips = [
                `<span class="summary-chip"><b>Assigned to</b> ${escapeHtml(assigneeLabel(task))}</span>`,
                `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
                `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
                `<span class="summary-chip"><b>Priority</b> ${priorityLabel}</span>`,
                `<span class="summary-chip"><b>Progress</b> ${Math.max(0, Math.min(100, Number(task.progress) || 0))}%</span>`,
                `<span class="summary-chip"><b>Column</b> ${column ? column.name : ""}</span>`,
            ];
            summary.innerHTML = chips.join("");
        }

        overlay.classList.add("visible");
    }

    function closeModal() {
        overlay?.classList.remove("visible");
    }

    if (overlay && closeBtn && cancelBtn) {
        closeBtn.addEventListener("click", closeModal);
        cancelBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                if (logoutOverlay?.classList.contains("visible")) {
                    logoutOverlay.classList.remove("visible");
                    return;
                }
                if (logTimeOverlay.classList.contains("visible")) {
                    closeLogTimeModal();
                    return;
                }
                if (myLogsOverlay?.classList.contains("visible")) {
                    closeMyLogs();
                    return;
                }
                if (tagFilterMenu?.classList.contains("visible")) {
                    setTagFilterOpen(false);
                    return;
                }
                closeModal();
            }
        });
    }

    // ===================== BOARD CLICK =====================
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

        const card = target.closest("[data-task]");
        if (!card) return;
        const id = card.dataset["task"];
        const task = tasks.find((t) => t.id === id);
        if (task) openModal(task);
    });

    // ===================== SPRINT TABS =====================
    function initSprintTabs() {
        const tabs = document.querySelectorAll(".sprint-tab");

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
    async function init() {
        initSprintTabs();
        await loadTeammates();
        tasks = await fetchTasks();
        renderTagFilter();
        renderBoard();
    }
    void init();
})();