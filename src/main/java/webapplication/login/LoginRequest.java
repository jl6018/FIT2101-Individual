package webapplication.login;

/**
 * Represents the request when a user attempts to log in to the Symph web application.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 * @since 2026-09-12
 */

public class LoginRequest {

    private String email;
    private String password;

    /**
     * Default constructor.
     */
    public LoginRequest() {
    }

    /**
     * Parameterized constructor with the given email and password.
     *
     * @param email    The user's email address
     * @param password The user's password
     */
    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    /**
     * Gets the email address submitted by the user.
     *
     * @return The user's email address
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email address submitted by the user.
     *
     * @param email The user's email address
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Gets the password submitted by the user.
     *
     * @return The user's password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password submitted by the user.
     *
     * @param password The user's password
     */
    public void setPassword(String password) {
        this.password = password;
    }
}