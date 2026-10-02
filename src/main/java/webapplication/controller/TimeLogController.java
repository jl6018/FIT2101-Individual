package webapplication.controller;

import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;
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

    @PostMapping
    public TimeLog logHours(@RequestBody TimeLog timeLog) {
        return timeLogService.logHours(timeLog);
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