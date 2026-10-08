package webapplication.service;

import webapplication.dto.BurndownPoint;
import webapplication.dto.TaskHours;
import webapplication.dto.TimeLogSummary;
import webapplication.model.Sprint;
import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages time log creation, retrieval, deletion, and reporting calculations.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    public TimeLogService(TimeLogRepository timeLogRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository,
                          SprintRepository sprintRepository) {
        this.timeLogRepository = timeLogRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
    }

    public List<TimeLog> getAllTimeLogs() {
        return timeLogRepository.findAll();
    }

    public TimeLog logHours(String dateStr, String startTimeStr, double hours,
                            String description, Long taskId, Long userId) {

        if (dateStr == null || dateStr.isBlank()) throw new IllegalArgumentException("Date is required");
        if (hours <= 0) throw new IllegalArgumentException("Hours must be greater than 0");
        if (taskId == null) throw new IllegalArgumentException("Task is required");
        if (userId == null) throw new IllegalArgumentException("User is required");

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

    /**
     * Deletes a single time log by its ID.
     *
     * @param id                The ID of the log to delete
     * @throws RuntimeException if no log with the given ID exists
     */
    public void deleteLog(Long id) {
        if (!timeLogRepository.existsById(id)) {
            throw new RuntimeException("Time log not found");
        }
        timeLogRepository.deleteById(id);
    }

    public List<TimeLog> getLogsByUser(Long userId) {
        return timeLogRepository.findByUserId(userId);
    }

    public List<TimeLog> getLogsByTask(Long taskId) {
        return timeLogRepository.findByTaskId(taskId);
    }

    public double getTotalHoursForUserInRange(Long userId, LocalDate start, LocalDate end) {
        return timeLogRepository.findByUserId(userId).stream()
                .filter(log -> log.getDate() != null)
                .filter(log -> !log.getDate().isBefore(start) && !log.getDate().isAfter(end))
                .mapToDouble(TimeLog::getHours)
                .sum();
    }

    public double getTotalHoursForSprint(Long sprintId) {
        return timeLogRepository.findByTaskSprintId(sprintId).stream()
                .mapToDouble(TimeLog::getHours)
                .sum();
    }

    public List<TimeLogSummary> getSummaryByRange(LocalDate from, LocalDate to) {
        List<TimeLog> logs = timeLogRepository.findByDateBetween(from, to);

        Map<Long, List<TimeLog>> byUser = logs.stream()
                .filter(l -> l.getUser() != null)
                .collect(Collectors.groupingBy(l -> l.getUser().getId()));

        List<User> allUsers = userRepository.findAll();
        List<TimeLogSummary> rows = new ArrayList<>();

        for (User u : allUsers) {
            List<TimeLog> mine = byUser.getOrDefault(u.getId(), Collections.emptyList());
            double total = mine.stream().mapToDouble(TimeLog::getHours).sum();
            long daysWorked = mine.stream().map(TimeLog::getDate).filter(Objects::nonNull).distinct().count();
            double avg = daysWorked > 0 ? total / daysWorked : 0.0;

            String teamName = (u.getTeam() != null) ? u.getTeam().getName() : "Unassigned";
            rows.add(new TimeLogSummary(u.getId(), u.getName(), teamName, total, (int) daysWorked, avg));
        }

        rows.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        return rows;
    }

    public List<TimeLog> getLogsForUserInRange(Long userId, LocalDate from, LocalDate to) {
        return timeLogRepository.findByUserId(userId).stream()
                .filter(l -> l.getDate() != null)
                .filter(l -> !l.getDate().isBefore(from) && !l.getDate().isAfter(to))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }

    public List<TaskHours> getHoursPerTask(LocalDate from, LocalDate to) {
        List<TimeLog> logs = timeLogRepository.findByDateBetween(from, to);

        Map<Long, Double> hoursByTaskId = new LinkedHashMap<>();
        Map<Long, String> nameByTaskId = new HashMap<>();

        for (TimeLog log : logs) {
            if (log.getTask() == null || log.getTask().getId() == null) continue;
            Long tid = log.getTask().getId();
            nameByTaskId.put(tid, log.getTask().getName());
            hoursByTaskId.merge(tid, log.getHours(), Double::sum);
        }

        List<TaskHours> rows = new ArrayList<>();
        for (Map.Entry<Long, Double> e : hoursByTaskId.entrySet()) {
            rows.add(new TaskHours(e.getKey(), nameByTaskId.get(e.getKey()), e.getValue()));
        }
        rows.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        return rows;
    }

    public List<BurndownPoint> getBurndown(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        LocalDate start = sprint.getStartDate();
        LocalDate end = sprint.getEndDate();
        if (start == null || end == null || end.isBefore(start)) {
            return Collections.emptyList();
        }

        List<Task> tasks = taskRepository.findBySprintId(sprintId);
        double totalEstimate = tasks.stream()
                .mapToDouble(Task::getEstimateHours)
                .sum();

        if (totalEstimate <= 0) {
            return Collections.emptyList();
        }

        List<TimeLog> logs = timeLogRepository
                .findByTaskSprintIdAndDateBetween(sprintId, start, end);

        Map<LocalDate, Double> hoursByDate = new HashMap<>();
        for (TimeLog log : logs) {
            if (log.getDate() == null) continue;
            hoursByDate.merge(log.getDate(), log.getHours(), Double::sum);
        }

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        if (totalDays <= 0) totalDays = 1;

        List<BurndownPoint> points = new ArrayList<>();
        double cumulativeLogged = 0.0;

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            double dayIndex = java.time.temporal.ChronoUnit.DAYS.between(start, d);
            double projected = totalEstimate * (1.0 - (dayIndex / (double) totalDays));

            cumulativeLogged += hoursByDate.getOrDefault(d, 0.0);
            double actual = Math.max(0.0, totalEstimate - cumulativeLogged);

            points.add(new BurndownPoint(d, projected, actual));
        }

        return points;
    }
}