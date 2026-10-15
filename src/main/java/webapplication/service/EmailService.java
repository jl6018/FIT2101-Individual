package webapplication.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails for the Symph web application.
 * Currently used for password-reset links.
 *
 * If spring.mail.username is blank (e.g. during local development without
 * an SMTP account), the email is not sent — the reset link is printed to
 * the server console instead so the flow is still testable.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends the password-reset link to the user's email address.
     * Falls back to a console log when no SMTP account is configured.
     *
     * @param to    The recipient's email address
     * @param name  The recipient's display name (used in the greeting)
     * @param link  The full URL the user must click to reset their password
     */
    public void sendPasswordResetEmail(String to, String name, String link) {
        String subject = "Reset your Symph password";
        String body = "Hi " + (name != null ? name : "there") + ",\n\n"
                + "Someone requested a password reset for your Symph account.\n"
                + "Click the link below within 30 minutes to set a new password:\n\n"
                + link + "\n\n"
                + "If you didn't request this, you can safely ignore this email — "
                + "your password will not change.\n\n"
                + "— The Symph Team";

        if (mailUsername == null || mailUsername.isBlank()) {
            System.out.println("========================================================");
            System.out.println("[DEV MODE] Password reset link for " + to);
            System.out.println(link);
            System.out.println("========================================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // Log and print the link so the user isn't fully blocked if SMTP fails.
            System.err.println("Failed to send reset email to " + to + ": " + e.getMessage());
            System.out.println("[FALLBACK] Password reset link for " + to + ": " + link);
        }
    }
}