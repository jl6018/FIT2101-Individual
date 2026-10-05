/**
 * Login Page — Symph Web Application
 * Compiled output of main-login-page.ts.
 * Handles user authentication, demo mode login, session storage, and
 * role-based redirects to the admin or employee board.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";
// main-login-page.js
// Merged: A's DEMO_MODE + B's sessionStorage handling + role-based redirect

// ===================== BFCACHE FIX =====================
window.addEventListener('pageshow', (event) => {
    if (event.persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

// ============================================================
// DEMO MODE — set to true for testing without a backend.
// While true: userId "admin" + password "admin" succeeds.
// ============================================================
const DEMO_MODE = false;

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param {string} id      The ID of the element to retrieve
 * @returns {HTMLElement}  The matching DOM element
 * @throws {Error}         if no element with the given ID exists
 */
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el;
}

// ===================== ELEMENTS =====================
const form = requireElement('loginForm');
const userIdInput = requireElement('userId');
const passwordInput = requireElement('password');
const errorBanner = requireElement('errorBanner');
const errorText = requireElement('errorText');
const dismissError = requireElement('dismissError');
const submitBtn = requireElement('submitBtn');

/**
 * Displays an error message in the banner.
 *
 * @param {string} message The error message to show
 */
function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

/**
 * Hides the error banner.
 */
function hideError() {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideError);
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// ===================== DEMO LOGIN =====================
/**
 * Performs a demo login with hard-coded credentials.
 *
 * @param {string} userId   The user ID entered
 * @param {string} password The password entered
 * @returns {Promise<Object>} A promise resolving to a login response
 * @throws {Error}           if the credentials are incorrect
 */
async function handleLoginDemo(userId, password) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const success = userId === 'admin' && password === 'admin';
    if (!success) {
        throw new Error('Incorrect user ID or password.');
    }

    return {
        id: 1,
        name: 'Admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        team: '',
    };
}

// ===================== REAL LOGIN =====================
/**
 * Performs a real login by calling the backend API.
 *
 * @param {string} userId   The user's email address
 * @param {string} password The user's password
 * @returns {Promise<Object>} A promise resolving to a login response
 * @throws {Error}           if the credentials are incorrect
 */
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
        throw new Error(data.message || 'Incorrect user ID or password.');
    }

    return data;
}

// ===================== FORM SUBMIT =====================
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

        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }

        // Store session
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', data.role || '');
        sessionStorage.setItem('email', data.email || '');
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('userId', String(data.id ?? ''));
        sessionStorage.setItem('team', data.team || '');

        // Role-based redirect
        if (data.role === 'ADMIN') {
            window.location.href = 'index-admin-page.html';
        } else {
            window.location.href = 'index-user-page.html';
        }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Incorrect user ID or password.';
        showError(message);
        passwordInput.value = '';
        passwordInput.focus();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';
    }
});