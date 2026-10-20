package webapplication.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Handles sending emails, such as Product Owner invites.
 *
 * @author Lim Jia Li
 * @author Violet Arianna Ariff Hoo
 * @version 17.0.16
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Constructor with the required mail sender dependency.
     *
     * @param mailSender The Spring mail sender used to dispatch emails
     */
    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a simple plain-text email.
     *
     * @param to      The recipient's email address
     * @param subject The email subject
     * @param body    The email body text
     */
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}