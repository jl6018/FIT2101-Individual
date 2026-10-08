package webapplication.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Represents a record of hours logged against a task by a user.
 * Used for reporting and tracking time spent on work.
 *
 * Supports a running stopwatch: when running = true, the timer is
 * in progress and startTimestamp holds the moment it began. When the
 * user presses Stop, running is set to false and hours is computed
 * from startTimestamp to now.
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

    @Column(name = "start_time")
    private LocalTime startTime;

    private double hours;

    private String description;

    /** True while a stopwatch is running for this log. */
    @Column(name = "running")
    private Boolean running = false;

    /** Wall-clock instant the stopwatch started. */
    @Column(name = "start_timestamp")
    private LocalDateTime startTimestamp;

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
     * @param startTime   The time the work session started
     * @param hours       The number of hours logged
     * @param description A description of the work done
     * @param task        The task the hours were logged against
     * @param user        The user who logged the hours
     */
    public TimeLog(LocalDate date, LocalTime startTime, double hours,
                   String description, Task task, User user) {
        this.date = date;
        this.startTime = startTime;
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
     * Gets the time the work session started.
     *
     * @return The start time
     */
    public LocalTime getStartTime() { return startTime; }

    /**
     * Sets the time the work session started.
     *
     * @param startTime The start time
     */
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

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
     * Gets whether the stopwatch is currently running.
     *
     * @return True if running, false otherwise
     */
    public Boolean getRunning() { return running; }

    /**
     * Sets whether the stopwatch is currently running.
     *
     * @param running True if running, false otherwise
     */
    public void setRunning(Boolean running) { this.running = running; }

    /**
     * Gets the wall-clock instant the stopwatch started.
     *
     * @return The start timestamp
     */
    public LocalDateTime getStartTimestamp() { return startTimestamp; }

    /**
     * Sets the wall-clock instant the stopwatch started.
     *
     * @param startTimestamp The start timestamp
     */
    public void setStartTimestamp(LocalDateTime startTimestamp) { this.startTimestamp = startTimestamp; }

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