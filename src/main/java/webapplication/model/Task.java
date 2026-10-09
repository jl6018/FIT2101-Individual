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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public double getEstimateHours() { return estimateHours; }
    public void setEstimateHours(double estimateHours) { this.estimateHours = estimateHours; }

    public String getAssignedTeams() { return assignedTeams; }
    public void setAssignedTeams(String assignedTeams) { this.assignedTeams = assignedTeams; }

    public String getAssignedEmployeeIds() { return assignedEmployeeIds; }
    public void setAssignedEmployeeIds(String assignedEmployeeIds) { this.assignedEmployeeIds = assignedEmployeeIds; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Sprint getSprint() { return sprint; }
    public void setSprint(Sprint sprint) { this.sprint = sprint; }

    public User getAssignedUser() { return assignedUser; }
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    public Set<Tag> getTags() { return tags; }
    public void setTags(Set<Tag> tags) { this.tags = tags; }
}