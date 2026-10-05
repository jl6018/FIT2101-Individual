package webapplication.model;

import jakarta.persistence.*;

import java.time.LocalDate;

/**
 * Represents a sprint within the Symph web application.
 * A sprint belongs to a project and has a status, date range, and member count.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "sprints")
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private SprintStatus status;

    private int memberCount;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    /**
     * Default constructor.
     */
    public Sprint() {
    }

    /**
     * Parameterized constructor with the sprint's details.
     *
     * @param name        The sprint name
     * @param startDate   The sprint start date
     * @param endDate     The sprint end date
     * @param status      The sprint status
     * @param project     The project the sprint belongs to
     */
    public Sprint(String name, LocalDate startDate, LocalDate endDate,
                  SprintStatus status, Project project) {
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.project = project;
    }

    /**
     * Gets the sprint's unique ID.
     *
     * @return The sprint ID
     */
    public Long getId() { return id; }

    /**
     * Sets the sprint's unique ID.
     *
     * @param id The sprint ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the sprint's name.
     *
     * @return The sprint name
     */
    public String getName() { return name; }

    /**
     * Sets the sprint's name.
     *
     * @param name The sprint name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Gets the sprint's start date.
     *
     * @return The start date
     */
    public LocalDate getStartDate() { return startDate; }

    /**
     * Sets the sprint's start date.
     *
     * @param startDate The start date
     */
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    /**
     * Gets the sprint's end date.
     *
     * @return The end date
     */
    public LocalDate getEndDate() { return endDate; }

    /**
     * Sets the sprint's end date.
     *
     * @param endDate The end date
     */
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    /**
     * Gets the sprint's status.
     *
     * @return The SprintStatus
     */
    public SprintStatus getStatus() { return status; }

    /**
     * Sets the sprint's status.
     *
     * @param status The SprintStatus
     */
    public void setStatus(SprintStatus status) { this.status = status; }

    /**
     * Gets the number of members involved in the sprint.
     *
     * @return The member count
     */
    public int getMemberCount() { return memberCount; }

    /**
     * Sets the number of members involved in the sprint.
     *
     * @param memberCount The member count
     */
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }

    /**
     * Gets the project the sprint belongs to.
     *
     * @return The Project object
     */
    public Project getProject() { return project; }

    /**
     * Sets the project the sprint belongs to.
     *
     * @param project The Project object
     */
    public void setProject(Project project) { this.project = project; }
}