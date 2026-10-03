window.addEventListener('pageshow', (event) => {
    if (event.persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}
// ===================== END GUARD =====================

// ===================== LOGOUT =====================
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Log out?')) {
        sessionStorage.clear();
        window.location.href = 'index-login-page.html';
    }
});
// ===================== END LOGOUT =====================

async function loadBoard() {
    const container = document.getElementById('boardColumns');
    if (!container) return;

    try {
        const res = await fetch('/api/tasks/board');
        if (!res.ok) throw new Error('Failed to load board');

        const data = await res.json();
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

function formatStatus(status) {
    return status
        .toLowerCase()
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');
}

loadBoard();