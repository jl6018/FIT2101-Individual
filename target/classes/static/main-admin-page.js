if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

export {};
const sprintBoards = {
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
function formatDateBadge(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function renderCard(card, colIndex, cardIndex) {
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
function renderColumn(column, colIndex) {
    return `
    <section class="column">
      <h2>${column.name}</h2>
      ${column.cards.map((card, cardIndex) => renderCard(card, colIndex, cardIndex)).join("")}
      <button class="add-card" data-column="${column.name}">+ Add a card</button>
    </section>
  `;
}
function renderBoard(sprintId) {
    const board = document.getElementById("board");
    if (!board) return;
    const data = sprintBoards[sprintId];
    if (!data) return;
    currentSprintId = sprintId;
    board.innerHTML = data.columns.map((column, colIndex) => renderColumn(column, colIndex)).join("");
    attachAddCardListeners();
    attachEditIconListeners(data);
}
function attachAddCardListeners() {
    document.querySelectorAll(".add-card").forEach((btn) => {
        btn.addEventListener("click", () => {
            const title = prompt("Enter card title:");
            if (!title) return;
            const description = prompt("Enter card description (optional):");
            const data = sprintBoards[currentSprintId];
            const columnName = btn.dataset.column;
            const column = data?.columns.find((col) => col.name === columnName);
            if (!column) return;
            const newCard = { title };
            if (description) newCard.description = description;
            column.cards.push(newCard);
            renderBoard(currentSprintId);
        });
    });
}
function attachEditIconListeners(data) {
    data.columns.forEach((column, colIndex) => {
        column.cards.forEach((card, cardIndex) => {
            const cardEl = document.getElementById(`card-${colIndex}-${cardIndex}`);
            const editIcon = cardEl?.querySelector(".edit-icon");
            editIcon?.addEventListener("click", (event) => {
                event.stopPropagation();
                openModal(card);
            });
        });
    });
}
function initSprintTabs() {
    const tabs = document.querySelectorAll(".sprint-tab");
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
let activeCard = null;
function buildModal() {
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
        <div class="modal-section">
          <h3>Status</h3>
          <select id="modal-status">
            <option value="Product Backlog">Product Backlog</option>
            <option value="Sprint Backlog">Sprint Backlog</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div class="modal-section">
          <h3>Priority</h3>
          <select id="modal-priority">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div class="modal-section">
          <h3>Due date</h3>
          <input type="date" id="modal-due-date" />
        </div>
        <div class="modal-section">
          <h3>Assign to</h3>
          <select id="modal-assignee">
            <option value="">Unassigned</option>
            <option value="team:Team Alpha">Team Alpha</option>
            <option value="team:Team Beta">Team Beta</option>
            <option value="user:Priya Nair">Priya Nair</option>
            <option value="user:Daniel Wu">Daniel Wu</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="modal-delete-btn" id="modal-delete-btn" type="button">Delete</button>
          <button class="modal-save-btn" id="modal-save-btn" type="button">Save</button>
        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const overlay = document.getElementById("task-modal-overlay");
    const closeBtn = document.getElementById("modal-close-btn");
    const saveBtn = document.getElementById("modal-save-btn");
    const deleteBtn = document.getElementById("modal-delete-btn");
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
    });
    saveBtn.addEventListener("click", saveModal);
    deleteBtn.addEventListener("click", deleteActiveCard);
}
function openModal(card) {
    activeCard = card;
    const overlay = document.getElementById("task-modal-overlay");
    const titleInput = document.getElementById("modal-task-title");
    const descriptionBox = document.getElementById("modal-description");
    const statusSelect = document.getElementById("modal-status");
    const prioritySelect = document.getElementById("modal-priority");
    const dueDateInput = document.getElementById("modal-due-date");
    const assigneeSelect = document.getElementById("modal-assignee");
    if (titleInput) titleInput.value = card.title;
    if (descriptionBox) descriptionBox.value = card.description ?? "";
    if (statusSelect && card.status) statusSelect.value = card.status;
    if (prioritySelect && card.detailed?.priority) prioritySelect.value = card.detailed.priority;
    if (dueDateInput && card.dueDate) dueDateInput.value = card.dueDate;
    if (assigneeSelect && card.assignee) assigneeSelect.value = card.assignee;
    overlay?.classList.add("visible");
}
function saveModal() {
    if (!activeCard) return;
    const titleInput = document.getElementById("modal-task-title");
    const descriptionBox = document.getElementById("modal-description");
    const statusSelect = document.getElementById("modal-status");
    const prioritySelect = document.getElementById("modal-priority");
    const dueDateInput = document.getElementById("modal-due-date");
    const assigneeSelect = document.getElementById("modal-assignee");
    const title = titleInput.value.trim();
    if (!title) {
        alert("Title can't be empty.");
        return;
    }
    activeCard.title = title;
    activeCard.description = descriptionBox.value;
    activeCard.status = statusSelect.value;
    activeCard.dueDate = dueDateInput.value;
    activeCard.assignee = assigneeSelect.value;
    if (activeCard.detailed) {
        activeCard.detailed.priority = prioritySelect.value;
    }
    activeCard = null;
    document.getElementById("task-modal-overlay")?.classList.remove("visible");
    renderBoard(currentSprintId);
}
function deleteActiveCard() {
    if (!activeCard) return;
    if (!confirm("Delete this task?")) return;
    activeCard = null;
    document.getElementById("task-modal-overlay")?.classList.remove("visible");
    renderBoard(currentSprintId);
}
function closeModal() {
    const overlay = document.getElementById("task-modal-overlay");
    overlay?.classList.remove("visible");
    activeCard = null;
}
function addTeamSwitcher() {
    const headerRight = document.querySelector(".project-header-right");
    if (!headerRight) return;
    const switcher = document.createElement("select");
    switcher.id = "adminTeamSwitcher";
    switcher.className = "admin-team-switcher";
    switcher.innerHTML = `
        <option value="all">All Teams</option>
        <option value="Team Alpha">Team Alpha</option>
        <option value="Team Beta">Team Beta</option>
        <option value="Team Gamma">Team Gamma</option>
    `;
    switcher.addEventListener("change", () => {
        renderBoard(currentSprintId);
    });
    headerRight.insertBefore(switcher, headerRight.firstChild);
}
function addStartSprintButton() {
    const headerRight = document.querySelector(".project-header-right");
    if (!headerRight) return;
    const btn = document.createElement("button");
    btn.id = "startSprintBtn";
    btn.className = "start-sprint-btn";
    btn.textContent = "▶ Start Sprint";
    btn.addEventListener("click", () => {
        if (!confirm("Start the sprint now? Time tracking will begin.")) return;
        alert("Sprint started");
    });
    headerRight.insertBefore(btn, headerRight.firstChild);
}
buildModal();
initSprintTabs();
renderBoard(currentSprintId);
addTeamSwitcher();
addStartSprintButton();