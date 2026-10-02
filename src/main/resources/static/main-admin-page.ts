export {};

type Priority = "Low" | "Medium" | "High" | "Urgent";

type CardData = {
    title: string;
    detailed?: {
        progress: number;
        tags: string[];
        avatars: string[];
        date?: string; // ISO date string, e.g. "2026-09-01"
        priority?: Priority;
    };
    // Front-end only for now — lives in memory until the backend exists.
    description?: string;
};

type ColumnData = {
    name: string;
    cards: CardData[];
};

type SprintData = {
    columns: ColumnData[];
};

const sprintBoards: Record<string, SprintData> = {
    "1": {
        columns: [
            { name: "Product Backlog", cards: [{ title: "Set Up Login" }, { title: "TEXT" }] },
            {
                name: "Sprint Backlog",
                cards: [
                    {
                        title: "US01 - Set Up Login",
                        detailed: {
                            progress: 30,
                            tags: ["Front-end", "Urgent"],
                            avatars: ["V", "C"],
                            date: "2026-09-01",
                            priority: "Urgent",
                        },
                    },
                    { title: "TEXT" },
                ],
            },
            { name: "In Progress", cards: [{ title: "Set Up Login" }] },
            { name: "Completed", cards: [{ title: "Set Up Login" }, { title: "TEXT" }] },
        ],
    },
    "2": {
        columns: [
            { name: "Product Backlog", cards: [{ title: "Design Dashboard" }] },
            { name: "Sprint Backlog", cards: [{ title: "Design Dashboard" }] },
            { name: "In Progress", cards: [] },
            { name: "Completed", cards: [] },
        ],
    },
    "3": {
        columns: [
            { name: "Product Backlog", cards: [] },
            { name: "Sprint Backlog", cards: [] },
            { name: "In Progress", cards: [] },
            { name: "Completed", cards: [] },
        ],
    },
};

let currentSprintId = "1";

// Formats an ISO date ("2026-09-01") as a short display badge ("1 Sep"),
// using a fixed locale so it doesn't depend on the visitor's browser settings.
function formatDateBadge(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function renderCard(card: CardData, colIndex: number, cardIndex: number): string {
    const cardId = `card-${colIndex}-${cardIndex}`;

    const editIconHtml = `<span class="edit-icon" title="Open task details">✎</span>`;

    if (card.detailed) {
        const tagsHtml = card.detailed.tags
            .map((tag) => {
                const cls = tag.toLowerCase() === "urgent" ? "tag-urgent" : "tag-frontend";
                return `<span class="tag ${cls}">${tag}</span>`;
            })
            .join("");
        const avatarsHtml = card.detailed.avatars
            .map((initial) => `<div class="avatar avatar-small avatar-purple">${initial}</div>`)
            .join("");
        const dateHtml = card.detailed.date
            ? `<span class="date-badge">🗓 ${formatDateBadge(card.detailed.date)}</span>`
            : "<span></span>";

        return `
      <div class="card card-detailed" id="${cardId}">
        <div class="card-title-row">
          <input type="checkbox" class="status-checkbox" />
          <span class="card-title">${card.title}</span>
          ${editIconHtml}
        </div>
        <div class="progress-row">
          <span class="progress-percent">${card.detailed.progress}%</span>
          <span class="progress-label">Completed</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${card.detailed.progress}%;"></div>
        </div>
        <div class="tags-row">
          ${tagsHtml}
        </div>
        <div class="card-footer-row">
          ${dateHtml}
          <div class="tag-avatars">${avatarsHtml}</div>
        </div>
      </div>
    `;
    }

    return `
    <div class="card" id="${cardId}">
      <div class="card-title-row">
        <input type="checkbox" class="status-checkbox" />
        <span class="card-title">${card.title}</span>
        ${editIconHtml}
      </div>
    </div>
  `;
}

function renderColumn(column: ColumnData, colIndex: number): string {
    return `
    <section class="column">
      <h2>${column.name}</h2>
      ${column.cards.map((card, cardIndex) => renderCard(card, colIndex, cardIndex)).join("")}
      <button class="add-card" data-column="${column.name}">+ Add a card</button>
    </section>
  `;
}

function renderBoard(sprintId: string): void {
    const board = document.getElementById("board");
    if (!board) return;

    const data = sprintBoards[sprintId];
    if (!data) return;

    currentSprintId = sprintId;
    board.innerHTML = data.columns.map((column, colIndex) => renderColumn(column, colIndex)).join("");

    attachAddCardListeners();
    attachEditIconListeners(data);
}

// Adds the new card straight into the data model (not just the DOM) so it can
// later be found and reopened through the edit icon, same as any other card.
function attachAddCardListeners(): void {
    document.querySelectorAll<HTMLButtonElement>(".add-card").forEach((btn) => {
        btn.addEventListener("click", () => {
            const title = prompt("Enter card title:");
            if (!title) return;

            const description = prompt("Enter card description (optional):");

            const data = sprintBoards[currentSprintId];
            const columnName = btn.dataset.column;
            const column = data?.columns.find((col) => col.name === columnName);
            if (!column) return;

            const newCard: CardData = { title };
            if (description) newCard.description = description;

            column.cards.push(newCard);
            renderBoard(currentSprintId);
            // TODO: POST the new card once the backend endpoint exists.

        });
    });
}

// Wires the pencil icon on every card so any card can be opened for editing.
function attachEditIconListeners(data: SprintData): void {
    data.columns.forEach((column, colIndex) => {
        column.cards.forEach((card, cardIndex) => {
            const cardEl = document.getElementById(`card-${colIndex}-${cardIndex}`);
            const editIcon = cardEl?.querySelector<HTMLElement>(".edit-icon");

            editIcon?.addEventListener("click", (event) => {
                event.stopPropagation();
                openModal(card);
            });
        });
    });
}

function initSprintTabs(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>(".sprint-tab");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            const sprintId = tab.dataset.sprint;
            if (sprintId) {
                renderBoard(sprintId);
            }
        });
    });
}

/* =========================================================
   Edit Card Modal (Admin)
   Simple view: just the title and description that "+ Add a
   card" already asks for, now editable after the fact. In-memory
   only for now — the input handlers below are where a save
   request (PATCH /tasks/:id) would go once the backend exists.
   ========================================================= */

let activeCard: CardData | null = null;

function buildModal(): void {
    const modalHtml = `
    <div class="modal-overlay" id="task-modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-column-label">Edit card</span>
          <div class="modal-header-icons">
            <span class="modal-icon-btn modal-close" id="modal-close-btn" title="Close">✕</span>
          </div>
        </div>

        <div class="modal-title-row">
          <span class="modal-title-dot"></span>
          <input class="modal-title-input" id="modal-task-title" type="text" value="" />
        </div>

        <div class="modal-section">
          <h3>Description</h3>
          <textarea class="modal-description" id="modal-description" placeholder="Add a more detailed description..."></textarea>
        </div>

        <div class="modal-footer">
          <button class="modal-save-btn" id="modal-save-btn" type="button">Save</button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const overlay = document.getElementById("task-modal-overlay") as HTMLElement;
    const closeBtn = document.getElementById("modal-close-btn") as HTMLElement;
    const saveBtn = document.getElementById("modal-save-btn") as HTMLButtonElement;

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
    });

    saveBtn.addEventListener("click", saveModal);
}

function openModal(card: CardData): void {
    activeCard = card;

    const overlay = document.getElementById("task-modal-overlay");
    const titleInput = document.getElementById("modal-task-title") as HTMLInputElement;
    const descriptionBox = document.getElementById("modal-description") as HTMLTextAreaElement;

    if (titleInput) titleInput.value = card.title;
    if (descriptionBox) descriptionBox.value = card.description ?? "";

    overlay?.classList.add("visible");
}

function saveModal(): void {
    if (!activeCard) return;

    const titleInput = document.getElementById("modal-task-title") as HTMLInputElement;
    const descriptionBox = document.getElementById("modal-description") as HTMLTextAreaElement;

    const title = titleInput.value.trim();
    if (!title) {
        alert("Title can't be empty.");
        return;
    }

    activeCard.title = title;
    activeCard.description = descriptionBox.value;
    // TODO: PATCH the card once the backend endpoint exists.

    activeCard = null;
    document.getElementById("task-modal-overlay")?.classList.remove("visible");
    renderBoard(currentSprintId);
}

// X, overlay click, and Escape all land here — no changes are written back,
// so anything typed since the card was opened is simply thrown away.
function closeModal(): void {
    const overlay = document.getElementById("task-modal-overlay");
    overlay?.classList.remove("visible");

    activeCard = null;
}

buildModal();
initSprintTabs();
renderBoard(currentSprintId);
