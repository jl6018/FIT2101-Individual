package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Manages user Create, Read, Update, Delete, login validation,
 * team assignment, job title operations, and the password-reset flow.
 * Emails are normalized to lowercase and trimmed before being stored or
 * compared, so XX@x.com and xx@x.com are treated as the same address.
 * Passwords are hashed with BCrypt before being stored; login compares
 * the raw password against the stored hash.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Base URL of the frontend, used to build the reset link in the email.
     * Defaults to the local dev server. Override with the APP_BASE_URL
     * environment variable in production.
     */
    @Value("${app.frontend.base-url:http://localhost:8081}")
    private String frontendBaseUrl;

    /**
     * How long a reset link remains valid, in minutes.
     */
    private static final int RESET_TOKEN_TTL_MINUTES = 30;

    /**
     * Parameterized constructor with the required repository dependencies,
     * the password encoder, and the email service.
     *
     * @param userRepository  The repository handling user database operations
     * @param teamRepository  The repository handling team database operations
     * @param passwordEncoder The BCrypt password encoder
     * @param emailService    The service that sends password-reset emails
     */
    public UserService(UserRepository userRepository,
                       TeamRepository teamRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Retrieves all users from the database.
     *
     * @return A list of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Retrieves a single user by their unique ID.
     *
     * @param id                The ID of the user to retrieve
     * @return                  The User object
     * @throws RuntimeException if no user with the given ID exists
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Creates a new user. The email is normalized to lowercase and trimmed
     * before the duplicate check, so XX@x.com and xx@x.com are treated as
     * the same email address. The password is hashed with BCrypt before
     * being persisted.
     *
     * @param user              The User object to save
     * @return                  The saved User object with its assigned ID
     * @throws RuntimeException if the email is already registered
     */
    public User createUser(User user) {
        String normalizedEmail = user.getEmail().trim().toLowerCase();
        user.setEmail(normalizedEmail);

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Updates an existing user's name, email, and role.
     * Password is not updated here — use the reset-password flow for that.
     *
     * @param id                The ID of the user to update
     * @param updatedUser       The User object containing the updated details
     * @return                  The updated User object
     * @throws RuntimeException if the user does not exist
     */
    public User updateUser(Long id, User updatedUser) {
        User user = getUserById(id);
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail().trim().toLowerCase());
        user.setRole(updatedUser.getRole());
        return userRepository.save(user);
    }

    /**
     * Deletes a user from the database by their ID.
     *
     * @param id The ID of the user to delete
     */
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Authenticates a user by email and password. The email is normalized
     * the same way as at registration, so casing doesn't matter.
     * The supplied password is compared against the stored BCrypt hash.
     *
     * @param email     The email entered by the user
     * @param password  The raw password entered by the user
     * @return          The User object if credentials are valid, or null if invalid
     */
    public User login(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .orElse(null);
    }

    /**
     * Updates a user's team assignment. Passing a blank team name clears the team.
     *
     * @param id                The ID of the user to update
     * @param teamName          The name of the team to assign
     * @return                  The updated User object
     * @throws RuntimeException if the user or team does not exist
     */
    public User updateTeam(Long id, String teamName) {
        User user = getUserById(id);
        if (teamName == null || teamName.isBlank()) {
            user.setTeam(null);
        } else {
            Team team = teamRepository.findByName(teamName)
                    .orElseThrow(() -> new RuntimeException("Team not found: " + teamName));
            user.setTeam(team);
        }
        return userRepository.save(user);
    }

    /**
     * Updates a user's job title.
     *
     * @param id                The ID of the user to update
     * @param jobTitle          The new job title
     * @return                  The updated User object
     * @throws RuntimeException if the user does not exist
     */
    public User updateJobTitle(Long id, String jobTitle) {
        User user = getUserById(id);
        user.setJobTitle(jobTitle);
        return userRepository.save(user);
    }

    // ===================== PASSWORD RESET =====================

    /**
     * Directly replaces a user's password given their email, without an
     * email-token round-trip. Intended for demo/offline environments where
     * SMTP is not available. In production, prefer requestPasswordReset +
     * resetPassword so the caller must prove ownership of the email.
     *
     * @param email       The email of the account to update
     * @param newPassword The new plain-text password
     * @throws IllegalArgumentException if the new password fails the policy
     * @throws RuntimeException         if no user with the given email exists
     */
    public void resetPasswordByEmail(String email, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) {
            throw new IllegalArgumentException("Password must contain at least one letter and one number");
        }

        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new RuntimeException("No account found with that email"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Issues a password-reset token for the given email, if the account exists.
     * The token is stored on the User row with a short expiry, and a reset
     * link is emailed to the address. Kept for the email-based flow.
     *
     * @param email The email address entered on the "forgot password" form
     */
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        String normalized = email.trim().toLowerCase();

        userRepository.findByEmail(normalized).ifPresent(user -> {
            String token = UUID.randomUUID().toString().replace("-", "");
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES));
            userRepository.save(user);

            String link = frontendBaseUrl + "/index-reset-password-page.html?token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), link);
        });
    }

    /**
     * Validates a reset token and, if valid, replaces the user's password
     * with a freshly hashed one. The token is cleared so it cannot be reused.
     *
     * @param token         The one-time reset token from the email link
     * @param newPassword   The new plain-text password to hash and store
     * @throws IllegalArgumentException if the new password fails the policy
     * @throws RuntimeException         if the token is unknown or expired
     */
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Invalid or expired reset link");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) {
            throw new IllegalArgumentException("Password must contain at least one letter and one number");
        }

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));

        if (user.getResetTokenExpiry() == null
                || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Reset link has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Checks whether a reset token is still valid, without changing anything.
     *
     * @param token The token to validate
     * @return      True if the token exists and has not expired
     */
    public boolean isResetTokenValid(String token) {
        if (token == null || token.isBlank()) return false;
        return userRepository.findByResetToken(token)
                .filter(u -> u.getResetTokenExpiry() != null
                        && u.getResetTokenExpiry().isAfter(LocalDateTime.now()))
                .isPresent();
    }
}