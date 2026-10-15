/**
 * Reset Password Page — Symph Web Application
 * Reads ?token=... from the URL, validates it against the backend, and
 * lets the user set a new password. On success, redirects to the login page.
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

const form = requireElement('resetForm');
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
newPasswordInput.addEventListener('input', hideAll);
confirmPasswordInput.addEventListener('input', hideAll);

// ---------- Read the token from the URL ----------
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// ---------- Validate on load ----------
(async function validateOnLoad() {
    if (!token) {
        showError('This page must be opened from the link in your reset email.');
        form.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
        return;
    }
    try {
        const res = await fetch(`/api/users/reset-password/validate?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
            showError('This reset link is invalid or has expired. Please request a new one.');
            form.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
        }
    } catch (err) {
        console.error('Token validation failed:', err);
        showError('Could not verify the reset link. Please try again.');
    }
})();

// ---------- Submit handler ----------
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAll();

    if (!token) {
        showError('Missing reset token.');
        return;
    }

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
        showError('Please fill in both password fields.');
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
        const res = await fetch('/api/users/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed to reset password');
        }

        showSuccess('Password updated! Redirecting to login…');
        submitBtn.textContent = 'Done ✅';

        setTimeout(() => {
            window.location.href = 'index-login-page.html';
        }, 1500);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reset password';
        showError(message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset password';
    }
});