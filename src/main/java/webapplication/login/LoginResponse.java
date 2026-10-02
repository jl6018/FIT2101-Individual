package webapplication.login;

/**
 * Represents the response of a successful user login to the Symph web application.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 * @since 2026-09-12
 */

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;

    /**
     * Default constructor.
     */
    public LoginResponse() {
    }

    /**
     * Parameterized constructor with the given user details.
     *
     * @param id    The user's unique ID
     * @param name  The user's full name
     * @param email The user's email address
     * @param role  The user's role (ADMIN or EMPLOYEE)
     */
    public LoginResponse(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    /**
     * Gets the user's unique ID.
     *
     * @return The user's ID
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the user's unique ID.
     *
     * @param id The user's ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the user's name.
     *
     * @return The user's name
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the user's name.
     *
     * @param name The user's name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the user's email address.
     *
     * @return The user's email address
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the user's email address.
     *
     * @param email The user's email address
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Gets the user's role (ADMIN or EMPLOYEE) in the system.
     *
     * @return The user's role (ADMIN or EMPLOYEE)
     */
    public String getRole() {
        return role;
    }

    /**
     * Sets the user's role (ADMIN or EMPLOYEE) in the system.
     *
     * @param role The user's role (ADMIN or EMPLOYEE)
     */
    public void setRole(String role) {
        this.role = role;
    }
}
