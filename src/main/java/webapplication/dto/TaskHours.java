package webapplication.dto;

/**
 * One data point for the "Hours per task" chart on the Reports page.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class TaskHours {

    private Long taskId;
    private String taskName;
    private double totalHours;

    /**
     * No-argument constructor required for JSON deserialization.
     */
    public TaskHours() {
    }

    /**
     * Constructs a TaskHours data point with all fields populated.
     *
     * @param taskId     The task's unique ID
     * @param taskName   The task name
     * @param totalHours The total hours logged against the task
     */
    public TaskHours(Long taskId, String taskName, double totalHours) {
        this.taskId = taskId;
        this.taskName = taskName;
        this.totalHours = totalHours;
    }

    /**
     * Returns the task's unique ID.
     *
     * @return The task ID
     */
    public Long getTaskId() { return taskId; }

    /**
     * Sets the task's unique ID.
     *
     * @param taskId The task ID
     */
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    /**
     * Returns the task name.
     *
     * @return The task name
     */
    public String getTaskName() { return taskName; }

    /**
     * Sets the task name.
     *
     * @param taskName The task name
     */
    public void setTaskName(String taskName) { this.taskName = taskName; }

    /**
     * Returns the total hours logged against the task.
     *
     * @return The total hours
     */
    public double getTotalHours() { return totalHours; }

    /**
     * Sets the total hours logged against the task.
     *
     * @param totalHours The total hours
     */
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }
}