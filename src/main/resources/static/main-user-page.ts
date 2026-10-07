// main-user-page.ts
// Compile with:
//   npx tsc main-user-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * User Board Page — Symph Web Application
 * Provides a read-only Kanban board for employees. Loads tasks scoped to the
 * current sprint, handles sprint tab switching, live search filtering, and
 * displays a read-only task modal. The signed-in user's name and initials
 * are pulled from sessionStorage so the header reflects the real person.
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
    };

    type Sprint = { id: number; name: string };

    const SPRINT_TAB_NAMES: Record<string, string> = {
        "1": "Sprint 1",
        "2": "Sprint 2",
        "3": "Sprint 3",
    };

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

    /** Returns up to two uppercase initials from a full name. */
    function initials(name: string): string {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
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

    const savedSprintId = sessionStorage.getItem("currentSprintId");
    let currentSprintId = savedSprintId && savedSprintId !== "" ? savedSprintId : "1";
    let currentSprintNumericId: number | null = null;

    const board = requireElement<HTMLElement>("board");
    const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;

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
    async function resolveCurrentSprintId(): Promise<number | null> {
        const name = SPRINT_TAB_NAMES[currentSprintId];
        if (!name) return null;
        try {
            const res = await fetch(`${SPRINTS_API}/latest?name=${encodeURIComponent(name)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const sprint = (await res.json()) as Sprint;
            return sprint?.id ?? null;
        } catch (err) {
            console.error("Failed to resolve sprint:", err);
            return null;
        }
    }

    // ===================== BACKEND SYNC =====================
    async function fetchTasks(): Promise<Task[]> {
        try {
            currentSprintNumericId = await resolveCurrentSprintId();

            if (currentSprintNumericId) {
                const res = await fetch(`${API_BASE}/sprint/${currentSprintNumericId}`);
                if (res.ok) {
                    const data = (await res.json()) as BackendTask[];
                    return data.map(mapTask);
                }
                console.warn(`Sprint ${currentSprintNumericId} fetch failed — falling back`);
            }

            const allRes = await fetch(API_BASE);
            if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`);
            const all = (await allRes.json()) as BackendTask[];

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

    function renderCard(task: Task): string {
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

    function renderBoard(): void {
        const term = searchTerm.toLowerCase();

        board.innerHTML = COLUMNS.map((column) => {
            const cards = tasks.filter((t) => {
                if (t.column !== column.id) return false;
                if (term && !t.title.toLowerCase().includes(term)) return false;
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

    // ===================== TASK MODAL (READ-ONLY) =====================
    const overlay = document.getElementById("taskModalOverlay");
    const modalColumn = document.getElementById("modalColumn") as HTMLSelectElement | null;
    const titleInput = document.getElementById("modalTitle") as HTMLInputElement | null;
    const descriptionBox = document.getElementById("modalDescription") as HTMLTextAreaElement | null;
    const summary = document.getElementById("modalSummary") as HTMLDivElement | null;
    const closeBtn = document.getElementById("modalCloseBtn") as HTMLButtonElement | null;
    const cancelBtn = document.getElementById("modalCancelBtn") as HTMLButtonElement | null;

    function openModal(task: Task): void {
        if (!overlay) return;
        if (modalColumn) modalColumn.value = task.column;
        if (titleInput) titleInput.value = task.title;
        if (descriptionBox) descriptionBox.value = task.description || "No description";

        const column = COLUMNS.find((c) => c.id === task.column);
        if (summary) {
            const chips: string[] = [
                `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
                `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
                `<span class="summary-chip"><b>Progress</b> ${Math.max(0, Math.min(100, Number(task.progress) || 0))}%</span>`,
                `<span class="summary-chip"><b>Column</b> ${column ? column.name : ""}</span>`,
            ];
            summary.innerHTML = chips.join("");
        }

        overlay.classList.add("visible");
    }

    function closeModal(): void {
        overlay?.classList.remove("visible");
    }

    if (overlay && closeBtn && cancelBtn) {
        closeBtn.addEventListener("click", closeModal);
        cancelBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeModal();
        });
    }

    // ===================== BOARD CLICK =====================
    board.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
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
                    tasks = await fetchTasks();
                    renderBoard();
                })();
            });
        });
    }

    // ===================== INIT =====================
    async function init(): Promise<void> {
        initSprintTabs();
        tasks = await fetchTasks();
        renderBoard();
    }
    void init();
})();