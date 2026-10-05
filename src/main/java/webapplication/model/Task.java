package webapplication.model;

import jakarta.persistence.*;

import java.time.LocalDate;

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

    // ✅ Teams assigned (comma-separated): "Team Alpha,Team Beta"
    @Column(name = "assigned_teams", length = 255)
    private String assignedTeams;

    // ✅ NEW — employees assigned (comma-separated user IDs): "3,5,7"
    @Column(name = "assigned_employee_ids", length = 500)
    private String assignedEmployeeIds;

    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @ManyToOne
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    public Task() {
    }

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

    public String getAssignedTeams() { return assignedTeams; }
    public void setAssignedTeams(String assignedTeams) { this.assignedTeams = assignedTeams; }

    // ✅ NEW
    public String getAssignedEmployeeIds() { return assignedEmployeeIds; }
    public void setAssignedEmployeeIds(String assignedEmployeeIds) { this.assignedEmployeeIds = assignedEmployeeIds; }

    public Sprint getSprint() { return sprint; }
    public void setSprint(Sprint sprint) { this.sprint = sprint; }

    public User getAssignedUser() { return assignedUser; }
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }
}