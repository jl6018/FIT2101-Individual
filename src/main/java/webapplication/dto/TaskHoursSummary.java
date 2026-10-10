package webapplication.dto;

/**
 * One data point for the "Hours per task" chart on the Reports page.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class TaskHoursSummary {

    private Long taskId;
    private String taskName;
    private double totalHours;

    public TaskHoursSummary() {
    }

    public TaskHoursSummary(Long taskId, String taskName, double totalHours) {
        this.taskId = taskId;
        this.taskName = taskName;
        this.totalHours = totalHours;
    }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }
}