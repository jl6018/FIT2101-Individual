package webapplication.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a team within the Symph web application.
 * A team has a name and a list of members.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToMany
    @JoinTable(
            name = "team_members",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnore
    private List<User> members = new ArrayList<>();

    /**
     * Default constructor.
     */
    public Team() {
    }

    /**
     * Parameterized constructor with the team's name.
     *
     * @param name The team name
     */
    public Team(String name) {
        this.name = name;
    }

    /**
     * Gets the team's unique ID.
     *
     * @return The team ID
     */
    public Long getId() { return id; }

    /**
     * Sets the team's unique ID.
     *
     * @param id The team ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the team's name.
     *
     * @return The team name
     */
    public String getName() { return name; }

    /**
     * Sets the team's name.
     *
     * @param name The team name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Gets the list of members belonging to the team.
     *
     * @return A list of User objects
     */
    public List<User> getMembers() { return members; }

    /**
     * Sets the list of members belonging to the team.
     *
     * @param members A list of User objects
     */
    public void setMembers(List<User> members) { this.members = members; }
}