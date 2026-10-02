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

interface LoginResponse {
    message?: string;
    token?: string;
    redirectTo?: string;
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

    return { redirectTo: '/sprint-board' };
}

async function handleLoginReal(userId: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
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