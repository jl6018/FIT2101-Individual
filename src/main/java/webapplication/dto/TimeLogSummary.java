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

    /**
     * No-argument constructor required for JSON deserialization.
     */
    public TimeLogSummary() {
    }

    /**
     * Constructs a summary row with all fields populated.
     *
     * @param userId     The user's unique ID
     * @param name       The user's name
     * @param team       The user's team name, or "Unassigned" if none
     * @param totalHours The total hours logged in the range
     * @param daysWorked The number of distinct days with logged hours
     * @param avgPerDay  The average hours logged per working day
     */
    public TimeLogSummary(Long userId, String name, String team,
                          double totalHours, int daysWorked, double avgPerDay) {
        this.userId = userId;
        this.name = name;
        this.team = team;
        this.totalHours = totalHours;
        this.daysWorked = daysWorked;
        this.avgPerDay = avgPerDay;
    }

    /**
     * Returns the user's unique ID.
     *
     * @return The user ID
     */
    public Long getUserId() { return userId; }

    /**
     * Sets the user's unique ID.
     *
     * @param userId The user ID
     */
    public void setUserId(Long userId) { this.userId = userId; }

    /**
     * Returns the user's name.
     *
     * @return The user name
     */
    public String getName() { return name; }

    /**
     * Sets the user's name.
     *
     * @param name The user name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Returns the user's team name.
     *
     * @return The team name
     */
    public String getTeam() { return team; }

    /**
     * Sets the user's team name.
     *
     * @param team The team name
     */
    public void setTeam(String team) { this.team = team; }

    /**
     * Returns the total hours logged in the range.
     *
     * @return The total hours
     */
    public double getTotalHours() { return totalHours; }

    /**
     * Sets the total hours logged in the range.
     *
     * @param totalHours The total hours
     */
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }

    /**
     * Returns the number of distinct days worked.
     *
     * @return The days worked count
     */
    public int getDaysWorked() { return daysWorked; }

    /**
     * Sets the number of distinct days worked.
     *
     * @param daysWorked The days worked count
     */
    public void setDaysWorked(int daysWorked) { this.daysWorked = daysWorked; }

    /**
     * Returns the average hours logged per working day.
     *
     * @return The average hours per day
     */
    public double getAvgPerDay() { return avgPerDay; }

    /**
     * Sets the average hours logged per working day.
     *
     * @param avgPerDay The average hours per day
     */
    public void setAvgPerDay(double avgPerDay) { this.avgPerDay = avgPerDay; }
}