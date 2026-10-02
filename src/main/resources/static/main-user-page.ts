export {};

type Priority = "Low" | "Medium" | "High" | "Urgent";

type CardData = {
    title: string;
    detailed?: {
        progress: number;
        tags: string[];
        avatars: string[];
        date?: string;
        priority?: Priority;
    };
    team?: string;
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
                        team: "Team Alpha",
                        detailed: {
                            progress: 30,
                            tags: ["Front-end", "Urgent"],
                            avatars: ["V", "C"],
                            date: "2026-09-01",
                            priority: "Urgent",
                        },
                    },
                    { title: "TEXT", team: "Team Alpha" },
                ],
            },
            { name: "In Progress", cards: [{ title: "Set Up Login", team: "Team Alpha" }] },
            { name: "Completed", cards: [{ title: "Set Up Login", team: "Team Alpha" }, { title: "TEXT", team: "Team Alpha" }] },
        ],
    },
    "2": {
        columns: [
            { name: "Product Backlog", cards: [{ title: "Design Dashboard", team: "Team Alpha" }] },
            { name: "Sprint Backlog", cards: [{ title: "Design Dashboard", team: "Team Alpha" }] },
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

// Change this to match the logged-in user's team
const CURRENT_USER_TEAM = "Team Alpha";

function formatDateBadge(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function renderCard(card: CardData, colIndex: number, cardIndex: number): string {
    const cardId = `card-${colIndex}-${cardIndex}`;

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
      </div>
    </div>
  `;
}

function renderBoard(sprintId: string): void {
    const board = document.getElementById("board");
    if (!board) return;

    const data = sprintBoards[sprintId];
    if (!data) return;

    currentSprintId = sprintId;

    // Filter: only show cards for the logged-in user's team
    const filtered = {
        ...data,
        columns: data.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => {
                return !c.team || c.team === CURRENT_USER_TEAM;
            }),
        })),
    };

    board.innerHTML = filtered.columns
        .map(
            (column, colIndex) => `
        <section class="column">
          <h2>${column.name}</h2>
          ${column.cards.map((card, cardIndex) => renderCard(card, colIndex, cardIndex)).join("")}
        </section>
      `
        )
        .join("");
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

initSprintTabs();
renderBoard(currentSprintId);