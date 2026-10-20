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
 * Comments on a task are stored in the {@link TaskComment} entity.
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
     * Returns the task's unique ID.
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
     * Returns the task name.
     *
     * @return The task name
     */
    public String getName() { return name; }

    /**
     * Sets the task name.
     *
     * @param name The task name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Returns the task description.
     *
     * @return The task description
     */
    public String getDescription() { return description; }

    /**
     * Sets the task description.
     *
     * @param description The task description
     */
    public void setDescription(String description) { this.description = description; }

    /**
     * Returns the task status.
     *
     * @return The task status
     */
    public TaskStatus getStatus() { return status; }

    /**
     * Sets the task status.
     *
     * @param status The task status
     */
    public void setStatus(TaskStatus status) { this.status = status; }

    /**
     * Returns the task priority.
     *
     * @return The task priority
     */
    public Priority getPriority() { return priority; }

    /**
     * Sets the task priority.
     *
     * @param priority The task priority
     */
    public void setPriority(Priority priority) { this.priority = priority; }

    /**
     * Returns the task progress percentage.
     *
     * @return The progress percentage
     */
    public int getProgress() { return progress; }

    /**
     * Sets the task progress percentage.
     *
     * @param progress The progress percentage
     */
    public void setProgress(int progress) { this.progress = progress; }

    /**
     * Returns the task due date.
     *
     * @return The due date
     */
    public LocalDate getDueDate() { return dueDate; }

    /**
     * Sets the task due date.
     *
     * @param dueDate The due date
     */
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    /**
     * Returns the estimated hours for the task.
     *
     * @return The estimated hours
     */
    public double getEstimateHours() { return estimateHours; }

    /**
     * Sets the estimated hours for the task.
     *
     * @param estimateHours The estimated hours
     */
    public void setEstimateHours(double estimateHours) { this.estimateHours = estimateHours; }

    /**
     * Returns the assigned team names.
     *
     * @return The assigned team names
     */
    public String getAssignedTeams() { return assignedTeams; }

    /**
     * Sets the assigned team names.
     *
     * @param assignedTeams The assigned team names
     */
    public void setAssignedTeams(String assignedTeams) { this.assignedTeams = assignedTeams; }

    /**
     * Returns the assigned employee IDs.
     *
     * @return The assigned employee IDs
     */
    public String getAssignedEmployeeIds() { return assignedEmployeeIds; }

    /**
     * Sets the assigned employee IDs.
     *
     * @param assignedEmployeeIds The assigned employee IDs
     */
    public void setAssignedEmployeeIds(String assignedEmployeeIds) { this.assignedEmployeeIds = assignedEmployeeIds; }

    /**
     * Returns the task's position for drag-and-drop ordering.
     *
     * @return The position value
     */
    public Integer getPosition() { return position; }

    /**
     * Sets the task's position for drag-and-drop ordering.
     *
     * @param position The position value
     */
    public void setPosition(Integer position) { this.position = position; }

    /**
     * Returns the sprint this task belongs to.
     *
     * @return The associated Sprint
     */
    public Sprint getSprint() { return sprint; }

    /**
     * Sets the sprint this task belongs to.
     *
     * @param sprint The associated Sprint
     */
    public void setSprint(Sprint sprint) { this.sprint = sprint; }

    /**
     * Returns the user assigned to the task.
     *
     * @return The assigned User
     */
    public User getAssignedUser() { return assignedUser; }

    /**
     * Sets the user assigned to the task.
     *
     * @param assignedUser The assigned User
     */
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    /**
     * Returns the tags associated with the task.
     *
     * @return The set of tags
     */
    public Set<Tag> getTags() { return tags; }

    /**
     * Sets the tags associated with the task.
     *
     * @param tags The set of tags
     */
    public void setTags(Set<Tag> tags) { this.tags = tags; }
}