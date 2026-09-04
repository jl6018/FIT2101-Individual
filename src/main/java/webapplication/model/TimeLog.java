package webapplication.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "time_logs")
public class TimeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private double hours;

    private String description;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public TimeLog() {
    }

    public TimeLog(LocalDate date, double hours, String description, Task task, User user) {
        this.date = date;
        this.hours = hours;
        this.description = description;
        this.task = task;
        this.user = user;
    }

    public Long getId() { return id; }

    // ✅ ADD THIS METHOD
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public double getHours() { return hours; }
    public void setHours(double hours) { this.hours = hours; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}