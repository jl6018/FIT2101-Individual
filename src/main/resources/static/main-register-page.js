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

function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
}

function hideError() {
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

        alert('Account successfully registered! Please log in.');
        window.location.href = 'index-login-page.html';

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        showError(message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});