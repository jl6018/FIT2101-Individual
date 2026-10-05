/**
 * Log Time Page — Symph Web Application
 * Compiled output of main-log-time-page.ts.
 * Handles the log time modal, allowing users to record the date, start time,
 * and hours spent on a task.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ===================== AUTH GUARD =====================
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index-login-page.html';
    throw new Error('Not logged in');
}
// ===================== END GUARD =====================

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param {string} id      The ID of the element to retrieve
 * @returns {HTMLElement}  The matching DOM element
 * @throws {Error}         if no element with the given ID exists
 */
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

// ===================== ELEMENTS =====================
const closeLogTimeBtn = requireElement('closeLogTimeBtn');
const logTimeForm = requireElement('logTimeForm');
const logDate = requireElement('logDate');
const logStartTime = requireElement('logStartTime');
const logHours = requireElement('logHours');

closeLogTimeBtn.addEventListener('click', () => {
    document.getElementById('logTimeOverlay')?.classList.remove('visible');
});

// ===================== FORM SUBMIT =====================
logTimeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        date: logDate.value,
        startTime: logStartTime.value,
        hours: Number(logHours.value),
    };

    if (payload.hours <= 0) {
        alert('Hours must be greater than 0.');
        return;
    }

    console.log('Log time payload:', payload);
    alert('Time logged');
    logTimeForm.reset();
});