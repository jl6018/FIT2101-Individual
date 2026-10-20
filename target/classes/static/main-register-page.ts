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
const pageTitle = requireElement<HTMLHeadingElement>('pageTitle');
const roleField = requireElement<HTMLDivElement>('roleField');

// US20: Product Owners can only register through the one-time link in their invite email.
const inviteToken = new URLSearchParams(window.location.search).get('invite');

/**
 * Validates the email shape AND checks that it uses a recognized TLD.
 * Rejects obvious typos like "gmailc.om" while allowing all common domains.
 *
 * @param email The email to validate
 * @returns     True if the email looks valid
 */
function isValidEmailShape(email: string): boolean {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|org|net|edu|gov|mil|io|co|my|sg|uk|us|info|biz|dev|app)$/i.test(email);
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

// Show / hide password toggle
const togglePasswordBtn = requireElement<HTMLButtonElement>('togglePassword');
togglePasswordBtn.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePasswordBtn.textContent = show ? 'Hide password' : 'Show password';
    togglePasswordBtn.setAttribute('aria-pressed', String(show));
});

/**
 * Switches the page into invite mode: checks the token with the backend, shows
 * the invited email (locked) and hides the role picker, since an invite always
 * creates a Product Owner. An invalid or used token leaves the form disabled.
 *
 * @param token The one-time token from the invite link
 */
async function setUpInviteMode(token: string): Promise<void> {
    pageTitle.textContent = 'Accept your invitation';
    roleField.style.display = 'none';
    emailInput.readOnly = true;
    submitBtn.disabled = true;

    try {
        const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error('Invalid invitation');
        const data = (await res.json()) as { email: string };
        emailInput.value = data.email;
        submitBtn.disabled = false;
    } catch {
        showError('This invitation link is invalid or has already been used. Ask an admin to send you a new invite.');
    }
}

if (inviteToken) {
    void setUpInviteMode(inviteToken);
}

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
        showError('Please enter a valid email with a recognized domain (e.g. user@gmail.com).');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
        // With an invite the backend takes the email and role from the invitation itself
        const res = inviteToken
            ? await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteToken, name: payload.name, password: payload.password }),
            })
            : await fetch('/api/users', {
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
            if (lower.includes('valid email') || lower.includes('recognized domain')) {
                throw new Error('Please enter a valid email with a recognized domain (e.g. user@gmail.com).');
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