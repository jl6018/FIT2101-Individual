/**
 * Register Page — Symph Web Application
 * Compiled output of main-register-page.ts.
 * Handles account creation, client-side validation, and backend registration.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

/**
 * Retrieves a DOM element by its ID and throws if not found.
 *
 * @param {string} id      The ID of the element to retrieve
 * @returns {HTMLElement}  The matching DOM element
 * @throws {Error}         if no element with the given ID exists
 */
function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

// ===================== ELEMENTS =====================
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
 * Displays an error message in the banner.
 *
 * @param {string} message The error message to show
 */
function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#FDE8E8';
    errorBanner.style.color = '#C0392B';
}

/**
 * Displays a success message in the banner.
 *
 * @param {string} message The success message to show
 */
function showSuccess(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.style.background = '#D1FAE5';
    errorBanner.style.color = '#065F46';
}

/**
 * Hides the error banner.
 */
function hideBanner() {
    errorBanner.classList.remove('visible');
}

dismissError.addEventListener('click', hideBanner);

// ===================== FORM SUBMIT =====================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanner();

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
    if (!payload.email.includes('@')) {
        showError('Please enter a valid email address.');
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
            if (text.toLowerCase().includes('already') || text.toLowerCase().includes('duplicate')) {
                throw new Error('This email is already registered. Please log in.');
            }
            throw new Error(text || 'Registration failed');
        }

        // ✅ Success — green banner, no alert popup
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