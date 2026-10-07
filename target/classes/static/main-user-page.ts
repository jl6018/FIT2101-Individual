// main-user-page.ts
// Compile with:
//   npx tsc main-user-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * User Board Page — Symph Web Application
 * Provides a read-only Kanban board for employees. Loads tasks scoped to the
 * employee's team or sprint, handles sprint tab switching, and displays a
 * read-only task modal.
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

    // ===================== TYPES =====================
    /** Identifiers for the five board columns. */
    type ColumnId = "PRODUCT_BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

    /** Front-end representation of a task on the board. */
    type Task = {
        id: string;
        column: ColumnId;
        title: string;
        description: string;
        dueDate: string;
        estimateHours: number;
    };

    /** Shape of a task as returned by the backend API. */
    type BackendTask = {
        id: number;
        name: string;
        description?: string | null;
        status?: ColumnId | null;
        dueDate?: string | null;
        estimateHours?: number | null;
        sprint?: { id: number } | null;
    };

    // ===================== HELPERS =====================
    /**
     * Retrieves a DOM element by its ID and throws if not found.
     *
     * @param id The ID of the element to retrieve
     * @returns  The element cast to the expected type
     * @throws Error if no element with the given ID exists
     */
    function requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Missing element: ${id}`);
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
     * Formats an ISO date string into a short badge label.
     *
     * @param isoDate The ISO date string (YYYY-MM-DD)
     * @returns        A string such as "5 Sep"
     */
    function formatDateBadge(isoDate: string): string {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

    const savedSprintId = sessionStorage.getItem("currentSprintId");
    let currentSprintId = savedSprintId && savedSprintId !== "" ? savedSprintId : "1";

    const board = requireElement<HTMLElement>("board");

    // ✅ Show name + team in the navbar
    const nameEl = document.getElementById("signedInName");
    if (nameEl) {
        const name = sessionStorage.getItem("name");
        const role = sessionStorage.getItem("role");
        const team = sessionStorage.getItem("team");

        if (role === "ADMIN") {
            nameEl.textContent = name ? `${name} (Admin)` : "Admin";
        } else if (name && team) {
            nameEl.textContent = `${name} (${team})`;
        } else if (name) {
            nameEl.textContent = name;
        } else if (team) {
            nameEl.textContent = team;
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

    // ===================== BACKEND SYNC =====================
    /**
     * Fetches tasks scoped to the employee's team or current sprint.
     *
     * @returns A promise resolving to an array of Tasks
     */
    async function fetchTasks(): Promise<Task[]> {
        try {
            const team = sessionStorage.getItem("team") || "";

            const url = team
                ? `${API_BASE}/team/${encodeURIComponent(team)}`
                : `${API_BASE}/sprint/${currentSprintId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: BackendTask[] = await res.json();

            // ✅ Keep tasks that match the current sprint OR have no sprint at all
            const scoped = team
                ? data.filter((t) => {
                      const taskSprintId = t.sprint?.id ? String(t.sprint.id) : "";
                      return taskSprintId === "" || taskSprintId === currentSprintId;
                  })
                : data;

            return scoped.map((t) => ({
                id: String(t.id),
                column: (t.status ?? "PRODUCT_BACKLOG") as ColumnId,
                title: t.name,
                description: t.description ?? "",
                dueDate: t.dueDate ?? "",
                estimateHours: t.estimateHours ?? 0,
            }));
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    }

    // ===================== RENDER =====================
    const CLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;

    /**
     * Renders a single task card as HTML.
     *
     * @param task The task to render
     * @returns    The card's HTML string
     */
    function renderCard(task: Task): string {
        const badges = [
            task.dueDate ? `<span class="date-badge" title="Due date">${CLOCK_ICON} ${formatDateBadge(task.dueDate)}</span>` : "",
            task.estimateHours > 0 ? `<span class="date-badge" title="Estimate">Est. ${task.estimateHours}h</span>` : "",
        ].join("");

        const footerHtml = badges
            ? `<div class="card-footer-row"><div class="card-badges">${badges}</div></div>`
            : "";

        return `
      <div class="card${footerHtml ? " card-detailed" : ""}" data-task="${task.id}" style="cursor: pointer;">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(task.title)}</span>
        </div>
        ${footerHtml}
      </div>`;
    }

    /**
     * Renders the full board with all columns and their cards.
     */
    function renderBoard(): void {
        board.innerHTML = COLUMNS.map((column) => {
            const cards = tasks.filter((t) => t.column === column.id);
            return `
      <section class="column" data-column="${column.id}">
        <h2>${column.name}</h2>
        <div class="card-list">${cards.map(renderCard).join("")}</div>
      </section>`;
        }).join("");
    }

    // ===================== TASK MODAL (READ-ONLY) =====================
    const overlay = requireElement<HTMLDivElement>("taskModalOverlay");
    const modalColumn = requireElement<HTMLSelectElement>("modalColumn");
    const titleInput = requireElement<HTMLInputElement>("modalTitle");
    const descriptionBox = requireElement<HTMLTextAreaElement>("modalDescription");
    const summary = requireElement<HTMLDivElement>("modalSummary");
    const closeBtn = requireElement<HTMLButtonElement>("modalCloseBtn");
    const cancelBtn = requireElement<HTMLButtonElement>("modalCancelBtn");

    let activeTaskId: string | null = null;

    /**
     * Opens the read-only task modal with the given task's details.
     *
     * @param task The task to display
     */
    function openModal(task: Task): void {
        activeTaskId = task.id;
        modalColumn.value = task.column;

        titleInput.value = task.title;
        descriptionBox.value = task.description || "No description";

        const column = COLUMNS.find((c) => c.id === task.column);
        const chips: string[] = [
            `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
            `<span class="summary-chip"><b>Column</b> ${column ? column.name : ""}</span>`,
        ];
        summary.innerHTML = chips.join("");

        overlay.classList.add("visible");
    }

    /**
     * Closes the read-only task modal.
     */
    function closeModal(): void {
        overlay.classList.remove("visible");
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
    });

    // ===================== BOARD CLICK =====================
    board.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const card = target.closest<HTMLElement>("[data-task]");
        if (!card) return;

        const id = card.dataset["task"];
        const task = tasks.find((t) => t.id === id);
        if (task) openModal(task);
    });

    // ===================== SPRINT TABS (FUNCTIONAL + PERSIST) =====================
    /**
     * Wires up click handlers for the sprint tab buttons and persists the
     * selected sprint in sessionStorage.
     */
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
    /**
     * Initializes the user board page by loading tasks and wiring UI.
     */
    async function init(): Promise<void> {
        initSprintTabs();
        tasks = await fetchTasks();
        renderBoard();
    }
    void init();
})();