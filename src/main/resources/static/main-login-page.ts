// main-login-page.ts
// Compile with:
//   npx tsc main-login-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Login Page — Symph Web Application
 * Handles user authentication, demo mode login, session storage, and
 * role-based redirects to the admin or employee board.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

// ============================================================
// DEMO MODE — set to false for real backend login
// ============================================================
const DEMO_MODE = false;

// ===================== BFCACHE FIX =====================
window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

/** Shape of the login response returned by the backend. */
interface LoginResponse {
    message?: string;
    token?: string;
    redirectTo?: string;
    role?: string;
    id?: number;
    name?: string;
    email?: string;
    team?: string;
}

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param id The ID of the element to retrieve
 * @returns  The element cast to the expected type
 * @throws Error if no element with the given ID exists
 */
function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el as T;
}

// ===================== ELEMENTS =====================
const form = requireElement<HTMLFormElement>('loginForm');
const userIdInput = requireElement<HTMLInputElement>('userId');
const passwordInput = requireElement<HTMLInputElement>('password');
const errorBanner = requireElement<HTMLDivElement>('errorBanner');
const errorText = requireElement<HTMLSpanElement>('errorText');
const dismissError = requireElement<HTMLButtonElement>('dismissError');
const submitBtn = requireElement<HTMLButtonElement>('submitBtn');

/**
 * Displays an error message in the banner.
 *
 * @param message The error message to show
 */
function showError(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

/**
 * Hides the error banner.
 */
function hideError(): void {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideError);
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// ===================== DEMO LOGIN =====================
/**
 * Performs a demo login with hard-coded credentials.
 *
 * @param userId   The user ID entered
 * @param password The password entered
 * @returns         A promise resolving to a LoginResponse
 * @throws Error    if the credentials are incorrect
 */
async function handleLoginDemo(userId: string, password: string): Promise<LoginResponse> {
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
 * @param userId   The user's email address
 * @param password The user's password
 * @returns         A promise resolving to a LoginResponse
 * @throws Error    if the credentials are incorrect
 */
async function handleLoginReal(userId: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId, password }),
    });

    const text = await res.text();
    let data: LoginResponse;
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
form.addEventListener('submit', async (e: SubmitEvent) => {
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

        // ===================== SESSION STORAGE =====================
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', data.role || '');
        sessionStorage.setItem('email', data.email || '');
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('userId', String(data.id ?? ''));
        sessionStorage.setItem('team', data.team || '');

        // ===================== ROLE-BASED REDIRECT =====================
        if (data.role === 'ADMIN') {
            window.location.href = 'index-admin-page.html';
        } else {
            window.location.href = 'index-user-page.html';
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Incorrect user ID or password.';
        showError(message);
        passwordInput.value = '';
        passwordInput.focus();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';
    }
});