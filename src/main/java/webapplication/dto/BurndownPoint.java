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

    public BurndownPoint() {
    }

    public BurndownPoint(LocalDate date, double projectedRemaining, double actualRemaining) {
        this.date = date;
        this.projectedRemaining = projectedRemaining;
        this.actualRemaining = actualRemaining;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public double getProjectedRemaining() { return projectedRemaining; }
    public void setProjectedRemaining(double projectedRemaining) { this.projectedRemaining = projectedRemaining; }

    public double getActualRemaining() { return actualRemaining; }
    public void setActualRemaining(double actualRemaining) { this.actualRemaining = actualRemaining; }
}