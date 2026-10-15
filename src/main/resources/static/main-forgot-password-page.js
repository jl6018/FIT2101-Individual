/**
 * Forgot / Reset Password Page — Symph Web Application
 * Simplified self-service reset: sends email + new password to the backend.
 * No email delivery required — the backend updates the password directly.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

"use strict";

function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el;
}

const form = requireElement('forgotForm');
const emailInput = requireElement('email');
const newPasswordInput = requireElement('newPassword');
const confirmPasswordInput = requireElement('confirmPassword');
const submitBtn = requireElement('submitBtn');
const errorBanner = requireElement('errorBanner');
const errorText = requireElement('errorText');
const successBanner = requireElement('successBanner');
const successText = requireElement('successText');
const dismissError = requireElement('dismissError');

function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    successBanner.hidden = true;
}

function showSuccess(message) {
    successText.textContent = message;
    successBanner.hidden = false;
    errorBanner.classList.remove('visible');
}

function hideAll() {
    errorBanner.classList.remove('visible');
    successBanner.hidden = true;
}

dismissError.addEventListener('click', hideAll);
emailInput.addEventListener('input', hideAll);
newPasswordInput.addEventListener('input', hideAll);
confirmPasswordInput.addEventListener('input', hideAll);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAll();

    const email = emailInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

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
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        showError(message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset password';
    }
});