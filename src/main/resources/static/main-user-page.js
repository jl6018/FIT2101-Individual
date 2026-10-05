"use strict";
// main-user-page.js
// Compiled from main-user-page.ts — do not hand-edit.

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

    // ===================== HELPERS =====================
    function requireElement(id) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Missing element: ${id}`);
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

    function formatDateBadge(isoDate) {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

    const savedSprintId = sessionStorage.getItem("currentSprintId");
    let currentSprintId = savedSprintId && savedSprintId !== "" ? savedSprintId : "1";

    const board = requireElement("board");

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
    async function fetchTasks() {
        try {
            const team = sessionStorage.getItem("team") || "";

            const url = team
                ? `${API_BASE}/team/${encodeURIComponent(team)}`
                : `${API_BASE}/sprint/${currentSprintId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // ✅ Keep tasks that match the current sprint OR have no sprint at all
            const scoped = team
                ? data.filter((t) => {
                      const taskSprintId = t.sprint?.id ? String(t.sprint.id) : "";
                      return taskSprintId === "" || taskSprintId === currentSprintId;
                  })
                : data;

            return scoped.map((t) => ({
                id: String(t.id),
                column: t.status ?? "PRODUCT_BACKLOG",
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

    function renderCard(task) {
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

    function renderBoard() {
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
    const overlay = document.getElementById("taskModalOverlay");
    const modalColumn = document.getElementById("modalColumn");
    const titleInput = document.getElementById("modalTitle");
    const descriptionBox = document.getElementById("modalDescription");
    const summary = document.getElementById("modalSummary");
    const closeBtn = document.getElementById("modalCloseBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    function openModal(task) {
        modalColumn.value = task.column;

        titleInput.value = task.title;
        descriptionBox.value = task.description || "No description";

        const column = COLUMNS.find((c) => c.id === task.column);
        const chips = [
            `<span class="summary-chip"><b>Due</b> ${task.dueDate ? formatDateBadge(task.dueDate) : "No due date"}</span>`,
            `<span class="summary-chip"><b>Estimate</b> ${task.estimateHours > 0 ? `${task.estimateHours}h` : "Not set"}</span>`,
            `<span class="summary-chip"><b>Column</b> ${column ? column.name : ""}</span>`,
        ];
        summary.innerHTML = chips.join("");

        overlay.classList.add("visible");
    }

    function closeModal() {
        overlay.classList.remove("visible");
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
        const target = event.target;
        const card = target.closest("[data-task]");
        if (!card) return;

        const id = card.dataset["task"];
        const task = tasks.find((t) => t.id === id);
        if (task) openModal(task);
    });

    // ===================== SPRINT TABS (FUNCTIONAL + PERSIST) =====================
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
                    renderBoard();
                })();
            });
        });
    }

    // ===================== INIT =====================
    async function init() {
        initSprintTabs();
        tasks = await fetchTasks();
        renderBoard();
    }
    void init();
})();