package webapplication.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * Represents an invitation sent to a potential Product Owner.
 * Stores the invitee's email address as a unique record.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "product_owner_invites")
public class ProductOwnerInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    /**
     * One-time registration token included in the invite link.
     * Cleared once the invite has been accepted, so the link can only be used once.
     * Never sent to the browser in JSON responses.
     */
    @JsonIgnore
    @Column(unique = true)
    private String token;

    /**
     * Default constructor.
     */
    public ProductOwnerInvite() {
    }

    /**
     * Parameterized constructor with the invitee's email.
     *
     * @param email The email address of the invited Product Owner
     */
    public ProductOwnerInvite(String email) {
        this.email = email;
    }

    /**
     * Gets the invite's unique ID.
     *
     * @return The invite ID
     */
    public Long getId() { return id; }

    /**
     * Sets the invite's unique ID.
     *
     * @param id The invite ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the invitee's email address.
     *
     * @return The email address
     */
    public String getEmail() { return email; }

    /**
     * Sets the invitee's email address.
     *
     * @param email The email address
     */
    public void setEmail(String email) { this.email = email; }

    /**
     * Gets the one-time registration token (null once the invite is accepted).
     *
     * @return The token
     */
    public String getToken() { return token; }

    /**
     * Sets the one-time registration token.
     *
     * @param token The token
     */
    public void setToken(String token) { this.token = token; }
}