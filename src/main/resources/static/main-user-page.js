/**
 * User Board Page — Symph Web Application
 * Provides a read-only Kanban board for employees. Loads tasks scoped to the
 * current sprint, handles sprint tab switching, live search filtering,
 * tag filtering, and displays a read-only task modal. The signed-in user's
 * name and initials are pulled from sessionStorage so the header reflects
 * the real person.
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

    /** Maps sprint tab IDs to the sprint names stored in the backend. */
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

    /** Returns up to two uppercase initials from a full name. */
    function initials(name) {
        return name
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

    // Store the resolved numeric sprint ID for the current tab, if any.
    let currentSprintNumericId = null;

    const board = requireElement("board");
    const searchInput = document.getElementById("searchInput");

    // ===================== SHOW CURRENT USER =====================
    const nameEl = document.getElementById("signedInName");
    const avatarEl = document.getElementById("userAvatar");

    const storedName = sessionStorage.getItem("name") || "";
    const storedRole = sessionStorage.getItem("role") || "";
    const storedTeam = sessionStorage.getItem("team") || "";

    if (nameEl) {
        if (storedRole === "ADMIN") {
            nameEl.textContent = storedName ? `${storedName} (Admin)` : "Admin";
        } else if (storedName && storedTeam) {
            nameEl.textContent = `${storedName} (${storedTeam})`;
        } else if (storedName) {
            nameEl.textContent = storedName;
        } else if (storedTeam) {
            nameEl.textContent = storedTeam;
        } else {
            nameEl.textContent = "Employee";
        }
    }

    if (avatarEl) {
        const label = initials(storedName) || (storedName ? storedName.charAt(0).toUpperCase() : "?");
        avatarEl.textContent = label;
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

    // ===================== BACKEND SYNC =====================
    async function fetchTasks() {
        try {
            currentSprintNumericId = await resolveCurrentSprintId();

            if (currentSprintNumericId) {
                const res = await fetch(`${API_BASE}/sprint/${currentSprintNumericId}`);
                if (res.ok) {
                    const data = await res.json();
                    return data.map(mapTask);
                }
                console.warn(`Sprint ${currentSprintNumericId} fetch failed — falling back`);
            }

            const allRes = await fetch(API_BASE);
            if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`);
            const all = await allRes.json();

            return all
                .filter((t) => {
                    const taskSprintId = t.sprint?.id ? String(t.sprint.id) : "";
                    return taskSprintId === "";
                })
                .map(mapTask);
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

        const footerHtml = badges || tagBadges
            ? `<div class="card-footer-row"><div class="card-badges">${badges}${tagBadges}</div></div>`
            : "";

        const progressHtml = renderProgressBar(task);

        return `
      <div class="card${footerHtml || progressHtml ? " card-detailed" : ""}" data-task="${escapeHtml(task.id)}" style="cursor: pointer;">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
        </div>
        ${progressHtml}
        ${footerHtml}
      </div>`;
    }

    /** Apply search + tag filter and paint the board. */
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

    // ===================== TAG FILTER =====================
    const tagFilterBtn = document.getElementById("tagFilterBtn");
    const tagFilterMenu = document.getElementById("tagFilterMenu");
    const tagFilterLabel = document.getElementById("tagFilterLabel");

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

    function setTagFilterOpen(open) {
        if (!tagFilterMenu || !tagFilterBtn) return;
        tagFilterMenu.classList.toggle("visible", open);
        tagFilterBtn.setAttribute("aria-expanded", String(open));
    }

    tagFilterBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        renderTagFilter();
        setTagFilterOpen(!tagFilterMenu.classList.contains("visible"));
    });

    tagFilterMenu?.addEventListener("click", (event) => {
        event.stopPropagation();
        const tagBtn = event.target.closest("[data-tag]");
        if (!tagBtn) return;
        currentTagName = tagBtn.dataset["tag"] ?? TAG_FILTER_ALL;
        setTagFilterOpen(false);
        renderTagFilter();
        renderBoard();
    });

    document.addEventListener("click", () => setTagFilterOpen(false));

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
        if (descriptionBox) descriptionBox.value = task.description || "No description";

        const column = COLUMNS.find((c) => c.id === task.column);
        if (summary) {
            const chips = [
                `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
                `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
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
                    tasks = await fetchTasks();
                    // Reset the tag filter so a stale tag doesn't hide everything
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
        tasks = await fetchTasks();
        renderTagFilter();
        renderBoard();
    }
    void init();
})();