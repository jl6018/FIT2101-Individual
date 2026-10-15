package webapplication.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailService.
 *
 * These tests run entirely in-memory — JavaMailSender is mocked, so no
 * real SMTP server is contacted. They verify:
 *   - the email is built with the correct recipient, subject, and body
 *   - the reset link is included in the body
 *   - when SMTP is not configured, the service does NOT try to send
 *     (it falls back to printing the link to the console)
 *   - if the mail server rejects the send, the service logs the fallback
 *     rather than propagating the exception to the caller
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender);
    }

    // ===================== SUCCESS PATH =====================

    /**
     * When SMTP is configured, the service builds and sends a single
     * SimpleMailMessage with the correct recipient, subject, and body.
     */
    @Test
    void testSendPasswordResetEmail_SmtpConfigured_SendsMail() {
        // Simulate "SMTP is configured"
        ReflectionTestUtils.setField(emailService, "mailUsername", "noreply@symph.dev");

        emailService.sendPasswordResetEmail(
                "user@example.com",
                "Jane",
                "http://localhost:8081/index-reset-password-page.html?token=abc123");

        // Verify send() was called exactly once
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));

        // Capture the message so we can inspect its contents
        ArgumentCaptor<SimpleMailMessage> captor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();

        assertNotNull(sent.getTo());
        assertEquals(1, sent.getTo().length);
        assertEquals("user@example.com", sent.getTo()[0]);
        assertEquals("Reset your Symph password", sent.getSubject());
        assertNotNull(sent.getText());
        assertTrue(sent.getText().contains("Hi Jane"),
                "Body should greet the user by name");
        assertTrue(sent.getText().contains("http://localhost:8081/index-reset-password-page.html?token=abc123"),
                "Body should include the reset link");
        assertTrue(sent.getText().contains("30 minutes"),
                "Body should mention the expiry window");
    }

    /**
     * A null name should fall back to a neutral greeting.
     */
    @Test
    void testSendPasswordResetEmail_NullName_UsesFallbackGreeting() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "noreply@symph.dev");

        emailService.sendPasswordResetEmail(
                "user@example.com",
                null,
                "http://localhost:8081/reset?token=abc");

        ArgumentCaptor<SimpleMailMessage> captor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        assertTrue(captor.getValue().getText().contains("Hi there"),
                "Null name should be replaced with 'there'");
    }

    // ===================== DEV-MODE FALLBACK =====================

    /**
     * When spring.mail.username is blank (no SMTP configured), the service
     * must NOT attempt to send — it should just log the link and return.
     */
    @Test
    void testSendPasswordResetEmail_NoSmtp_DoesNotSend() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "");

        emailService.sendPasswordResetEmail(
                "user@example.com",
                "Jane",
                "http://localhost:8081/reset?token=abc");

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    /**
     * Null mailUsername behaves the same as blank — dev mode.
     */
    @Test
    void testSendPasswordResetEmail_NullUsername_DoesNotSend() {
        ReflectionTestUtils.setField(emailService, "mailUsername", null);

        emailService.sendPasswordResetEmail(
                "user@example.com",
                "Jane",
                "http://localhost:8081/reset?token=abc");

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    // ===================== SMTP FAILURE HANDLING =====================

    /**
     * If the SMTP server throws, the service must swallow the exception
     * (so the reset request endpoint doesn't 500) and fall back to
     * printing the link.
     */
    @Test
    void testSendPasswordResetEmail_SmtpFails_DoesNotPropagate() {
        ReflectionTestUtils.setField(emailService, "mailUsername", "noreply@symph.dev");

        doThrow(new MailSendException("SMTP down"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        // Must not throw
        assertDoesNotThrow(() ->
                emailService.sendPasswordResetEmail(
                        "user@example.com",
                        "Jane",
                        "http://localhost:8081/reset?token=abc"));

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }
}