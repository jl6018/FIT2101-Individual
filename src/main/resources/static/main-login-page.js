"use strict";
// login.ts
// Compile with: tsc  (uses your project's tsconfig.json)
// Written to satisfy "strict": true (strictNullChecks + noImplicitAny).
// ============================================================
// DEMO MODE — set to true while your backend's /api/login isn't
// ready yet. Flip to false once the real endpoint exists.
// While true: userId "admin" + password "admin" succeeds,
// anything else shows the "incorrect" error.
// ============================================================
const DEMO_MODE = true;
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el;
}
const form = requireElement('loginForm');
const userIdInput = requireElement('userId');
const passwordInput = requireElement('password');
const errorBanner = requireElement('errorBanner');
const errorText = requireElement('errorText');
const dismissError = requireElement('dismissError');
const submitBtn = requireElement('submitBtn');
function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}
function hideError() {
    errorBanner.classList.remove('visible');
}
dismissError.addEventListener('click', hideError);
// Hide the banner as soon as the person starts fixing their input
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);
async function handleLoginDemo(userId, password) {
    // Fake network delay so the "Logging in..." state is visible
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = userId === 'admin' && password === 'admin';
    if (!success) {
        throw new Error('Incorrect user ID or password.');
    }
    return { redirectTo: '/sprint-board' };
}
async function handleLoginReal(userId, password) {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Incorrect user ID or password.');
    }
    return data;
}
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = userIdInput.value.trim();
    const password = passwordInput.value;
    // Empty-field validation (frontend-only check, runs whether or not
    // DEMO_MODE is on, since it never needs the backend).
    if (!userId || !password) {
        showError('Please fill in both fields.');
        passwordInput.value = '';
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    try {
        const data = DEMO_MODE
            ? await handleLoginDemo(userId, password)
            : await handleLoginReal(userId, password);
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        window.location.href = data.redirectTo || '/sprint-board';
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Incorrect user ID or password.';
        showError(message);
        passwordInput.value = '';
        passwordInput.focus();
    }
    finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';
    }
});
