"use strict";
// main-log-time-page.js
// Compiled from main-log-time-page.ts — do not hand-edit.

// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

const closeLogTimeBtn = requireElement('closeLogTimeBtn');
const logTimeForm = requireElement('logTimeForm');
const logDate = requireElement('logDate');
const logStartTime = requireElement('logStartTime');
const logHours = requireElement('logHours');

// Optional task dropdown
const logTask = document.getElementById('logTask');

const TIMELOGS_API = 'http://localhost:8080/api/timelogs';
const TASKS_API = 'http://localhost:8080/api/tasks';

// ===================== CLOSE =====================
closeLogTimeBtn.addEventListener('click', () => {
    document.getElementById('logTimeOverlay')?.classList.remove('visible');
});

// ===================== LOAD TASKS =====================
async function loadTaskOptions() {
    if (!logTask) return;

    try {
        const res = await fetch(TASKS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const tasks = await res.json();

        logTask.innerHTML =
            `<option value="">Select a task…</option>` +
            tasks.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
    } catch (err) {
        console.error('Failed to load tasks:', err);
        logTask.innerHTML = `<option value="">Could not load tasks</option>`;
    }
}

// ===================== SUBMIT =====================
logTimeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const hours = Number(logHours.value);
    if (!Number.isFinite(hours) || hours <= 0) {
        alert('Hours must be greater than 0.');
        return;
    }

    if (!logDate.value) {
        alert('Please pick a date.');
        return;
    }

    const userId = Number(sessionStorage.getItem('userId'));
    if (!Number.isFinite(userId) || userId <= 0) {
        alert('Session expired. Please log in again.');
        return;
    }

    const taskId = logTask?.value ? Number(logTask.value) : null;

    const payload = {
        date: logDate.value,
        hours: hours,
        description: `Start: ${logStartTime.value || 'N/A'}`,
        user: { id: userId },
    };

    if (taskId) {
        payload.task = { id: taskId };
    }

    try {
        const res = await fetch(TIMELOGS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
        }

        alert('Time logged');
        logTimeForm.reset();
        document.getElementById('logTimeOverlay')?.classList.remove('visible');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        alert('Failed to log time: ' + message);
    }
});

// ===================== INIT =====================
void loadTaskOptions();