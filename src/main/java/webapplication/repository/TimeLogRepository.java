package webapplication.repository;

import webapplication.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for performing CRUD operations on TimeLog entities.
 * Provides custom queries for filtering by user, task, date range, and sprint.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    /**
     * Finds all time logs for the given user.
     *
     * @param userId The ID of the user
     * @return       A list of time logs belonging to the user
     */
    List<TimeLog> findByUserId(Long userId);

    /**
     * Finds all time logs for the given task.
     *
     * @param taskId The ID of the task
     * @return       A list of time logs belonging to the task
     */
    List<TimeLog> findByTaskId(Long taskId);

    /**
     * Finds all time logs within the given date range.
     *
     * @param start The start date (inclusive)
     * @param end   The end date (inclusive)
     * @return      A list of time logs within the range
     */
    List<TimeLog> findByDateBetween(LocalDate start, LocalDate end);

    /**
     * Finds all time logs whose task belongs to the given sprint.
     * Traverses the TimeLog -> Task -> Sprint relationship.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of time logs for every task in that sprint
     */
    List<TimeLog> findByTaskSprintId(Long sprintId);
}