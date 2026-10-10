/**
 * Login Page — Symph Web Application
 * Compiled output of main-login-page.ts.
 * Handles user authentication, session storage, and role-based redirects.
 * Product Owners who weren't invited see a "no invitation" modal instead
 * of being logged in.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

window.addEventListener('pageshow', (event) => {
    if (event.persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

const DEMO_MODE = false;

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
const noInviteOverlay = document.getElementById('noInviteOverlay');
const noInviteEmail = document.getElementById('noInviteEmail');
const logoutNoInviteBtn = document.getElementById('logoutNoInviteBtn');

function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

function hideError() {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideError);
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// ---- "No invitation" modal ----
function showNoInviteModal(email) {
    if (noInviteEmail) noInviteEmail.textContent = email;
    noInviteOverlay?.classList.add('visible');
}

function dismissNoInviteModal() {
    sessionStorage.clear();
    if (noInviteOverlay) noInviteOverlay.classList.remove('visible');
    if (passwordInput) passwordInput.value = '';
    if (userIdInput) userIdInput.value = '';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';
    }
}

logoutNoInviteBtn?.addEventListener('click', dismissNoInviteModal);

noInviteOverlay?.addEventListener('click', (e) => {
    if (e.target === noInviteOverlay) dismissNoInviteModal();
});

// ---- Login handlers ----
async function handleLoginDemo(userId, password) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = userId === 'admin' && password === 'admin';
    if (!success) throw new Error('Incorrect email or password.');
    return {
        id: 1,
        name: 'Admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        team: '',
    };
}

async function handleLoginReal(userId, password) {
    const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId, password }),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!res.ok) {
        throw new Error(data.message || 'Incorrect email or password.');
    }

    return data;
}

async function checkInvited(email) {
    try {
        const res = await fetch(`/api/invites/check?email=${encodeURIComponent(email)}`);
        return res.ok;
    } catch (err) {
        console.error('Failed to check invite:', err);
        return false;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    const password = passwordInput.value;

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

        // US20 + US22: Product Owners must have been invited by an admin.
        if (data.role === 'PRODUCT_OWNER') {
            const invited = await checkInvited(data.email || userId);
            if (!invited) {
                showNoInviteModal(data.email || userId);
                passwordInput.value = '';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Log in';
                return;
            }
        }

        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }

        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', data.role || '');
        sessionStorage.setItem('email', data.email || '');
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('userId', String(data.id ?? ''));
        sessionStorage.setItem('team', data.team || '');

        if (data.role === 'ADMIN' || data.role === 'PRODUCT_OWNER') {
            window.location.href = 'index-admin-page.html';
        } else {
            window.location.href = 'index-user-page.html';
        }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Incorrect email or password.';
        showError(message);
        passwordInput.value = '';
        passwordInput.focus();
    } finally {
        if (!noInviteOverlay?.classList.contains('visible')) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log in';
        }
    }
});