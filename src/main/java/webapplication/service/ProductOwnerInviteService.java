package webapplication.service;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import webapplication.model.ProductOwnerInvite;
import webapplication.model.User;
import webapplication.repository.ProductOwnerInviteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Manages Product Owner invitation validation, creation, retrieval,
 * deletion, and invitation checks.
 * Emails are normalized to lowercase and trimmed before being stored or
 * compared, so XX@x.com and xx@x.com are treated as the same address.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class ProductOwnerInviteService {

    private final ProductOwnerInviteRepository inviteRepository;
    private final EmailService emailService;
    private final UserService userService;
    private final Validator validator;
    private final String baseUrl;

    /**
     * Parameterized constructor with the required dependencies.
     *
     * @param inviteRepository The repository handling invite database operations
     * @param emailService     The service used to email the invite link
     * @param userService      The service used to create the Product Owner's account
     * @param validator        Validates the new account's details
     * @param baseUrl          The base URL of the app, used to build the registration link
     */
    public ProductOwnerInviteService(ProductOwnerInviteRepository inviteRepository,
                                     EmailService emailService,
                                     UserService userService,
                                     Validator validator,
                                     @Value("${app.base-url:http://localhost:8080}") String baseUrl) {
        this.inviteRepository = inviteRepository;
        this.emailService = emailService;
        this.userService = userService;
        this.validator = validator;
        this.baseUrl = baseUrl;
    }

    /**
     * Validates and saves a Product Owner invite.
     * The email is trimmed and lowercased before saving so duplicates
     * differing only by case are prevented. Only emails with a recognized
     * TLD are accepted.
     *
     * @param invite                The invite to validate and save
     * @return                      The saved invite object
     * @throws IllegalArgumentException if the email is missing or invalid
     * @throws RuntimeException         if the email has already been invited, or the invite email could not be sent
     */
    public ProductOwnerInvite inviteProductOwner(ProductOwnerInvite invite) {
        if (invite == null || invite.getEmail() == null || invite.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = invite.getEmail().trim().toLowerCase();
        invite.setEmail(email);

        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(com|org|net|edu|gov|mil|io|co|my|sg|uk|us|info|biz|dev|app)$")) {
            throw new IllegalArgumentException("Invalid email format. Please use a recognized domain (e.g. user@gmail.com)");
        }

        if (inviteRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already invited");
        }

        // One-time token: the only way to register as a Product Owner is the link containing it
        invite.setToken(UUID.randomUUID().toString());
        ProductOwnerInvite saved = inviteRepository.save(invite);

        String link = baseUrl + "/index-register-page.html?invite=" + saved.getToken();
        String subject = "You've been invited to Symph";
        String body = "Hi,\n\n"
                + "You've been invited to join Symph as a Product Owner.\n\n"
                + "Create your account using the link below (it can only be used once):\n"
                + link + "\n\n"
                + "If you weren't expecting this invitation, you can ignore this email.";

        try {
            emailService.sendEmail(email, subject, body);
        } catch (MailException e) {
            // Don't leave an invite behind that the person never received
            inviteRepository.delete(saved);
            throw new RuntimeException("Could not send the invite email. Please try again.");
        }

        return saved;
    }

    /**
     * Looks up the email address an unused invite token was issued for.
     *
     * @param token The token from the invite link
     * @return      The invited email address
     * @throws RuntimeException if the token is missing, unknown, or already used
     */
    public String getEmailForToken(String token) {
        return findUnusedInvite(token).getEmail();
    }

    /**
     * Creates a Product Owner account for an unused invite token.
     * The email and the PRODUCT_OWNER role come from the invitation. The token
     * is cleared afterwards so the link cannot be used again.
     *
     * @param token    The token from the invite link
     * @param name     The new user's name
     * @param password The new user's password
     * @return         The created User
     * @throws RuntimeException if the token is invalid or used, the details fail validation,
     *                          or the email is already registered
     */
    @Transactional
    public User acceptInvite(String token, String name, String password) {
        ProductOwnerInvite invite = findUnusedInvite(token);

        User user = new User(name == null ? null : name.trim(), invite.getEmail(), password, "PRODUCT_OWNER");
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        if (!violations.isEmpty()) {
            throw new IllegalArgumentException(violations.iterator().next().getMessage());
        }

        User created = userService.createUser(user);

        invite.setToken(null);
        inviteRepository.save(invite);
        return created;
    }

    /**
     * Finds an unused invite by its token.
     *
     * @param token             The token from the invite link
     * @return                  The matching ProductOwnerInvite
     * @throws RuntimeException if the token is missing, unknown, or already used
     */
    private ProductOwnerInvite findUnusedInvite(String token) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Invalid or already used invitation");
        }
        return inviteRepository.findByToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid or already used invitation"));
    }

    /**
     * Retrieves all Product Owner invites from the database.
     *
     * @return A list of all invites
     */
    public List<ProductOwnerInvite> getAllInvites() {
        return inviteRepository.findAll();
    }

    /**
     * Retrieves a single invite by its unique ID.
     *
     * @param id                The ID of the invite to retrieve
     * @return                  The ProductOwnerInvite object
     * @throws RuntimeException if no invite with the given ID exists
     */
    public ProductOwnerInvite getInviteById(Long id) {
        return inviteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
    }

    /**
     * Deletes an invite by its ID.
     *
     * @param id                The ID of the invite to delete
     * @throws RuntimeException if no invite with the given ID exists
     */
    public void deleteInvite(Long id) {
        if (!inviteRepository.existsById(id)) {
            throw new RuntimeException("Invite not found");
        }
        inviteRepository.deleteById(id);
    }

    /**
     * Checks whether an email address has already been invited.
     * The email is normalized (trimmed and lowercased) before the check.
     *
     * @param email The email address to check
     * @return      {@code true} if the email has an existing invite, otherwise {@code false}
     */
    public boolean isInvited(String email) {
        if (email == null || email.isBlank()) return false;
        return inviteRepository.findByEmail(email.trim().toLowerCase()).isPresent();
    }
}