package webapplication.dto;

/**
 * Payload used by the frontend when logging hours against a task.
 * The taskId and userId are resolved server-side to the actual Task and
 * User entities before the TimeLog is persisted.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class TimeLogRequest {

    private String date;
    private String startTime;
    private double hours;
    private String description;
    private Long taskId;
    private Long userId;

    /**
     * Default constructor.
     */
    public TimeLogRequest() {
    }

    /**
     * Parameterized constructor with all fields.
     *
     * @param date        ISO date string (YYYY-MM-DD)
     * @param startTime   ISO time string (HH:mm or HH:mm:ss)
     * @param hours       Hours worked
     * @param description Optional description of the work
     * @param taskId      The ID of the task the hours were logged against
     * @param userId      The ID of the user who logged the hours
     */
    public TimeLogRequest(String date, String startTime, double hours,
                          String description, Long taskId, Long userId) {
        this.date = date;
        this.startTime = startTime;
        this.hours = hours;
        this.description = description;
        this.taskId = taskId;
        this.userId = userId;
    }

    /**
     * Gets the ISO date string the hours were logged.
     *
     * @return The date string
     */
    public String getDate() { return date; }

    /**
     * Sets the ISO date string the hours were logged.
     *
     * @param date The date string
     */
    public void setDate(String date) { this.date = date; }

    /**
     * Gets the ISO time string the work session started.
     *
     * @return The start time string
     */
    public String getStartTime() { return startTime; }

    /**
     * Sets the ISO time string the work session started.
     *
     * @param startTime The start time string
     */
    public void setStartTime(String startTime) { this.startTime = startTime; }

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
     * Gets the ID of the task the hours were logged against.
     *
     * @return The task ID
     */
    public Long getTaskId() { return taskId; }

    /**
     * Sets the ID of the task the hours were logged against.
     *
     * @param taskId The task ID
     */
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    /**
     * Gets the ID of the user who logged the hours.
     *
     * @return The user ID
     */
    public Long getUserId() { return userId; }

    /**
     * Sets the ID of the user who logged the hours.
     *
     * @param userId The user ID
     */
    public void setUserId(Long userId) { this.userId = userId; }
}