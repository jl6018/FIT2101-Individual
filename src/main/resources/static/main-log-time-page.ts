function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

const closeLogTimeBtn = requireElement<HTMLButtonElement>('closeLogTimeBtn');
const logTimeForm = requireElement<HTMLFormElement>('logTimeForm');
const logDate = requireElement<HTMLInputElement>('logDate');
const logStartTime = requireElement<HTMLInputElement>('logStartTime');
const logHours = requireElement<HTMLInputElement>('logHours');

closeLogTimeBtn.addEventListener('click', () => {
    document.getElementById('logTimeOverlay')?.classList.remove('visible');
});

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