package webapplication.controller;

import webapplication.dto.TimeLogRequest;
import webapplication.dto.TimeLogSummary;
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

    /**
     * US26 / US27: per-member summary over a date range.
     * Example: GET /api/timelogs/summary?from=2026-10-01&to=2026-10-07
     */
    @GetMapping("/summary")
    public List<TimeLogSummary> getSummary(
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getSummaryByRange(LocalDate.parse(from), LocalDate.parse(to));
    }

    /**
     * US28: a single member's logs over a date range.
     * Example: GET /api/timelogs/user/3/range?from=2026-10-01&to=2026-10-07
     */
    @GetMapping("/user/{userId}/range")
    public List<TimeLog> getLogsForUserInRange(
            @PathVariable Long userId,
            @RequestParam String from,
            @RequestParam String to) {
        return timeLogService.getLogsForUserInRange(
                userId, LocalDate.parse(from), LocalDate.parse(to));
    }
}