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

function showError(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

function hideError(): void {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideError);

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
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

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const message = await res.text();
            throw new Error(message || 'Registration failed');
        }

        // Success — show message then redirect
        alert('Account successfully registered! Please log in.');
        window.location.href = 'index-login-page.html';

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        showError(message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});