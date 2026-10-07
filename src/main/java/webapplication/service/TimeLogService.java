package webapplication.service;

import webapplication.dto.TimeLogSummary;
import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

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
     * US25: total hours logged across every task in a sprint.
     */
    public double getTotalHoursForSprint(Long sprintId) {
        return timeLogRepository.findByTaskSprintId(sprintId).stream()
                .mapToDouble(TimeLog::getHours)
                .sum();
    }

    /**
     * US26 / US27: per-member aggregated contribution over a date range.
     * Includes every EMPLOYEE even if they logged nothing (so the table
     * always lists the full team).
     *
     * @param from Start date (inclusive)
     * @param to   End date (inclusive)
     * @return     One summary row per employee, sorted by total hours desc
     */
    public List<TimeLogSummary> getSummaryByRange(LocalDate from, LocalDate to) {
        List<TimeLog> logs = timeLogRepository.findByDateBetween(from, to);

        // Group logs by user
        Map<Long, List<TimeLog>> byUser = logs.stream()
                .filter(l -> l.getUser() != null)
                .collect(Collectors.groupingBy(l -> l.getUser().getId()));

        // Include every employee so the table is never empty
        List<User> allUsers = userRepository.findAll();
        List<TimeLogSummary> rows = new ArrayList<>();

        for (User u : allUsers) {
            if (!"EMPLOYEE".equals(u.getRole())) continue;

            List<TimeLog> mine = byUser.getOrDefault(u.getId(), Collections.emptyList());
            double total = mine.stream().mapToDouble(TimeLog::getHours).sum();
            long daysWorked = mine.stream()
                    .map(TimeLog::getDate)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
            double avg = daysWorked > 0 ? total / daysWorked : 0.0;

            String teamName = (u.getTeam() != null) ? u.getTeam().getName() : "Unassigned";
            rows.add(new TimeLogSummary(
                    u.getId(), u.getName(), teamName, total, (int) daysWorked, avg));
        }

        rows.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        return rows;
    }

    /**
     * US28: individual member's log entries over a date range, sorted by date desc.
     *
     * @param userId The member's ID
     * @param from   Start date (inclusive)
     * @param to     End date (inclusive)
     * @return       That member's logs in the range
     */
    public List<TimeLog> getLogsForUserInRange(Long userId, LocalDate from, LocalDate to) {
        return timeLogRepository.findByUserId(userId).stream()
                .filter(l -> l.getDate() != null)
                .filter(l -> !l.getDate().isBefore(from) && !l.getDate().isAfter(to))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }
}