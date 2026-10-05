package webapplication.service;

import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public TimeLogService(TimeLogRepository timeLogRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository) {
        this.timeLogRepository = timeLogRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    public List<TimeLog> getAllTimeLogs() {
        return timeLogRepository.findAll();
    }

    // ✅ US24 — Validate + resolve user/task from DB before saving
    public TimeLog logHours(TimeLog timeLog) {
        if (timeLog.getDate() == null) {
            throw new IllegalArgumentException("Date is required");
        }
        if (timeLog.getHours() <= 0) {
            throw new IllegalArgumentException("Hours must be greater than 0");
        }

        // Resolve user from DB (frontend sends { id })
        if (timeLog.getUser() != null && timeLog.getUser().getId() != null) {
            User user = userRepository.findById(timeLog.getUser().getId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            timeLog.setUser(user);
        } else {
            throw new IllegalArgumentException("User is required");
        }

        // Resolve task from DB if given
        if (timeLog.getTask() != null && timeLog.getTask().getId() != null) {
            Task task = taskRepository.findById(timeLog.getTask().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Task not found"));
            timeLog.setTask(task);
        } else {
            timeLog.setTask(null);
        }

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
}