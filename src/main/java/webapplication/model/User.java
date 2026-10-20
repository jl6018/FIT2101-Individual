package webapplication.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

/**
 * Represents a user of the Symph web application.
 * Stores credentials, role, job title, and team assignment.
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
     * No-argument constructor required by JPA.
     */
    public User() {
    }

    /**
     * Constructs a new User with the given name, email, password, and role.
     *
     * @param name     The user's full name
     * @param email    The user's email address
     * @param password The user's password
     * @param role     The user's role (ADMIN, EMPLOYEE, or PRODUCT_OWNER)
     */
    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    /**
     * Returns the user's unique ID.
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
     * Returns the user's full name.
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
     * Returns the user's email address.
     *
     * @return The user email
     */
    public String getEmail() { return email; }

    /**
     * Normalizes the email by trimming whitespace and lowercasing it
     * before validation runs, so "  XX@GMAIL.COM  " becomes "xx@gmail.com".
     *
     * @param email The email address to set
     */
    public void setEmail(String email) {
        this.email = (email == null) ? null : email.trim().toLowerCase();
    }

    /**
     * Returns the user's password.
     *
     * @return The user password
     */
    public String getPassword() { return password; }

    /**
     * Sets the user's password.
     *
     * @param password The user password
     */
    public void setPassword(String password) { this.password = password; }

    /**
     * Returns the user's role.
     *
     * @return The user role
     */
    public String getRole() { return role; }

    /**
     * Sets the user's role.
     *
     * @param role The user role
     */
    public void setRole(String role) { this.role = role; }

    /**
     * Returns the user's job title.
     *
     * @return The job title
     */
    public String getJobTitle() { return jobTitle; }

    /**
     * Sets the user's job title.
     *
     * @param jobTitle The job title
     */
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    /**
     * Returns the team the user is assigned to.
     *
     * @return The assigned Team, or null if unassigned
     */
    public Team getTeam() { return team; }

    /**
     * Sets the team the user is assigned to.
     *
     * @param team The Team to assign
     */
    public void setTeam(Team team) { this.team = team; }
}