package webapplication.model;

import jakarta.persistence.*;

/**
 * Represents a project within the Symph web application.
 * A project belongs to a team and contains sprints and tasks.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    /**
     * Default constructor.
     */
    public Project() {
    }

    /**
     * Parameterized constructor with the project's name, description, and team.
     *
     * @param name        The project name
     * @param description The project description
     * @param team        The team assigned to the project
     */
    public Project(String name, String description, Team team) {
        this.name = name;
        this.description = description;
        this.team = team;
    }

    /**
     * Gets the project's unique ID.
     *
     * @return The project ID
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the project's unique ID.
     *
     * @param id The project ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the project's name.
     *
     * @return The project name
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the project's name.
     *
     * @param name The project name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the project's description.
     *
     * @return The project description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the project's description.
     *
     * @param description The project description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the team assigned to the project.
     *
     * @return The Team object
     */
    public Team getTeam() {
        return team;
    }

    /**
     * Sets the team assigned to the project.
     *
     * @param team The Team object
     */
    public void setTeam(Team team) {
        this.team = team;
    }
}