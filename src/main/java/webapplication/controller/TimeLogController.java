package webapplication.controller;

import webapplication.dto.TaskHoursSummary;
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

    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }

    @GetMapping
    public List<TimeLog> getAllTimeLogs() {
        return timeLogService.getAllTimeLogs();
    }

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

    @GetMapping("/sprint/{sprintId}/total")
    public double getTotalHoursForSprint(@PathVariable Long sprintId) {
        return timeLogService.getTotalHoursForSprint(sprintId);
    }

    @GetMapping("/summary")
    public List<TimeLogSummary> getSummary(
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getSummaryByRange(LocalDate.parse(from), LocalDate.parse(to));
    }

    @GetMapping("/user/{userId}/range")
    public List<TimeLog> getLogsForUserInRange(
            @PathVariable Long userId,
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getLogsForUserInRange(
                userId, LocalDate.parse(from), LocalDate.parse(to));
    }

    @GetMapping("/by-task")
    public List<TaskHoursSummary> getHoursPerTask(
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getHoursPerTask(LocalDate.parse(from), LocalDate.parse(to));
    }

    @GetMapping("/burndown/{sprintId}")
    public ResponseEntity<?> getBurndown(@PathVariable Long sprintId) {
        try {
            return ResponseEntity.ok(timeLogService.getBurndown(sprintId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}