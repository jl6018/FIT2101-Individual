package webapplication.service;

import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Manages time log creation, retrieval, and total hours calculation.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TimeLogService(TimeLogRepository timeLogRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository) {
        this.timeLogRepository = timeLogRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<TimeLog> getAllTimeLogs() {
        return timeLogRepository.findAll();
    }

    /**
     * Creates and saves a time log from raw front-end values.
     *
     * @param dateStr     ISO date string (YYYY-MM-DD), required
     * @param startTimeStr ISO time string (HH:mm), optional
     * @param hours       Hours worked, must be > 0
     * @param description Optional free-text description
     * @param taskId      The task ID to log against
     * @param userId      The user ID logging the work
     * @return            The saved TimeLog object
     * @throws IllegalArgumentException if inputs are invalid
     * @throws RuntimeException         if the task or user does not exist
     */
    public TimeLog logHours(String dateStr, String startTimeStr, double hours,
                            String description, Long taskId, Long userId) {

        if (dateStr == null || dateStr.isBlank()) {
            throw new IllegalArgumentException("Date is required");
        }
        if (hours <= 0) {
            throw new IllegalArgumentException("Hours must be greater than 0");
        }
        if (taskId == null) {
            throw new IllegalArgumentException("Task is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User is required");
        }

        LocalDate date = LocalDate.parse(dateStr);
        LocalTime startTime = (startTimeStr != null && !startTimeStr.isBlank())
                ? LocalTime.parse(startTimeStr.length() == 5 ? startTimeStr : startTimeStr + ":00")
                : null;

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeLog log = new TimeLog();
        log.setDate(date);
        log.setStartTime(startTime);
        log.setHours(hours);
        log.setDescription(description);
        log.setTask(task);
        log.setUser(user);

        return timeLogRepository.save(log);
    }

    /**
     * Legacy save method used by any remaining callers.
     */
    public TimeLog logHours(TimeLog timeLog) {
        return timeLogRepository.save(timeLog);
    }

    public List<TimeLog> getLogsByUser(Long userId) {
        return timeLogRepository.findByUserId(userId);
    }

    public List<TimeLog> getLogsByTask(Long taskId) {
        return timeLogRepository.findByTaskId(taskId);
    }

    public double getTotalHoursForUserInRange(Long userId, LocalDate start, LocalDate end) {
        return timeLogRepository.findByUserId(userId).stream()
                .filter(log -> !log.getDate().isBefore(start) && !log.getDate().isAfter(end))
                .mapToDouble(TimeLog::getHours)
                .sum();
    }

    /**
     * Calculates the total hours logged against every task in the given sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         The total hours logged in that sprint
     */
    public double getTotalHoursForSprint(Long sprintId) {
        return timeLogRepository.findByTaskSprintId(sprintId).stream()
                .mapToDouble(TimeLog::getHours)
                .sum();
    }
}