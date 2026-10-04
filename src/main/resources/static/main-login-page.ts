// main-login-page.ts
// Compile with:
//   npx tsc main-login-page.ts --module esnext --target esnext --strict --ignoreConfig

// ============================================================
// DEMO MODE — set to false for real backend login
// ============================================================
const DEMO_MODE = false;

// ===================== BFCACHE FIX (from B) =====================
window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && sessionStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index-login-page.html';
    }
});

interface LoginResponse {
    message?: string;
    token?: string;
    redirectTo?: string;
    role?: string;
    id?: number;
    name?: string;
    email?: string;
}

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Expected element with id "${id}" to exist in the DOM.`);
    }
    return el as T;
}

const form = requireElement<HTMLFormElement>('loginForm');
const userIdInput = requireElement<HTMLInputElement>('userId');
const passwordInput = requireElement<HTMLInputElement>('password');
const errorBanner = requireElement<HTMLDivElement>('errorBanner');
const errorText = requireElement<HTMLSpanElement>('errorText');
const dismissError = requireElement<HTMLButtonElement>('dismissError');
const submitBtn = requireElement<HTMLButtonElement>('submitBtn');

function showError(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

function hideError(): void {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideError);
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// ===================== DEMO LOGIN (from A) =====================
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
    };
}

// ===================== REAL LOGIN (from B) =====================
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

        // ===================== SESSION STORAGE (from B) =====================
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', data.role || '');
        sessionStorage.setItem('email', data.email || '');
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('userId', String(data.id ?? ''));

        // ===================== ROLE-BASED REDIRECT (from B) =====================
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