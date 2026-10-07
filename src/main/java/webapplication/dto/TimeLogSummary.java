package webapplication.dto;

/**
 * One row of the aggregated time-log summary returned to the Reports page.
 * Represents a single member's contribution over a date range.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class TimeLogSummary {

    private Long userId;
    private String name;
    private String team;
    private double totalHours;
    private int daysWorked;
    private double avgPerDay;

    public TimeLogSummary() {
    }

    public TimeLogSummary(Long userId, String name, String team,
                             double totalHours, int daysWorked, double avgPerDay) {
        this.userId = userId;
        this.name = name;
        this.team = team;
        this.totalHours = totalHours;
        this.daysWorked = daysWorked;
        this.avgPerDay = avgPerDay;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }

    public int getDaysWorked() { return daysWorked; }
    public void setDaysWorked(int daysWorked) { this.daysWorked = daysWorked; }

    public double getAvgPerDay() { return avgPerDay; }
    public void setAvgPerDay(double avgPerDay) { this.avgPerDay = avgPerDay; }
}