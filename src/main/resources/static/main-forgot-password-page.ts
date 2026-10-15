// main-forgot-password-page.ts
// Compile with:
//   npx tsc main-forgot-password-page.ts --module esnext --target esnext --strict --ignoreConfig

/**
 * Forgot / Reset Password Page — Symph Web Application
 * Simplified self-service reset: sends email + new password to the backend.
 * No email delivery required — the backend updates the password directly.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

// ===================== HELPERS =====================
function requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

// ===================== ELEMENTS =====================
const form = requireElement<HTMLFormElement>('forgotForm');
const emailInput = requireElement<HTMLInputElement>('email');
const newPasswordInput = requireElement<HTMLInputElement>('newPassword');
const confirmPasswordInput = requireElement<HTMLInputElement>('confirmPassword');
const submitBtn = requireElement<HTMLButtonElement>('submitBtn');
const errorBanner = requireElement<HTMLDivElement>('errorBanner');
const errorText = requireElement<HTMLSpanElement>('errorText');
const successBanner = requireElement<HTMLDivElement>('successBanner');
const successText = requireElement<HTMLSpanElement>('successText');
const dismissError = requireElement<HTMLButtonElement>('dismissError');

// ===================== BANNER HELPERS =====================
function showError(message: string): void {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    successBanner.hidden = true;
}

function showSuccess(message: string): void {
    successText.textContent = message;
    successBanner.hidden = false;
    errorBanner.classList.remove('visible');
}

function hideAll(): void {
    errorBanner.classList.remove('visible');
    successBanner.hidden = true;
}

// ===================== EVENT WIRING =====================
dismissError.addEventListener('click', hideAll);
emailInput.addEventListener('input', hideAll);
newPasswordInput.addEventListener('input', hideAll);
confirmPasswordInput.addEventListener('input', hideAll);

// ===================== SUBMIT HANDLER =====================
form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    hideAll();

    const email = emailInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ---------- Client-side validation ----------
    if (!email || !newPassword || !confirmPassword) {
        showError('Please fill in all fields.');
        return;
    }
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters.');
        newPasswordInput.focus();
        return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
        showError('Password must contain at least one letter and one number.');
        newPasswordInput.focus();
        return;
    }
    if (newPassword !== confirmPassword) {
        showError('The two passwords do not match.');
        confirmPasswordInput.focus();
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting…';

    try {
        const res = await fetch('/api/users/reset-password-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
        }

        showSuccess('Password updated! Redirecting to login…');
        submitBtn.textContent = 'Done ✅';
        form.reset();

        setTimeout(() => {
            window.location.href = 'index-login-page.html';
        }, 1500);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        showError(message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset password';
    }
});