package webapplication.controller;

import webapplication.dto.TaskHours;
import webapplication.dto.TimeLogSummary;
import webapplication.dto.TimeLogRequest;
import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Exposes REST endpoints for managing time logs.
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
     * Constructor with the required TimeLogService dependency.
     *
     * @param timeLogService The service handling time log operations
     */
    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }

    /**
     * Retrieves all time logs.
     *
     * @return A list of all time logs
     */
    @GetMapping
    public List<TimeLog> getAllTimeLogs() {
        return timeLogService.getAllTimeLogs();
    }

    /**
     * Creates a new time log from the request body.
     *
     * @param request The time log details
     * @return        The saved TimeLog, or 400 with the error message on failure
     */
    @PostMapping
    public ResponseEntity<?> logHours(@RequestBody TimeLogRequest request) {
        try {
            TimeLog saved = timeLogService.logHours(
                    request.getDate(),
                    request.getStartTime(),
                    request.getHours(),
                    request.getDescription(),
                    request.getTaskId(),
                    request.getUserId()
            );
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Deletes a single time log by ID. Only an EMPLOYEE caller may do this,
     * so an employee can remove their own mistaken entry from the "My Logs"
     * modal. The caller's role is passed via the "X-Role" header (set by the
     * frontend after login). This is a lightweight guard, not full auth.
     *
     * @param id    The ID of the log to delete
     * @param role  The caller's role, from the X-Role header
     * @return      204 No Content on success, 403 if not an employee, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(
            @PathVariable Long id,
            @RequestHeader(value = "X-Role", required = false) String role) {

        if (!"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Only employees can delete their own time logs");
        }

        try {
            timeLogService.deleteLog(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Retrieves all time logs recorded by a specific user.
     *
     * @param userId The ID of the user
     * @return       A list of that user's time logs
     */
    @GetMapping("/user/{userId}")
    public List<TimeLog> getLogsByUser(@PathVariable Long userId) {
        return timeLogService.getLogsByUser(userId);
    }

    /**
     * Retrieves all time logs recorded against a specific task.
     *
     * @param taskId The ID of the task
     * @return       A list of time logs for that task
     */
    @GetMapping("/task/{taskId}")
    public List<TimeLog> getLogsByTask(@PathVariable Long taskId) {
        return timeLogService.getLogsByTask(taskId);
    }

    /**
     * Sums the hours a user has logged within an inclusive date range.
     *
     * @param userId The ID of the user
     * @param start  The start date (yyyy-MM-dd)
     * @param end    The end date (yyyy-MM-dd)
     * @return       The total hours logged
     */
    @GetMapping("/total/{userId}")
    public double getTotalHours(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        return timeLogService.getTotalHoursForUserInRange(
                userId, LocalDate.parse(start), LocalDate.parse(end));
    }

    /**
     * Sums all hours logged against tasks in a sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         The total hours logged for the sprint
     */
    @GetMapping("/sprint/{sprintId}/total")
    public double getTotalHoursForSprint(@PathVariable Long sprintId) {
        return timeLogService.getTotalHoursForSprint(sprintId);
    }

    /**
     * Builds the per-member contribution summary for a date range.
     *
     * @param from The start date (yyyy-MM-dd)
     * @param to   The end date (yyyy-MM-dd)
     * @return     A list of TimeLogSummary rows
     */
    @GetMapping("/summary")
    public List<TimeLogSummary> getSummary(
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getSummaryByRange(LocalDate.parse(from), LocalDate.parse(to));
    }

    /**
     * Retrieves a user's logs within a date range, newest first.
     *
     * @param userId The ID of the user
     * @param from   The start date (yyyy-MM-dd)
     * @param to     The end date (yyyy-MM-dd)
     * @return       A list of matching time logs
     */
    @GetMapping("/user/{userId}/range")
    public List<TimeLog> getLogsForUserInRange(
            @PathVariable Long userId,
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getLogsForUserInRange(
                userId, LocalDate.parse(from), LocalDate.parse(to));
    }

    /**
     * Aggregates hours logged per task within a date range.
     *
     * @param from The start date (yyyy-MM-dd)
     * @param to   The end date (yyyy-MM-dd)
     * @return     A list of TaskHours rows
     */
    @GetMapping("/by-task")
    public List<TaskHours> getHoursPerTask(
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getHoursPerTask(LocalDate.parse(from), LocalDate.parse(to));
    }

    /**
     * Computes the burndown chart data points for a sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         The burndown points, or 404 if the sprint does not exist
     */
    @GetMapping("/burndown/{sprintId}")
    public ResponseEntity<?> getBurndown(@PathVariable Long sprintId) {
        try {
            return ResponseEntity.ok(timeLogService.getBurndown(sprintId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}