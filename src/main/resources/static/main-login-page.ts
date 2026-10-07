// main-login-page.ts
// Compile with:
//   npx tsc main-login-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Login Page — Symph Web Application
 * Handles user authentication, session storage, and role-based redirects.
 * Product Owners who weren't invited see a "no invitation" modal instead
 * of being logged in.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

const DEMO_MODE = false;

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
    team?: string;
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
const noInviteOverlay = document.getElementById('noInviteOverlay');
const noInviteEmail = document.getElementById('noInviteEmail');
const logoutNoInviteBtn = document.getElementById('logoutNoInviteBtn');

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

function showNoInviteModal(email: string): void {
    if (noInviteEmail) noInviteEmail.textContent = email;
    noInviteOverlay?.classList.add('visible');
}

/**
 * Logs the user out (clears any session) and returns them to the login page.
 * Used by the "No invitation" modal — the user never entered the app.
 */
function dismissNoInviteModal(): void {
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
noInviteOverlay?.addEventListener('click', (e: MouseEvent) => {
    if (e.target === noInviteOverlay) dismissNoInviteModal();
});

async function handleLoginDemo(userId: string, password: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = userId === 'admin' && password === 'admin';
    if (!success) throw new Error('Incorrect user ID or password.');
    return {
        id: 1,
        name: 'Admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        team: '',
    };
}

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

async function checkInvited(email: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/invites/check?email=${encodeURIComponent(email)}`);
        return res.ok;
    } catch (err) {
        console.error('Failed to check invite:', err);
        return false;
    }
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

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Incorrect user ID or password.';
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