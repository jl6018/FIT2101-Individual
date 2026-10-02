// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}
// ===================== END AUTH GUARD =====================

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

// ===================== SWITCH ACCOUNT / LOGOUT =====================
const switchAccountBtn = document.getElementById('switchAccountBtn');
switchAccountBtn?.addEventListener('click', () => {
    if (confirm('Log out?')) {
        sessionStorage.clear();
        window.location.href = 'index-login-page.html';
    }
});

// ===================== LOAD BOARD =====================
interface TaskItem {
    id: number;
    name: string;
    description?: string;
}

type BoardData = Record<string, TaskItem[]>;

async function loadBoard(): Promise<void> {
    const container = document.getElementById('boardColumns');
    if (!container) return;

    try {
        const res = await fetch('/api/tasks/board');
        if (!res.ok) throw new Error('Failed to load board');

        const data: BoardData = await res.json();

        container.innerHTML = '';

        Object.entries(data).forEach(([status, tasks]) => {
            const column = document.createElement('div');
            column.className = 'board-column';
            column.innerHTML = `
                <h3>${formatStatus(status)}</h3>
                <div class="task-list">
                    ${tasks.map((t) => `
                        <div class="task-card">
                            <strong>${t.name}</strong>
                            <p>${t.description || ''}</p>
                        </div>
                    `).join('') || '<p class="muted">No tasks</p>'}
                </div>
            `;
            container.appendChild(column);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="muted">Unable to load board.</p>';
    }
}

function formatStatus(status: string): string {
    return status
        .toLowerCase()
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');
}

loadBoard();