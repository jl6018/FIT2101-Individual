package webapplication.repository;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository interface for performing CRUD operations on Task entities.
 * Provides custom queries for filtering by status, sprint, and board position.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Finds all tasks with the given status.
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks matching the status
     */
    List<Task> findByStatus(TaskStatus status);

    /**
     * Finds all tasks belonging to the given sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in the sprint
     */
    List<Task> findBySprintId(Long sprintId);

    /**
     * Finds all tasks ordered by board position, then by ID.
     *
     * @return A list of tasks in board order
     */
    List<Task> findAllByOrderByPositionAscIdAsc();

    /**
     * Finds all tasks with the given status ordered by board position, then by ID.
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks in board order
     */
    List<Task> findByStatusOrderByPositionAscIdAsc(TaskStatus status);

    /**
     * Finds all tasks in the given sprint ordered by board position, then by ID.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in board order
     */
    List<Task> findBySprintIdOrderByPositionAscIdAsc(Long sprintId);
}