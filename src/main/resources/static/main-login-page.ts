// main-login-page.ts
// Compile with: tsc (uses tsconfig.json)
// Written to satisfy "strict": true

// ============================================================
// DEMO MODE — set to false for real backend login
// ============================================================
const DEMO_MODE = false;

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

// Hide the banner as soon as the person starts fixing their input
userIdInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

async function handleLoginDemo(userId: string, password: string): Promise<LoginResponse> {
    // Fake network delay so the "Logging in..." state is visible
    await new Promise((resolve) => setTimeout(resolve, 400));

    const success = userId === 'admin' && password === 'admin';
    if (!success) {
        throw new Error('Incorrect user ID or password.');
    }

    return { redirectTo: 'index-sprint-planning-page.html', role: 'ADMIN' };
}

async function handleLoginReal(userId: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId, password }),
    });

    const data: LoginResponse = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Incorrect user ID or password.');
    }

    return data;
}

form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    const password = passwordInput.value;

    // Empty-field validation
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

        // ✅ Redirect based on role
        if (data.role === 'ADMIN') {
            window.location.href = 'index-sprint-planning-page.html';
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