package webapplication.controller;

import webapplication.dto.TimeLogRequest;
import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;
import org.springframework.http.ResponseEntity;
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

    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }

    @GetMapping
    public List<TimeLog> getAllTimeLogs() {
        return timeLogService.getAllTimeLogs();
    }

    /**
     * Logs hours against a task for a user.
     * Accepts a lightweight DTO and resolves taskId/userId server-side.
     *
     * @param request The time-log request payload
     * @return        A ResponseEntity with the saved TimeLog on success
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

    @GetMapping("/user/{userId}")
    public List<TimeLog> getLogsByUser(@PathVariable Long userId) {
        return timeLogService.getLogsByUser(userId);
    }

    @GetMapping("/task/{taskId}")
    public List<TimeLog> getLogsByTask(@PathVariable Long taskId) {
        return timeLogService.getLogsByTask(taskId);
    }

    @GetMapping("/total/{userId}")
    public double getTotalHours(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {

        return timeLogService.getTotalHoursForUserInRange(
                userId, LocalDate.parse(start), LocalDate.parse(end));
    }

    /**
     * Calculates the total hours logged across every task in a sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         The total hours logged in that sprint
     */
    @GetMapping("/sprint/{sprintId}/total")
    public double getTotalHoursForSprint(@PathVariable Long sprintId) {
        return timeLogService.getTotalHoursForSprint(sprintId);
    }
}