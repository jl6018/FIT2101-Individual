package webapplication.service;

import webapplication.model.TimeLog;
import webapplication.repository.TimeLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

    /**
     * Parameterized constructor with the required TimeLogRepository dependency.
     *
     * @param timeLogRepository The repository handling time log database operations
     */
    public TimeLogService(TimeLogRepository timeLogRepository) {
        this.timeLogRepository = timeLogRepository;
    }

    /**
     * Retrieves all time logs from the database.
     *
     * @return A list of all time logs
     */
    public List<TimeLog> getAllTimeLogs() {
        return timeLogRepository.findAll();
    }

    /**
     * Saves a new time log entry.
     *
     * @param timeLog The TimeLog object to save
     * @return        The saved TimeLog object with its assigned ID
     */
    public TimeLog logHours(TimeLog timeLog) {
        return timeLogRepository.save(timeLog);
    }

    /**
     * Retrieves all time logs for a specific user.
     *
     * @param userId The ID of the user
     * @return       A list of time logs belonging to the user
     */
    public List<TimeLog> getLogsByUser(Long userId) {
        return timeLogRepository.findByUserId(userId);
    }

    /**
     * Retrieves all time logs for a specific task.
     *
     * @param taskId The ID of the task
     * @return       A list of time logs belonging to the task
     */
    public List<TimeLog> getLogsByTask(Long taskId) {
        return timeLogRepository.findByTaskId(taskId);
    }

    /**
     * Calculates the total hours logged by a user within a date range.
     *
     * @param userId The ID of the user
     * @param start  The start date (inclusive)
     * @param end    The end date (inclusive)
     * @return       The total hours logged within the range
     */
    public double getTotalHoursForUserInRange(Long userId, LocalDate start, LocalDate end) {
        return timeLogRepository.findByUserId(userId).stream()
                .filter(log -> !log.getDate().isBefore(start) && !log.getDate().isAfter(end))
                .mapToDouble(TimeLog::getHours)
                .sum();
    }
}