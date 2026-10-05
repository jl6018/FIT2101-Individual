package webapplication.controller;

import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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

    // ✅ US24 — Error-handled
    @PostMapping
    public ResponseEntity<?> logHours(@RequestBody TimeLog timeLog) {
        try {
            TimeLog saved = timeLogService.logHours(timeLog);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(e.getMessage());
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
}