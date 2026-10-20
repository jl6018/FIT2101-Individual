package webapplication.dto;

/**
 * Request body for a Product Owner accepting an invitation and creating their account.
 *
 * Example JSON:
 * { "token": "…", "name": "Jordan Lee", "password": "secret123" }
 *
 * The email and role come from the invitation, not from the request.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class AcceptInviteRequest {

    private String token;
    private String name;
    private String password;

    /**
     * No-argument constructor required for JSON deserialization.
     */
    public AcceptInviteRequest() {
    }

    /**
     * Returns the invitation token.
     *
     * @return The invite token
     */
    public String getToken() { return token; }

    /**
     * Sets the invitation token.
     *
     * @param token The invite token
     */
    public void setToken(String token) { this.token = token; }

    /**
     * Returns the new user's name.
     *
     * @return The user name
     */
    public String getName() { return name; }

    /**
     * Sets the new user's name.
     *
     * @param name The user name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Returns the new user's password.
     *
     * @return The password
     */
    public String getPassword() { return password; }

    /**
     * Sets the new user's password.
     *
     * @param password The password
     */
    public void setPassword(String password) { this.password = password; }
}