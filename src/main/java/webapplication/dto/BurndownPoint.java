package webapplication.dto;

import java.time.LocalDate;

/**
 * One data point for the sprint burndown chart (US30).
 * For a given day in the sprint, carries the projected remaining hours and
 * the actual remaining hours.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class BurndownPoint {

    private LocalDate date;
    private double projectedRemaining;
    private double actualRemaining;

    /**
     * No-argument constructor required for JSON deserialization.
     */
    public BurndownPoint() {
    }

    /**
     * Constructs a burndown data point for a single day.
     *
     * @param date               The date of this data point
     * @param projectedRemaining The ideal remaining hours on this date
     * @param actualRemaining    The actual remaining hours on this date
     */
    public BurndownPoint(LocalDate date, double projectedRemaining, double actualRemaining) {
        this.date = date;
        this.projectedRemaining = projectedRemaining;
        this.actualRemaining = actualRemaining;
    }

    /**
     * Returns the date of this data point.
     *
     * @return The date
     */
    public LocalDate getDate() { return date; }

    /**
     * Sets the date of this data point.
     *
     * @param date The date
     */
    public void setDate(LocalDate date) { this.date = date; }

    /**
     * Returns the projected (ideal) remaining hours.
     *
     * @return The projected remaining hours
     */
    public double getProjectedRemaining() { return projectedRemaining; }

    /**
     * Sets the projected (ideal) remaining hours.
     *
     * @param projectedRemaining The projected remaining hours
     */
    public void setProjectedRemaining(double projectedRemaining) { this.projectedRemaining = projectedRemaining; }

    /**
     * Returns the actual remaining hours.
     *
     * @return The actual remaining hours
     */
    public double getActualRemaining() { return actualRemaining; }

    /**
     * Sets the actual remaining hours.
     *
     * @param actualRemaining The actual remaining hours
     */
    public void setActualRemaining(double actualRemaining) { this.actualRemaining = actualRemaining; }
}