package webapplication.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

/**
 * Represents a user of the Symph web application.
 * Stores credentials, role, job title, team assignment, and the
 * password-reset token used by the "forgot password" flow.
 * Includes validation constraints for name, email, password, and role.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$",
            message = "Name can only contain letters, spaces, hyphens, and apostrophes")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a proper email like user@example.com")
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(com|org|net|edu|gov|mil|io|co|my|sg|uk|us|info|biz|dev|app)$",
            message = "Please enter a valid email with a recognized domain (e.g. user@gmail.com)"
    )
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Password must contain at least one letter and one number")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "ADMIN|EMPLOYEE|PRODUCT_OWNER",
            message = "Role must be ADMIN, EMPLOYEE, or PRODUCT_OWNER")
    private String role;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    /**
     * One-time token issued when the user requests a password reset.
     * Cleared after a successful reset, on expiry, or when a new token
     * is issued.
     */
    @Column(name = "reset_token", length = 100)
    private String resetToken;

    /**
     * The moment the reset token stops being valid.
     */
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    /**
     * Default constructor.
     */
    public User() {
    }

    /**
     * Parameterized constructor with the user's core details.
     *
     * @param name     The user's full name
     * @param email    The user's email address
     * @param password The user's password (hashed before being stored)
     * @param role     The user's role
     */
    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    /**
     * Gets the user's unique ID.
     *
     * @return The user ID
     */
    public Long getId() { return id; }

    /**
     * Sets the user's unique ID.
     *
     * @param id The user ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the user's full name.
     *
     * @return The user name
     */
    public String getName() { return name; }

    /**
     * Sets the user's full name.
     *
     * @param name The user name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Gets the user's email address.
     *
     * @return The email address
     */
    public String getEmail() { return email; }

    /**
     * Normalizes the email by trimming whitespace and lowercasing it
     * before validation runs, so "  XX@GMAIL.COM  " becomes "xx@gmail.com".
     *
     * @param email The email address
     */
    public void setEmail(String email) {
        this.email = (email == null) ? null : email.trim().toLowerCase();
    }

    /**
     * Gets the stored (hashed) password.
     *
     * @return The hashed password
     */
    public String getPassword() { return password; }

    /**
     * Sets the stored (hashed) password.
     *
     * @param password The hashed password
     */
    public void setPassword(String password) { this.password = password; }

    /**
     * Gets the user's role.
     *
     * @return The role (ADMIN, EMPLOYEE, or PRODUCT_OWNER)
     */
    public String getRole() { return role; }

    /**
     * Sets the user's role.
     *
     * @param role The role
     */
    public void setRole(String role) { this.role = role; }

    /**
     * Gets the user's job title.
     *
     * @return The job title, or null if not set
     */
    public String getJobTitle() { return jobTitle; }

    /**
     * Sets the user's job title.
     *
     * @param jobTitle The job title
     */
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    /**
     * Gets the team the user belongs to.
     *
     * @return The Team object, or null if unassigned
     */
    public Team getTeam() { return team; }

    /**
     * Sets the team the user belongs to.
     *
     * @param team The Team object
     */
    public void setTeam(Team team) { this.team = team; }

    /**
     * Gets the current password-reset token.
     *
     * @return The reset token, or null if none is active
     */
    public String getResetToken() { return resetToken; }

    /**
     * Sets the current password-reset token.
     *
     * @param resetToken The reset token
     */
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    /**
     * Gets the expiry moment of the reset token.
     *
     * @return The expiry moment, or null if none is active
     */
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }

    /**
     * Sets the expiry moment of the reset token.
     *
     * @param resetTokenExpiry The expiry moment
     */
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }
}