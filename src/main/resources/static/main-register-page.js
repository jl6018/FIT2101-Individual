/**
 * Register Page — Symph Web Application
 * Compiled output of main-register-page.ts.
 * Handles account creation, client-side validation, and backend registration.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

const form = requireElement('registerForm');
const nameInput = requireElement('name');
const emailInput = requireElement('email');
const passwordInput = requireElement('password');
const roleSelect = requireElement('role');
const submitBtn = requireElement('registerBtn');
const errorBanner = requireElement('errorBanner');
const errorText = requireElement('errorText');
const dismissError = requireElement('dismissError');

/**
 * Basic email shape check: something@something.tld
 * Requires a dot and a TLD of 2 or more letters.
 *
 * @param {string} email The email to validate
 * @returns {boolean}    True if the shape looks valid
 */
function isValidEmailShape(email) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#FDE8E8';
    errorBanner.style.color = '#C0392B';
}

function showSuccess(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#D1FAE5';
    errorBanner.style.color = '#065F46';
}

function hideBanner() {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideBanner);

form.addEventListener('submit', async (e) => {
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

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        showError(message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});