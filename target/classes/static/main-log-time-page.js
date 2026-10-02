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
    console.log('Log time payload:', payload);
    alert('Time logged');
    logTimeForm.reset();
});