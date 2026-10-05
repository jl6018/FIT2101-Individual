package webapplication.controller;

import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Exposes REST endpoints for managing time logs.
 * Handles logging hours, retrieving logs by user or task, and calculating totals.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/timelogs")
@CrossOrigin
public class TimeLogController {

    private final TimeLogService timeLogService;

    /**
     * Parameterized constructor with the required TimeLogService dependency.
     *
     * @param timeLogService The service handling time log business logic
     */
    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }

    /**
     * Retrieves all time logs from the database.
     *
     * @return A list of all time logs
     */
    @GetMapping
    public List<TimeLog> getAllTimeLogs() {
        return timeLogService.getAllTimeLogs();
    }

    /**
     * Logs hours against a task for a user.
     *
     * @param timeLog The TimeLog object to save
     * @return        The saved TimeLog object with its assigned ID
     */
    @PostMapping
    public TimeLog logHours(@RequestBody TimeLog timeLog) {
        return timeLogService.logHours(timeLog);
    }

    /**
     * Retrieves all time logs for a specific user.
     *
     * @param userId The ID of the user
     * @return       A list of time logs belonging to the user
     */
    @GetMapping("/user/{userId}")
    public List<TimeLog> getLogsByUser(@PathVariable Long userId) {
        return timeLogService.getLogsByUser(userId);
    }

    /**
     * Retrieves all time logs for a specific task.
     *
     * @param taskId The ID of the task
     * @return       A list of time logs belonging to the task
     */
    @GetMapping("/task/{taskId}")
    public List<TimeLog> getLogsByTask(@PathVariable Long taskId) {
        return timeLogService.getLogsByTask(taskId);
    }

    /**
     * Calculates the total hours logged by a user within a date range.
     *
     * @param userId The ID of the user
     * @param start  The start date in ISO format
     * @param end    The end date in ISO format
     * @return       The total hours logged within the range
     */
    @GetMapping("/total/{userId}")
    public double getTotalHours(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {

        return timeLogService.getTotalHoursForUserInRange(
                userId, LocalDate.parse(start), LocalDate.parse(end));
    }
}