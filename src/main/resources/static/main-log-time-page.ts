/**
 * Log Time Page — Symph Web Application
 * Handles the log time modal, allowing users to record the date, start time,
 * and hours spent on a task.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

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

// ===================== ELEMENTS =====================
const closeLogTimeBtn = requireElement<HTMLButtonElement>('closeLogTimeBtn');
const logTimeForm = requireElement<HTMLFormElement>('logTimeForm');
const logDate = requireElement<HTMLInputElement>('logDate');
const logStartTime = requireElement<HTMLInputElement>('logStartTime');
const logHours = requireElement<HTMLInputElement>('logHours');

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

    // TODO: POST /api/timelogs once backend exists
    console.log('Log time payload:', payload);
    alert('Time logged');
    logTimeForm.reset();
});