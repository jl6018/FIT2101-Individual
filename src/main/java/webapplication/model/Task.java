package webapplication.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Represents a task within the Symph web application.
 * A task belongs to a sprint and may be assigned to a user and/or team.
 * Includes a position field for Trello-style drag-and-drop ordering.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    private int progress;

    private LocalDate dueDate;

    @Column(name = "estimate_hours")
    private double estimateHours;

    @Column(name = "assigned_teams", length = 255)
    private String assignedTeams;

    @Column(name = "assigned_employee_ids", length = 500)
    private String assignedEmployeeIds;

    @Column(name = "task_position")
    private Integer position;

    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @ManyToOne
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "task_tags",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @JsonIgnoreProperties("hibernateLazyInitializer")
    private Set<Tag> tags = new HashSet<>();

    /**
     * Default constructor.
     */
    public Task() {
    }

    /**
     * Parameterized constructor with the task's core details.
     *
     * @param name        The task name
     * @param description The task description
     * @param status      The task status
     * @param priority    The task priority
     * @param progress    The progress percentage
     * @param dueDate     The task due date
     * @param sprint      The sprint the task belongs to
     * @param assignedUser The user assigned to the task
     */
    public Task(
            String name,
            String description,
            TaskStatus status,
            Priority priority,
            int progress,
            LocalDate dueDate,
            Sprint sprint,
            User assignedUser) {

        this.name = name;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.progress = progress;
        this.dueDate = dueDate;
        this.sprint = sprint;
        this.assignedUser = assignedUser;
    }

    /**
     * Gets the task's unique ID.
     *
     * @return The task ID
     */
    public Long getId() { return id; }

    /**
     * Sets the task's unique ID.
     *
     * @param id The task ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the task's name.
     *
     * @return The task name
     */
    public String getName() { return name; }

    /**
     * Sets the task's name.
     *
     * @param name The task name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Gets the task's description.
     *
     * @return The task description
     */
    public String getDescription() { return description; }

    /**
     * Sets the task's description.
     *
     * @param description The task description
     */
    public void setDescription(String description) { this.description = description; }

    /**
     * Gets the task's status.
     *
     * @return The TaskStatus
     */
    public TaskStatus getStatus() { return status; }

    /**
     * Sets the task's status.
     *
     * @param status The TaskStatus
     */
    public void setStatus(TaskStatus status) { this.status = status; }

    /**
     * Gets the task's priority.
     *
     * @return The Priority
     */
    public Priority getPriority() { return priority; }

    /**
     * Sets the task's priority.
     *
     * @param priority The Priority
     */
    public void setPriority(Priority priority) { this.priority = priority; }

    /**
     * Gets the task's progress percentage.
     *
     * @return The progress value
     */
    public int getProgress() { return progress; }

    /**
     * Sets the task's progress percentage.
     *
     * @param progress The progress value
     */
    public void setProgress(int progress) { this.progress = progress; }

    /**
     * Gets the task's due date.
     *
     * @return The due date
     */
    public LocalDate getDueDate() { return dueDate; }

    /**
     * Sets the task's due date.
     *
     * @param dueDate The due date
     */
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    /**
     * Gets the task's estimated hours.
     *
     * @return The estimate in hours
     */
    public double getEstimateHours() { return estimateHours; }

    /**
     * Sets the task's estimated hours.
     *
     * @param estimateHours The estimate in hours
     */
    public void setEstimateHours(double estimateHours) { this.estimateHours = estimateHours; }

    /**
     * Gets the comma-separated list of teams assigned to the task.
     *
     * @return The assigned teams
     */
    public String getAssignedTeams() { return assignedTeams; }

    /**
     * Sets the comma-separated list of teams assigned to the task.
     *
     * @param assignedTeams The assigned teams
     */
    public void setAssignedTeams(String assignedTeams) { this.assignedTeams = assignedTeams; }

    /**
     * Gets the comma-separated list of employee IDs assigned to the task.
     *
     * @return The assigned employee IDs
     */
    public String getAssignedEmployeeIds() { return assignedEmployeeIds; }

    /**
     * Sets the comma-separated list of employee IDs assigned to the task.
     *
     * @param assignedEmployeeIds The assigned employee IDs
     */
    public void setAssignedEmployeeIds(String assignedEmployeeIds) { this.assignedEmployeeIds = assignedEmployeeIds; }

    /**
     * Gets the task's position for board ordering.
     *
     * @return The position value
     */
    public Integer getPosition() { return position; }

    /**
     * Sets the task's position for board ordering.
     *
     * @param position The position value
     */
    public void setPosition(Integer position) { this.position = position; }

    /**
     * Gets the sprint the task belongs to.
     *
     * @return The Sprint object
     */
    public Sprint getSprint() { return sprint; }

    /**
     * Sets the sprint the task belongs to.
     *
     * @param sprint The Sprint object
     */
    public void setSprint(Sprint sprint) { this.sprint = sprint; }

    /**
     * Gets the user assigned to the task.
     *
     * @return The User object
     */
    public User getAssignedUser() { return assignedUser; }

    /**
     * Sets the user assigned to the task.
     *
     * @param assignedUser The User object
     */
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    /**
     * Gets the tags attached to this task.
     *
     * @return A set of Tag objects
     */
    public Set<Tag> getTags() { return tags; }

    /**
     * Sets the tags attached to this task.
     *
     * @param tags A set of Tag objects
     */
    public void setTags(Set<Tag> tags) { this.tags = tags; }
}