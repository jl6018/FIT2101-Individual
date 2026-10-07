package webapplication.dto;

/**
 * Represents the response returned after a successful login to the Symph web application.
 * Contains the authenticated user's profile details and team information.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String team;

    /**
     * Default constructor.
     */
    public LoginResponse() {
    }

    /**
     * Parameterized constructor with the authenticated user's details.
     *
     * @param id    The user's unique ID
     * @param name  The user's full name
     * @param email The user's email address
     * @param role  The user's role
     * @param team  The name of the user's team
     */
    public LoginResponse(Long id, String name, String email, String role, String team) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.team = team;
    }

    /**
     * Gets the user's unique ID.
     *
     * @return The user's ID
     */
    public Long getId() { return id; }

    /**
     * Sets the user's unique ID.
     *
     * @param id The user's ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the user's full name.
     *
     * @return The user's name
     */
    public String getName() { return name; }

    /**
     * Sets the user's full name.
     *
     * @param name The user's name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Gets the user's email address.
     *
     * @return The user's email
     */
    public String getEmail() { return email; }

    /**
     * Sets the user's email address.
     *
     * @param email The user's email
     */
    public void setEmail(String email) { this.email = email; }

    /**
     * Gets the user's role.
     *
     * @return The user's role
     */
    public String getRole() { return role; }

    /**
     * Sets the user's role.
     *
     * @param role The user's role
     */
    public void setRole(String role) { this.role = role; }

    /**
     * Gets the name of the user's team.
     *
     * @return The team name, or null if the user has no team
     */
    public String getTeam() { return team; }

    /**
     * Sets the name of the user's team.
     *
     * @param team The team name
     */
    public void setTeam(String team) { this.team = team; }
}