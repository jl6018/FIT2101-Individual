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
 * @author Atifah (tag lookup for US14)
 * @version 17.0.16
 */

public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Finds all tasks which matches the status
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks matching the status
     */
    List<Task> findByStatus(TaskStatus status);

    /**
     * Finds all tasks that belongs to the sprint
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in the sprint
     */
    List<Task> findBySprintId(Long sprintId);

    /**
     * Finds all tasks which is ordered by board and iD
     *
     * @return A list of tasks in board order
     */
    List<Task> findAllByOrderByPositionAscIdAsc();

    /**
     * Finds all tasks with the status ordered by board position then by ID.
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks in board order
     */
    List<Task> findByStatusOrderByPositionAscIdAsc(TaskStatus status);

    /**
     * Finds all tasks in the sprint then by ID.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in board order
     */
    List<Task> findBySprintIdOrderByPositionAscIdAsc(Long sprintId);

    /**
     * Finds the tasks that has that specific tag (US14).
     *
     * @param name The tag name to filter by
     * @return     A list of tasks with that tag
     */
    List<Task> findByTagsNameIgnoreCase(String name);
}