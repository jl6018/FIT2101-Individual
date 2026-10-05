package webapplication.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Represents a record of hours logged against a task by a user.
 * Used for reporting and tracking time spent on work.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

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

    /**
     * Default constructor.
     */
    public TimeLog() {
    }

    /**
     * Parameterized constructor with the time log's details.
     *
     * @param date        The date the hours were logged
     * @param hours       The number of hours logged
     * @param description A description of the work done
     * @param task        The task the hours were logged against
     * @param user        The user who logged the hours
     */
    public TimeLog(LocalDate date, double hours, String description, Task task, User user) {
        this.date = date;
        this.hours = hours;
        this.description = description;
        this.task = task;
        this.user = user;
    }

    /**
     * Gets the time log's unique ID.
     *
     * @return The time log ID
     */
    public Long getId() { return id; }

    /**
     * Sets the time log's unique ID.
     *
     * @param id The time log ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Gets the date the hours were logged.
     *
     * @return The log date
     */
    public LocalDate getDate() { return date; }

    /**
     * Sets the date the hours were logged.
     *
     * @param date The log date
     */
    public void setDate(LocalDate date) { this.date = date; }

    /**
     * Gets the number of hours logged.
     *
     * @return The hours value
     */
    public double getHours() { return hours; }

    /**
     * Sets the number of hours logged.
     *
     * @param hours The hours value
     */
    public void setHours(double hours) { this.hours = hours; }

    /**
     * Gets the description of the work done.
     *
     * @return The description
     */
    public String getDescription() { return description; }

    /**
     * Sets the description of the work done.
     *
     * @param description The description
     */
    public void setDescription(String description) { this.description = description; }

    /**
     * Gets the task the hours were logged against.
     *
     * @return The Task object
     */
    public Task getTask() { return task; }

    /**
     * Sets the task the hours were logged against.
     *
     * @param task The Task object
     */
    public void setTask(Task task) { this.task = task; }

    /**
     * Gets the user who logged the hours.
     *
     * @return The User object
     */
    public User getUser() { return user; }

    /**
     * Sets the user who logged the hours.
     *
     * @param user The User object
     */
    public void setUser(User user) { this.user = user; }
}