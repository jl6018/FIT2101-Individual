/**
 * Register Page — Symph Web Application
 * Handles account creation, client-side validation, and backend registration.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

const form = requireElement<HTMLFormElement>('registerForm');
const nameInput = requireElement<HTMLInputElement>('name');
const emailInput = requireElement<HTMLInputElement>('email');
const passwordInput = requireElement<HTMLInputElement>('password');
const roleSelect = requireElement<HTMLSelectElement>('role');
const submitBtn = requireElement<HTMLButtonElement>('registerBtn');
const errorBanner = requireElement<HTMLDivElement>('errorBanner');
const errorText = requireElement<HTMLSpanElement>('errorText');
const dismissError = requireElement<HTMLButtonElement>('dismissError');

function isValidEmailShape(email: string): boolean {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

function showError(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#FDE8E8';
    errorBanner.style.color = '#C0392B';
}

function showSuccess(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#D1FAE5';
    errorBanner.style.color = '#065F46';
}

function hideBanner(): void {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideBanner);

form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    hideBanner();

    const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        password: passwordInput.value,
        role: roleSelect.value,
    };

    if (!payload.name || !payload.email || !payload.password) {
        showError('Please fill in all fields.');
        return;
    }
    if (payload.password.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
    }
    if (!isValidEmailShape(payload.email)) {
        showError('Please enter a valid email address (e.g. user@example.com).');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            const lower = text.toLowerCase();

            if (lower.includes('already registered') || lower.includes('duplicate')) {
                throw new Error('This email is already registered. Please log in.');
            }
            if (lower.includes('valid email')) {
                throw new Error('Please enter a valid email address (e.g. user@example.com).');
            }
            throw new Error(text || 'Registration failed');
        }

        showSuccess('Account successfully registered! Redirecting to login...');
        submitBtn.textContent = 'Registered ✅';

        setTimeout(() => {
            window.location.href = 'index-login-page.html';
        }, 1500);

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        showError(message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});